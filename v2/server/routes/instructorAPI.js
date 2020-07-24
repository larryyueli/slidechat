const fs = require('fs');
const path = require('path');
const express = require('express');
const PDFImage = require('../lib/pdf-image').PDFImage;
const { ObjectID } = require('mongodb');

const { fileStorage, convertOptions } = require('../config');
const { isNotValidPage, notExistInList, errorHandler, questionCount } = require('./util');

function instructorAPI(db, instructorAuth) {
	let router = express.Router();

	const users = db.collection('users');
	const courses = db.collection('courses');
	const slides = db.collection('slides');

	/**
	 * get the courses the user joined, either as an instructor or a student
	 */
	router.get('/api/myCourses', instructorAuth, async (req, res) => {
		try {
			let user = await users.findOne({ _id: req.session.uid }, { projection: { courses: 1 } });
			if (!user) return res.json([]); // does not need to initialize here
			res.json(user.courses);
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * get the unused questions of a slide
	 * req query:
	 *   id: slideId
	 */
	router.get('/api/unusedQuestions', instructorAuth, async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.id) },
				{ projection: { unused: 1 } }
			);
			if (!slide) return res.sendStatus(404);
			let result = slide.unused;
			if (!result) return res.send([]);
			for (let i = 0; i < result.length; i++) {
				for (let question of result[i].questions) {
					if (question) {
						delete question.chats;
					}
				}
			}
			res.json(result);
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * create a new course
	 * req body:
	 *   course: course name
	 */
	router.post('/api/createCourse', instructorAuth, async (req, res) => {
		try {
			let insertRes = await courses.insertOne({
				name: req.body.course,
				instructors: [req.session.uid],
				slides: [],
			});

			let courseID = insertRes.ops[0]._id.toHexString();

			let updateRes = await users.updateOne(
				{ _id: req.session.uid },
				{ $push: { courses: { role: 'instructor', id: courseID } } },
				{ upsert: true }
			);

			if (updateRes.modifiedCount === 0 && updateRes.upsertedCount === 0) {
				throw 'createCourse update failed';
			}

			console.log(`created course: ${req.body.course}`);
			res.json({ id: courseID });
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * add a new instructor to a course
	 * body:
	 *   newUser: userID
	 *   course: object ID of a course
	 */
	router.post('/api/addInstructor', instructorAuth, async (req, res) => {
		try {
			if (typeof req.body.newUser !== 'string' || !req.body.newUser) {
				throw { status: 400, error: 'bad request' };
			}
			let course = await courses.findOne(
				{ _id: ObjectID.createFromHexString(req.body.course) },
				{ projection: { instructors: 1 } }
			);
			if (!course) throw { status: 404, error: 'course not found' };
			if (course.instructors.indexOf(req.session.uid) < 0) throw { status: 401, error: 'Unauthorized' };

			// add instructor to course
			let updateRes = await courses.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.course) },
				{ $addToSet: { instructors: req.body.newUser } }
			);

			if (updateRes.modifiedCount !== 1) {
				throw `add instructor failed, modifiedCount = ${updateRes.modifiedCount}`;
			}

			// add course to instructor's course list, create user if not exist
			updateRes = await users.updateOne(
				{ _id: req.body.newUser },
				{ $addToSet: { courses: { role: 'instructor', id: req.body.course } } },
				{ upsert: true }
			);

			if (updateRes.modifiedCount === 0 && updateRes.upsertedCount === 0) {
				throw 'add course to instructor failed';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * add a new slide to course
	 * req body:
	 *   cid: course id
	 *   anonymity: anonymity level of the slide
	 * req.files:
	 *   file: *.pdf
	 */
	router.post('/api/addSlide', instructorAuth, async (req, res) => {
		try {
			if (
				req.body.cid.length != 24 ||
				['anyone', 'student', 'nonymous'].indexOf(req.body.anonymity) < 0 ||
				!req.files.file ||
				!req.files.file.name.toLocaleLowerCase().endsWith('.pdf')
			) {
				return res.status(400).send();
			}
			let course = await courses.findOne({ _id: ObjectID.createFromHexString(req.body.cid) });

			if (!course) {
				throw { status: 400, error: 'course not exist' };
			} else if (false) {
				// check in instructor's list TODO: UNSAFE
				throw { status: 403, error: 'Unauthorized' };
			}

			// Step 1: insert into database to get a ObjectID
			let insertRes = await slides.insertOne({
				filename: req.files.file.name,
				anonymity: req.body.anonymity,
			});

			// Step 2: use the id as the directory name, create a directory, move pdf to directory
			let objID = insertRes.ops[0]._id;
			let id = objID.toHexString();
			let dir = path.join(fileStorage, id);
			// overwrite if exists. should not happen: id is unique
			if (fs.existsSync(dir)) {
				console.log(`Directory ${id} already exists, overwriting...`);
				await fs.promises.rmdir(dir, { recursive: true });
			}
			await fs.promises.mkdir(dir, { recursive: true });
			await req.files.file.mv(path.join(dir, req.files.file.name));

			// Step 3: convert to images
			let pdfImage = new PDFImage(path.join(dir, req.files.file.name), {
				pdfFileBaseName: 'page',
				outputDirectory: dir,
				convertOptions: convertOptions,
			});
			let imagePaths = await pdfImage.convertFile();

			// Step 4: create the list of pages, update database
			let pages = imagePaths.map((_) => {
				return { questions: [] };
			});
			let updateRes = await slides.updateOne(
				{ _id: objID },
				{
					$set: {
						pages: pages,
						pageTotal: imagePaths.length,
						unused: [],
					},
				}
			);
			if (updateRes.modifiedCount !== 1) {
				throw 'slide add pages failed';
			}

			// step 5: add slide to its course
			updateRes = await courses.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.cid) },
				{ $push: { slides: id } }
			);
			if (updateRes.modifiedCount !== 1) {
				throw 'slide add to course failed';
			}

			res.json({ id: id });
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * upload a new version of slide
	 * req body:
	 *   sid: the old slide id
	 * req.files:
	 *   file: *.pdf
	 */
	router.post('/api/uploadNewSlide', instructorAuth, async (req, res) => {
		try {
			if (
				req.body.sid.length != 24 ||
				!req.files.file ||
				!req.files.file.name.toLocaleLowerCase().endsWith('.pdf')
			) {
				return res.status(400).send();
			}
			let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) });

			if (!slide) {
				throw { status: 400, error: 'slide not exist' };
			} else if (false) {
				// check in instructor's list TODO: UNSAFE
				throw { status: 403, error: 'Unauthorized' };
			}

			let dir = path.join(fileStorage, req.body.sid);
			// remove old slide
			if (fs.existsSync(dir)) {
				await fs.promises.rmdir(dir, { recursive: true });
			}
			await fs.promises.mkdir(dir, { recursive: true });
			await req.files.file.mv(path.join(dir, req.files.file.name));

			// Step 3: convert to images
			let pdfImage = new PDFImage(path.join(dir, req.files.file.name), {
				pdfFileBaseName: 'page',
				outputDirectory: dir,
				convertOptions: convertOptions,
			});
			let imagePaths = await pdfImage.convertFile();

			// Step 4: create the list of pages, update database
			let pages = slide.pages;
			let oldLength = pages.length;
			let newLength = imagePaths.length;
			let updateRes;
			if (oldLength > newLength) {
				// remove empty pages
				let i = newLength;
				while (i < pages.length) {
					if (questionCount(pages[i].questions) === 0) {
						pages.splice(i, 1);
					} else {
						i++;
					}
				}
				updateRes = await slides.updateOne(
					{ _id: ObjectID.createFromHexString(req.body.sid) },
					{
						$set: {
							pages: pages.slice(0, newLength),
							pageTotal: newLength,
							filename: req.files.file.name,
						},
						$push: {
							unused: {
								$each: pages.slice(newLength), // your batch
							},
						},
					}
				);
			} else {
				// add empty pages to new pages
				for (let i = oldLength; i < newLength; i++) {
					pages.push({ questions: [] });
				}
				updateRes = await slides.updateOne(
					{ _id: ObjectID.createFromHexString(req.body.sid) },
					{
						$set: {
							pages: pages,
							pageTotal: newLength,
							filename: req.files.file.name,
						},
					}
				);
			}

			if (updateRes.result.n == 0) {
				throw { status: 400, error: 'upload new slide failed' };
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * post audio to page
	 * req body:
	 *   sid: object ID of the slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 * req.files:
	 *   file: *.mp3
	 */
	router.post('/api/audio', instructorAuth, async (req, res) => {
		try {
			if (
				req.body.sid.length != 24 ||
				!req.files.file ||
				!req.files.file.name.toLocaleLowerCase().endsWith('.mp3')
			) {
				return res.status(400).send();
			}
			let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) });

			if (!slide) {
				throw { status: 400, error: 'slide not exist' };
			}
			if (isNotValidPage(req.body.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}

			let dir = path.join(fileStorage, req.body.sid, req.body.pageNum);
			// remove old audio
			if (fs.existsSync(dir)) {
				await fs.promises.rmdir(dir, { recursive: true });
			}
			await fs.promises.mkdir(dir, { recursive: true });
			await req.files.file.mv(path.join(dir, req.files.file.name));

			let updateQuery = {};
			updateQuery[`pages.${req.body.pageNum - 1}.audio`] = req.files.file.name;
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{
					$set: updateQuery,
				}
			);
			if (updateRes.modifiedCount !== 1) {
				throw 'audio upload failed';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * delete audio to page
	 * req query:
	 *   sid: object ID of the slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 */
	router.delete('/api/audio', instructorAuth, async (req, res) => {
		try {
			if (req.query.sid.length != 24) {
				return res.status(400).send();
			}
			let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.query.sid) });

			if (!slide) {
				throw { status: 400, error: 'slide not exist' };
			}
			if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}

			let dir = path.join(fileStorage, req.query.sid, req.query.pageNum);
			// remove old audio
			if (fs.existsSync(dir)) {
				await fs.promises.rmdir(dir, { recursive: true });
			}

			let updateQuery = {};
			updateQuery[`pages.${req.query.pageNum - 1}.audio`] = null;
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.query.sid) },
				{
					$set: updateQuery,
				}
			);
			if (updateRes.modifiedCount !== 1) {
				throw 'audio upload failed';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * reorder the questions of a slide
	 * req body:
	 *   questionOrder: the order of questions
	 *   sid: the slide id
	 */
	router.post('/api/reorderQuestions', instructorAuth, async (req, res) => {
		try {
			if (req.body.sid.length != 24) {
				return res.status(400).send();
			}
			let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) });

			if (!slide) {
				throw { status: 400, error: 'slide not exist' };
			} else if (false) {
				// check in instructor's list TODO: UNSAFE
				throw { status: 403, error: 'Unauthorized' };
			} else if (req.body.questionOrder.length != slide.pages.length) {
				throw { status: 400, error: 'length not match' };
			}

			let usedPage = {};
			let newPages = [];
			let unusedLength = 0;
			if (slide.unused) {
				unusedLength = slide.unused.length;
			}
			for (let orders of req.body.questionOrder) {
				let newPage = { questions: [] };
				for (let order of orders) {
					order -= 1;
					if (!Number.isInteger(order) || usedPage[order] || order >= unusedLength + slide.pages.length) {
						throw { status: 400, error: 'Bad Request!' };
					}
					usedPage[order] = 1;
					if (order < slide.pages.length) {
						newPage.questions.push(...slide.pages[order].questions);
					} else {
						newPage.questions.push(...slide.unused[order - slide.pageTotal].questions);
					}
				}
				newPages.push(newPage);
			}

			let newUnused = [];
			for (let i = 0; i < slide.pages.length; i++) {
				if (!usedPage[i] && questionCount(slide.pages[i].questions)) {
					newUnused.push(slide.pages[i]);
				}
			}
			for (let i = 0; i < slide.unused.length; i++) {
				if (!usedPage[i + slide.pages.length] && questionCount(slide.unused[i].questions)) {
					newUnused.push(slide.unused[i]);
				}
			}

			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{
					$set: {
						pages: newPages,
						unused: newUnused,
					},
				}
			);

			if (updateRes.result.n == 0) {
				throw { status: 400, error: 'change pages order failed' };
			}

			res.json({});
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * set title of a slide
	 * req body:
	 *   title: new title of the slide
	 *   sid: the slide id
	 */
	router.post('/api/setTitle', instructorAuth, async (req, res) => {
		try {
			if (req.body.sid.length != 24) {
				return res.status(400).send();
			}
			let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) });

			if (!slide) {
				throw { status: 400, error: 'slide not exist' };
			} else if (false) {
				// check in instructor's list TODO: UNSAFE
				throw { status: 403, error: 'Unauthorized' };
			}
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{
					$set: {
						title: req.body.title,
					},
				}
			);

			if (updateRes.result.n == 0) {
				throw { status: 400, error: 'set title failed' };
			}

			res.json({});
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * set anonymity level of a slide
	 * req body:
	 *   anonymity: new anonymity level of the slide
	 *   sid: the slide id
	 */
	router.post('/api/setAnonymity', instructorAuth, async (req, res) => {
		try {
			if (req.body.sid.length != 24 || ['anyone', 'student', 'nonymous'].indexOf(req.body.anonymity) < 0) {
				return res.status(400).send();
			}
			let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) });

			if (!slide) {
				throw { status: 400, error: 'slide not exist' };
			} else if (false) {
				// check in instructor's list TODO: UNSAFE
				throw { status: 403, error: 'Unauthorized' };
			}

			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{
					$set: {
						anonymity: req.body.anonymity,
					},
				}
			);

			if (updateRes.result.n == 0) {
				throw { status: 400, error: 'set anonymity failed' };
			}

			res.json({});
		} catch (err) {
			errorHandler(res, err);
		}
	});

	// router.post('/api/testPDF', (req, res) => {
	//     console.log(req.files.file.name);
	//     res.send();
	// });

	/**
	 * Delete a slide
	 * req query:
	 *   sid: slide object ID
	 */
	router.delete('/api/slide', instructorAuth, async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.sid) },
				{ projection: { _id: 1 } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };

			let updateRes = await courses.updateMany({}, { $pull: { slides: req.query.sid } });
			if (updateRes.modifiedCount !== 1) {
				throw `delete slide from course error: updateRes = ${updateRes}`;
			}

			let removeRes = await slides.deleteOne({ _id: ObjectID.createFromHexString(req.query.sid) });
			if (removeRes.deletedCount !== 1) {
				throw `delete slide error: removeRes = ${removeRes}`;
			}

			await fs.promises.rmdir(path.join(fileStorage, req.query.sid), { recursive: true });

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * Delete a question
	 * req query:
	 *   sid: slide object ID
	 *   pageNum: page number, integer range from from 1 to pageTotal (inclusive)
	 *   qid: question index, integer range from from 0 to questions.length (exclusive)
	 */
	router.delete('/api/question', instructorAuth, async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.sid) },
				{ projection: { pageTotal: 1, pages: 1 } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (
				isNotValidPage(req.query.pageNum, slide.pageTotal) ||
				notExistInList(req.query.qid, slide.pages[+req.query.pageNum - 1].questions)
			) {
				throw { status: 400, error: 'bad request' };
			}

			let deleteQuery = {};
			deleteQuery[`pages.${req.query.pageNum - 1}.questions.${+req.query.qid}`] = null;
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.query.sid) },
				{ $set: deleteQuery }
			);
			if (updateRes.modifiedCount !== 1) {
				throw 'delete question error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * Delete a chat
	 * req query:
	 *   sid: slide object ID
	 *   pageNum: page number, integer range from from 1 to pageTotal (inclusive)
	 *   qid: question index, integer range from from 0 to questions.length (exclusive)
	 *   c
	 */
	router.delete('/api/chat', instructorAuth, async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.sid) },
				{ projection: { pageTotal: 1, pages: 1 } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (
				isNotValidPage(req.query.pageNum, slide.pageTotal) ||
				notExistInList(req.query.qid, slide.pages[+req.query.pageNum - 1].questions) ||
				notExistInList(req.query.cid, slide.pages[+req.query.pageNum - 1].questions[req.query.qid].chats)
			) {
				throw { status: 400, error: 'bad request' };
			}

			let deleteQuery = {};
			deleteQuery[`pages.${req.query.pageNum - 1}.questions.${+req.query.qid}.chats.${+req.query.cid}`] = null;
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.query.sid) },
				{ $set: deleteQuery }
			);
			if (updateRes.modifiedCount !== 1) {
				throw 'delete chat error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * endorse a chat (if already endorsed by the user, then revoke endorsement)
	 * req body:
	 *   sid: slide id
	 *   qid: question index
	 *   cid: chat index
	 *   pageNum: page number
	 */
	router.post('/api/endorse', instructorAuth, async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions) ||
				notExistInList(req.body.cid, slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats)
			) {
				throw { status: 400, error: 'bad request' };
			}

			let updateEndorse = {}; // cannot use template string on the left hand side
			updateEndorse[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}.endorsement`] =
				req.session.realName;
			let updateRes;

			// endorse if not already endorsed, otherwise revoke the endorsement
			if (
				slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats[req.body.cid].endorsement.indexOf(
					req.session.realName
				) < 0
			) {
				updateRes = await slides.updateOne(
					{ _id: ObjectID.createFromHexString(req.body.sid) },
					{ $addToSet: updateEndorse }
				);
			} else {
				updateRes = await slides.updateOne(
					{ _id: ObjectID.createFromHexString(req.body.sid) },
					{ $pull: updateEndorse }
				);
			}

			if (updateRes.modifiedCount !== 1) {
				throw 'endorse update error';
			}
			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	return router;
}

module.exports = instructorAPI;
