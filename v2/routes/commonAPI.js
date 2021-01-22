const path = require('path');
const express = require('express');
const { ObjectID } = require('mongodb');

const { fileStorage } = require('../config');
const { isNotValidPage, notExistInList, errorHandler, shortName } = require('./util');

function commonAPI(db, isInstructor) {
	let router = express.Router();

	const users = db.collection('users');
	const courses = db.collection('courses');
	const slides = db.collection('slides');

	/**
	 * get the course information, the list of slides of the course
	 * req query:
	 *   id: courseID
	 */
	router.get('/api/course', async (req, res) => {
		try {
			let course = await courses.findOne({
				_id: ObjectID.createFromHexString(req.query.id),
			});
			if (!course) throw { status: 404, error: 'not found' };

			let courseSlides = [];
			for (let slideId of course.slides) {
				let slideEntry = await slides.findOne(
					{ _id: ObjectID.createFromHexString(slideId) },
					{ projection: { filename: 1, description: 1, lastActive: 1, anonymity: 1, drawable: 1 } }
				);
				if (!slideEntry) {
					console.log(`slide ${slideId} not found`);
					continue;
				}
				courseSlides.push({
					id: slideId,
					filename: slideEntry.filename,
					description: slideEntry.description,
					lastActive: slideEntry.lastActive,
					anonymity: slideEntry.anonymity,
					drawable: slideEntry.drawable,
				});
			}
			res.json({
				name: course.name,
				instructors: course.instructors,
				slides: courseSlides,
				anonymity: course.anonymity,
				drawable: course.drawable,
			});
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * get information of a slide, e.g. total number of pages, filename, title, etc.
	 * req query:
	 *   slideID: object ID of a slide
	 */
	router.get('/api/slideInfo', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { pages: 0 } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			let course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });
			res.json({
				filename: slide.filename,
				pageTotal: slide.pageTotal,
				title: slide.title,
				anonymity: slide.anonymity,
				loginUser: req.session.uid,
				username: shortName(req.session.realName),
				isInstructor: course.instructors.indexOf(req.session.uid) >= 0,
				drawable: slide.drawable,
			});
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * get slide image
	 * req query:
	 *   slideID: object ID of the slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 */
	router.get('/api/slideImg', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { _id: true, anonymity: true, pageTotal: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity !== 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}
			res.sendFile(path.join(fileStorage, req.query.slideID, `page-${+req.query.pageNum - 1}.png`));
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * get slide audio
	 * req query:
	 *   slideID: object ID of the slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 */
	router.get('/api/slideAudio', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { _id: true, anonymity: true, pageTotal: true, pages: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity !== 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}

			res.sendFile(
				path.join(fileStorage, req.query.slideID, req.query.pageNum, slide.pages[+req.query.pageNum - 1].audio)
			);
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * send {audio : true} iff the asking page has audio attached
	 * req query:
	 *   slideID: object ID of the slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 */
	router.get('/api/hasAudio', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { _id: true, pageTotal: true, audio: true, pages: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}
			let response = {};
			if (slide.pages[+req.query.pageNum - 1].audio) {
				response.audio = true;
			} else {
				response.audio = false;
			}
			res.json(response);
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * download PDF file
	 * req query:
	 *   slideID: object ID of the slide
	 */
	router.get('/api/downloadPdf', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { filename: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			res.download(path.join(fileStorage, req.query.slideID, slide.filename));
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * get question list of a page
	 * req query:
	 *   slideID: object ID of a slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 */
	router.get('/api/questions', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { pages: true, pageTotal: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}
			let result = slide.pages[+req.query.pageNum - 1].questions;
			for (let question of result) {
				if (question) {
					question.user = question.chats[0].user;
					question.create = question.chats[0].time;
					if (isInstructor(req.session.uid)) {
						question.uid = question.chats[0].uid;
					}
					delete question.chats;
				}
			}
			res.json(result);
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * get all questions of a file
	 * req query:
	 *   slideID: object ID of a slide
	 */
	router.get('/api/questionsAll', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			for (let i of slide.pages) {
				for (let question of i.questions) {
					if (question) {
						question.user = question.chats[0].user;
						question.create = question.chats[0].time;
						if (isInstructor(req.session.uid)) {
							question.uid = question.chats[0].uid;
						}
						delete question.chats;
					}
				}
			}
			res.json(slide.pages);
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * get chats under a question
	 * req query:
	 *   slideID: object ID of a slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 *   qid: question index, integer range from from 0 to questions.length (exclusive)
	 */
	router.get('/api/chats', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			if (
				isNotValidPage(req.query.pageNum, slide.pageTotal) ||
				notExistInList(req.query.qid, slide.pages[+req.query.pageNum - 1].questions)
			) {
				throw { status: 400, error: 'bad request' };
			}
			let question = slide.pages[+req.query.pageNum - 1].questions[req.query.qid];

			// hide students' id, except if it is their own, keep it for showing the modify button
			if (!isInstructor(req.session.uid)) {
				for (let i of question.chats) {
					if (i && i.uid !== req.session.uid) i.uid = undefined;
				}
			}

			res.json({
				title: question.title,
				chats: question.chats,
				drawing: question.drawing,
			});
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * add a new question to page
	 * req body:
	 *   sid: slide id
	 *   pageNum: page number
	 *   title: question title
	 *   body(optional): question body
	 *   user: userID
	 *   drawing(optional): the drawing for the question
	 */
	router.post('/api/addQuestion', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, anonymity: true, pages: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				typeof req.body.title !== 'string' ||
				!req.body.title ||
				typeof req.body.body !== 'string' ||
				typeof req.body.user !== 'string'
			) {
				throw { status: 400, error: 'bad request' };
			}

			if (req.body.drawing) {
				for (let line of req.body.drawing) {
					for (let i = 0; i < line.length - 1; i++) {
						if (!Number.isInteger(line[i])) {
							throw { status: 400, error: 'bad request' };
						}
					}
				}
			}

			let time = Date.now();
			let newQuestion = {
				status: 'unsolved',
				time: time,
				chats: [
					{
						time: time,
						body: req.body.body, // does not escape here, client renderer(markdown-it) will escape it
						// saving redundant user name here to save some queries
						user: slide.anonymity === 'C' ? shortName(req.session.realName) : req.body.user,
						uid: slide.anonymity === 'C' || slide.anonymity === 'D' ? req.session.uid : undefined,
						likes: [],
						endorsement: [],
					},
				],
				title: req.body.title,
				drawing: req.body.drawing,
			};

			let insertQuestion = {}; // cannot use template string on the left hand side
			insertQuestion[`pages.${req.body.pageNum - 1}.questions`] = newQuestion;
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{
					$push: insertQuestion,
					$set: {
						lastActive: time,
					},
				}
			);
			if (updateRes.modifiedCount !== 1) {
				throw 'question update error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * add a new chat to question
	 * body:
	 *   sid: slide id
	 *   qid: question index, integer range from from 0 to questions.length (exclusive)
	 *   pageNum: page number
	 *   body: message body
	 *   user: userID
	 */
	router.post('/api/addChat', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions) ||
				typeof req.body.body !== 'string' ||
				!req.body.body ||
				typeof req.body.user !== 'string'
			) {
				throw { status: 400, error: 'bad request' };
			}

			let time = Date.now();
			let newChat = {
				time: time,
				body: req.body.body, // does not escape here, md renderer(markdown-it) will escape it
				user: slide.anonymity === 'C' ? shortName(req.session.realName) : req.body.user,
				uid: slide.anonymity === 'C' || slide.anonymity === 'D' ? req.session.uid : undefined,
				likes: [],
				endorsement: [],
			};

			let insertChat = {}; // cannot use template string on the left hand side
			insertChat[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats`] = newChat;
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{
					$push: insertChat,
					$set: {
						lastActive: time,
						[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.time`]: time,
					},
				}
			);

			if (updateRes.modifiedCount !== 1) {
				throw 'chat update error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * like a chat
	 * req body:
	 *   sid: slide id
	 *   qid: question index
	 *   cid: chat index
	 *   pageNum: page number
	 *   user: userID
	 */
	router.post('/api/like', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity !== 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions) ||
				notExistInList(req.body.cid, slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats)
			) {
				throw { status: 400, error: 'bad request' };
			}

			let uid = slide.anonymity === 'C' || slide.anonymity === 'D' ? req.session.uid : req.body.user;
			let insertLike = {}; // cannot use template string on the left hand side
			insertLike[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}.likes`] = uid;

			// if anonymous, randomly generated username may repeat, so it does not make
			// sense to only allow one like per name. So everyone can like as many times
			// as they want
			let updateRes;
			if (slide.anonymity !== 'A') {
				// like if not yet liked, otherwise unlike
				if (
					slide.pages[req.body.pageNum - 1].questions[req.body.qid].chats[req.body.cid].likes.indexOf(uid) < 0
				) {
					updateRes = await slides.updateOne(
						{ _id: ObjectID.createFromHexString(req.body.sid) },
						{ $addToSet: insertLike }
					);
				} else {
					updateRes = await slides.updateOne(
						{ _id: ObjectID.createFromHexString(req.body.sid) },
						{ $pull: insertLike }
					);
				}
			} else {
				updateRes = await slides.updateOne(
					{ _id: ObjectID.createFromHexString(req.body.sid) },
					{ $push: insertLike }
				);
			}

			if (updateRes.modifiedCount !== 1) {
				throw 'like update error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * Modify the content of a chat message
	 * Only the owner of the message is allowed. Anonymous chat does not allow anyone
	 * to modify.
	 * req body:
	 *   sid: slide id
	 *   qid: question index, integer range from from 0 to questions.length (exclusive)
	 *   pageNum: page number
	 *   cid: chat index
	 *   body: message body
	 */
	router.post('/api/modifyChat', async (req, res) => {
		try {
			const slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions) ||
				notExistInList(req.body.cid, slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats) ||
				typeof req.body.body !== 'string' ||
				!req.body.body
			) {
				throw { status: 400, error: 'bad request' };
			}
			if (
				slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats[req.body.cid].uid !==
					req.session.uid ||
				!req.session.uid
			)
				throw { status: 401, error: 'Unauthorized' };

			const time = Date.now();
			const change = {
				[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}.body`]: req.body.body,
				[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}.time`]: time,
				[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}.modified`]: true,
				[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.time`]: time,
			};
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ $set: change }
			);

			if (updateRes.modifiedCount !== 1) {
				throw 'chat modify error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * Delete one's own chat message
	 * Anonymous chat does not allow anyone to delete except instructors.
	 * Index 0 (question body) is not allowed to delete because it contains question
	 * owner information
	 * req body:
	 *   sid: slide id
	 *   qid: question index
	 *   pageNum: page number
	 *   cid: chat index
	 */
	router.post('/api/deleteOwnChat', async (req, res) => {
		try {
			const slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions) ||
				req.body.cid === 0 ||
				notExistInList(req.body.cid, slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats)
			) {
				throw { status: 400, error: 'bad request' };
			}
			if (
				slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats[req.body.cid].uid !==
					req.session.uid ||
				!req.session.uid
			)
				throw { status: 401, error: 'Unauthorized' };

			const time = Date.now();
			const change = {
				[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}`]: null,
			};
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ $set: change }
			);

			if (updateRes.modifiedCount !== 1) {
				throw 'delete own chat error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	});

	return router;
}

module.exports = commonAPI;
