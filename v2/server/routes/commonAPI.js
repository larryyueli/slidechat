const path = require('path');
const express = require('express');
const { ObjectID } = require('mongodb');

const { instructors, fileStorage } = require('../config');
const { isNotValidPage, notExistInList, errorHandler } = require('./util');

function userAuth(req, res, next) {
	if (process.env.DEV) {
		req.uid = instructors[0];
		next();
	} else if (req.headers.utorid == undefined) {
		res.status(401).send('Unauthorized');
		console.error(`User auth failed`);
	} else {
		// Get user info from shibboleth: req.headers.utorid, req.headers.http_mail, req.headers.origin
		req.uid = req.headers.utorid;
		next();
	}
}

function commonAPI(db) {
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
			let course = await courses.findOne({ _id: ObjectID.createFromHexString(req.query.id) });
			if (!course) throw { status: 404, error: 'not found' };

			let courseSlides = [];
			for (let slideId of course.slides) {
				let slideEntry = await slides.findOne(
					{ _id: ObjectID.createFromHexString(slideId) },
					{ projection: { filename: 1, description: 1 } }
				);
				if (!slideEntry) {
					console.log(`slide ${slideId} not found`);
					continue;
				}
				courseSlides.push({ id: slideId, filename: slideEntry.filename, description: slideEntry.description });
			}
			res.json({
				name: course.name,
				instructors: course.instructors,
				role: course.role,
				slides: courseSlides,
				cid: course.id,
			});
		} catch (err) {
			errorHandler(res, err);
		}
	});

	router.get('/p/api/verifyLogin', userAuth, async (req, res) => {
		res.json({ uid: req.uid });
	});

	/**
	 * get information of a slide, e.g. total number of pages, filename, title, etc.
	 * req body:
	 *   slideID: object ID of a slide
	 */
	router.get('/api/slideInfo', async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { pages: 0 } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			res.json({
				filename: slide.filename,
				pageTotal: slide.pageTotal,
				title: slide.title,
				anonymity: slide.anonymity,
			});
		} catch (err) {
			errorHandler(res, err);
		}
	});

	/**
	 * get slide image
	 * req body:
	 *   slideID: object ID of the slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 */
	const getSlideImg = async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { _id: true, anonymity: true, pageTotal: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'anyone' && !req.uid) throw { status: 401, error: 'Unauthorized' };
			if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}
			res.sendFile(path.join(fileStorage, req.query.slideID, `page-${+req.query.pageNum - 1}.png`));
		} catch (err) {
			errorHandler(res, err);
		}
	};
	router.get('/api/slideImg', async (req, res) => {
		req.uid = undefined;
		getSlideImg(req, res);
	});
	router.get('/p/api/slideImg', userAuth, async (req, res) => {
		getSlideImg(req, res);
	});

	/**
	 * get slide audio
	 * req body:
	 *   slideID: object ID of the slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 */
	const getSlideAudio = async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { _id: true, anonymity: true, pageTotal: true, pages: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'anyone' && !req.uid) throw { status: 401, error: 'Unauthorized' };
			if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}
			// console.log(slide.audio);
			// console.log(path.join(fileStorage, req.query.slideID, req.query.pageNum, slide.audio));
			res.sendFile(
				path.join(fileStorage, req.query.slideID, req.query.pageNum, slide.pages[+req.query.pageNum - 1].audio)
			);
		} catch (err) {
			errorHandler(res, err);
		}
	};
	router.get('/api/slideAudio', async (req, res) => {
		req.uid = undefined;
		getSlideAudio(req, res);
	});
	router.get('/p/api/slideAudio', userAuth, async (req, res) => {
		getSlideAudio(req, res);
	});

	/**
	 * send {audio : true} iff the asking page has audio attached
	 * req body:
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
	 * req body:
	 *   slideID: object ID of the slide
	 */
	const getDownloadPdf = async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { filename: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'anyone' && !req.uid) throw { status: 401, error: 'Unauthorized' };
			res.download(path.join(fileStorage, req.query.slideID, slide.filename));
		} catch (err) {
			errorHandler(res, err);
		}
	};
	router.get('/api/downloadPdf', async (req, res) => {
		req.uid = undefined;
		getDownloadPdf(req, res);
	});
	router.get('/p/api/downloadPdf', userAuth, async (req, res) => {
		getDownloadPdf(req, res);
	});

	/**
	 * get question list of a page
	 * req body:
	 *   slideID: object ID of a slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 */
	const getQuestions = async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { pages: true, pageTotal: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'anyone' && !req.uid) throw { status: 401, error: 'Unauthorized' };
			if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
				throw { status: 400, error: 'bad request' };
			}
			let result = slide.pages[+req.query.pageNum - 1].questions;
			for (let question of result) {
				if (question) {
					delete question.chats;
				}
			}
			res.json(result);
		} catch (err) {
			errorHandler(res, err);
		}
	};
	router.get('/api/questions', async (req, res) => {
		req.uid = undefined;
		getQuestions(req, res);
	});
	router.get('/p/api/questions', userAuth, async (req, res) => {
		getQuestions(req, res);
	});

	/**
	 * get chats under a question
	 * req query:
	 *   slideID: object ID of a slide
	 *   pageNum: integer range from from 1 to pageTotal (inclusive)
	 *   qid: question index, integer range from from 0 to questions.length (exclusive)
	 */
	const getChats = async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.query.slideID) },
				{ projection: { pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'anyone' && !req.uid) throw { status: 401, error: 'Unauthorized' };
			if (
				isNotValidPage(req.query.pageNum, slide.pageTotal) ||
				notExistInList(req.query.qid, slide.pages[+req.query.pageNum - 1].questions)
			) {
				throw { status: 400, error: 'bad request' };
			}
			res.json({
				chats: slide.pages[+req.query.pageNum - 1].questions[req.query.qid].chats,
				drawing: slide.pages[+req.query.pageNum - 1].questions[req.query.qid].drawing,
			});
		} catch (err) {
			errorHandler(res, err);
		}
	};
	router.get('/api/chats', async (req, res) => {
		req.uid = undefined;
		getChats(req, res);
	});
	router.get('/p/api/chats', userAuth, async (req, res) => {
		getChats(req, res);
	});

	/**
	 * add a new question to page
	 * req body:
	 *   sid: slide id
	 *   pageNum: page number
	 *   title: question title
	 *   body: question body
	 *   user: userID
	 *   drawing(optional): the drawing for the question
	 */
	const postAddQuestion = async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'anyone' && !req.uid) throw { status: 401, error: 'Unauthorized' };
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				typeof req.body.title !== 'string' ||
				typeof req.body.body !== 'string' ||
				typeof req.body.user !== 'string'
			) {
				throw { status: 400, error: 'bad request' };
			}

			for (let line of req.body.drawing) {
				for (let i = 0; i < line.length - 1; i++) {
					if (!Number.isInteger(line[i])) {
						throw { status: 400, error: 'bad request' };
					}
				}
			}

			let time = Date.now();
			let newQuestion = {
				status: 'unsolved',
				time: time,
				chats: [],
				title: escape(req.body.title),
				drawing: req.body.drawing,
				user: req.body.user,
			};
			let newChat = {
				time: time,
				body: req.body.body, // does not escape here, md renderer(markdown-it) will escape it
				user: req.body.user,
				likes: [],
				endorsement: [],
			};
			newQuestion.chats.push(newChat);

			let insertQuestion = {}; // cannot use template string on the left hand side
			insertQuestion[`pages.${req.body.pageNum - 1}.questions`] = newQuestion;
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ $push: insertQuestion }
			);
			if (updateRes.modifiedCount !== 1) {
				throw 'question update error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	};
	router.post('/api/addQuestion', async (req, res) => {
		req.uid = undefined;
		postAddQuestion(req, res);
	});
	router.post('/p/api/addQuestion', userAuth, async (req, res) => {
		postAddQuestion(req, res);
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
	const postAddChat = async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity != 'anyone' && !req.uid) throw { status: 401, error: 'Unauthorized' };
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions) ||
				typeof req.body.body !== 'string' ||
				typeof req.body.user !== 'string'
			) {
				throw { status: 400, error: 'bad request' };
			}

			let time = Date.now();
			let newChat = {
				time: time,
				body: req.body.body, // does not escape here, md renderer(markdown-it) will escape it
				user: req.body.user,
				likes: [],
				endorsement: [],
			};

			let insertChat = {}; // cannot use template string on the left hand side
			insertChat[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats`] = newChat;
			let updateLastActiveTime = {};
			updateLastActiveTime[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.time`] = time;
			let updateRes = await slides.updateOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ $push: insertChat, $set: updateLastActiveTime }
			);

			if (updateRes.modifiedCount !== 1) {
				throw 'chat update error';
			}

			res.send();
		} catch (err) {
			errorHandler(res, err);
		}
	};
	router.post('/api/addChat', async (req, res) => {
		req.uid = undefined;
		postAddChat(req, res);
	});
	router.post('/p/api/addChat', userAuth, async (req, res) => {
		postAddChat(req, res);
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
	const postLike = async (req, res) => {
		try {
			let slide = await slides.findOne(
				{ _id: ObjectID.createFromHexString(req.body.sid) },
				{ projection: { pageTotal: true, pages: true, anonymity: true } }
			);
			if (!slide) throw { status: 404, error: 'slide not found' };
			if (slide.anonymity !== 'anyone') {
				if (!req.uid) throw { status: 401, error: 'Unauthorized' };
				req.body.user = req.uid;
			}
			if (
				isNotValidPage(req.body.pageNum, slide.pageTotal) ||
				notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions) ||
				notExistInList(req.body.cid, slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats)
			) {
				throw { status: 400, error: 'bad request' };
			}

			let insertLike = {}; // cannot use template string on the left hand side
			insertLike[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}.likes`] =
				req.body.user;

			// if anonymous, randomly generated username may repeat, so it does not make
			// sense to only allow one like per name. So everyone can like as many times 
			// as they want
			let updateRes;
			if (slide.anonymity !== 'anyone') {
				updateRes = await slides.updateOne(
					{ _id: ObjectID.createFromHexString(req.body.sid) },
					{ $addToSet: insertLike }
				);
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
	};
	router.post('/api/like', async (req, res) => {
		req.uid = undefined;
		postLike(req, res);
	});
	router.post('/p/api/like', userAuth, async (req, res) => {
		postLike(req, res);
	});

	return router;
}

module.exports = commonAPI;
