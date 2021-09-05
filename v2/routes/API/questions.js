const { ObjectId } = require('mongodb');
const { isNotValidPage, notExistInList, errorHandler, shortName, questionCount } = require('../util');
const { isInstructor } = require('../instructors');

const unusedQuestions = async (req, res) => {
	try {
		const slide = await req.app.locals.slides.findOne(
			{ _id: ObjectId.createFromHexString(req.query.id) },
			{ projection: { unused: 1 } }
		);
		if (!slide) return res.sendStatus(404);
		const result = slide.unused;
		if (!result) return res.send([]);
		for (let i = 0; i < result.length; i++) {
			for (let question of result[i].questions) {
				if (question) {
					question.chats = undefined;
				}
			}
		}
		res.json(result);
	} catch (err) {
		errorHandler(res, err);
	}
};

const getQuestions = async (req, res) => {
	try {
		const { slideID, pageNum } = req.query;
		const slide = await req.app.locals.slides.findOne(
			{ _id: ObjectId.createFromHexString(slideID) },
			{ projection: { pages: true, pageTotal: true, anonymity: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		if (isNotValidPage(pageNum, slide.pageTotal)) {
			throw { status: 400, error: 'bad request' };
		}
		const result = slide.pages[+pageNum - 1].questions;
		const instructor = isInstructor(req.session.uid);
		for (let question of result) {
			if (question) {
				question.user = question.chats[0].user;
				question.create = question.chats[0].time;
				if (instructor) {
					question.uid = question.chats[0].uid;
				}
				question.drawing = undefined;
				question.chats = undefined;
			}
		}
		res.json(result);
	} catch (err) {
		errorHandler(res, err);
	}
};

const getAllQuestions = async (req, res) => {
	try {
		const slide = await req.app.locals.slides.findOne(
			{ _id: ObjectId.createFromHexString(req.query.slideID) },
			{ projection: { pages: true, anonymity: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		const instructor = isInstructor(req.session.uid);
		for (let i of slide.pages) {
			for (let question of i.questions) {
				if (question) {
					question.user = question.chats[0].user;
					question.create = question.chats[0].time;
					if (instructor) {
						question.uid = question.chats[0].uid;
					}
					delete question.drawing;
					delete question.chats;
				}
			}
		}
		res.json(slide.pages);
	} catch (err) {
		errorHandler(res, err);
	}
};

const addQuestion = async (req, res) => {
	try {
		const { sid, pageNum, title, body, user, drawing } = req.body;
		const { slides, io } = req.app.locals;
		const slide = await slides.findOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ projection: { pageTotal: true, anonymity: true, pages: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		if (
			isNotValidPage(pageNum, slide.pageTotal) ||
			typeof title !== 'string' ||
			!title ||
			typeof body !== 'string' ||
			typeof user !== 'string'
		) {
			throw { status: 400, error: 'bad request' };
		}

		if (drawing) {
			for (let line of drawing) {
				for (let i = 0; i < line.points.length - 1; i++) {
					if (!Number.isInteger(line.points[i])) {
						throw { status: 400, error: 'bad request' };
					}
				}
			}
		}

		const time = Date.now();
		const newQuestion = {
			status: 'unsolved',
			time: time,
			chats: [
				{
					time: time,
					body: body, // does not escape here, client renderer(markdown-it) will escape it
					// saving redundant user name here to save some queries
					user: slide.anonymity === 'C' ? shortName(req.session.realName) : user,
					uid: slide.anonymity === 'C' || slide.anonymity === 'D' ? req.session.uid : undefined,
					likes: [],
					endorsement: [],
				},
			],
			title: title,
			drawing: drawing,
		};

		const updateRes = await slides.findOneAndUpdate(
			{ _id: ObjectId.createFromHexString(sid) },
			{
				$push: {
					[`pages.${pageNum - 1}.questions`]: newQuestion,
				},
				$set: {
					lastActive: time,
				},
			},
			{ projection: { pages: 1 } }
		);
		if (!updateRes.ok) {
			throw 'question update error';
		}
		io.to(sid).emit('new question', {
			create: time,
			id: updateRes.value.pages[pageNum - 1].questions.length,
			pageNum: pageNum,
			status: 'unsolved',
			time: time,
			title: title,
			user: newQuestion.chats[0].user,
		});
		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const deleteQuestion = async (req, res) => {
	try {
		const { sid, pageNum, qid } = req.query;
		const { slides, courses } = req.app.locals;
		if (typeof sid !== 'string' || sid.length !== 24) {
			return res.status(400).send();
		}
		const slide = await slides.findOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ projection: { pageTotal: 1, pages: 1, course: 1 } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		const course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });
		if (!course.instructors.includes(req.session.uid)) {
			throw { status: 403, error: 'Unauthorized' };
		}

		if (isNotValidPage(pageNum, slide.pageTotal) || notExistInList(qid, slide.pages[pageNum - 1].questions)) {
			throw { status: 400, error: 'bad request' };
		}

		const updateRes = await slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ $set: { [`pages.${pageNum - 1}.questions.${qid}`]: null } }
		);
		if (updateRes.modifiedCount !== 1) {
			throw 'delete question error';
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const reorderQuestions = async (req, res) => {
	try {
		const { questionOrder, sid } = req.body;
		const { slides, courses } = req.app.locals;
		if (typeof sid !== 'string' || sid.length !== 24) {
			return res.status(400).send();
		}
		const objectSid = ObjectId.createFromHexString(sid);
		const slide = await slides.findOne({ _id: objectSid });
		if (!slide) {
			throw { status: 400, error: 'slide not found' };
		}
		const course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });
		if (!course.instructors.includes(req.session.uid)) {
			throw { status: 403, error: 'Unauthorized' };
		}
		if (questionOrder.length !== slide.pages.length) {
			throw { status: 400, error: 'length not match' };
		}

		const usedPage = {};
		const newPages = [];
		let unusedLength = 0;
		if (slide.unused) {
			unusedLength = slide.unused.length;
		}
		for (let orders of questionOrder) {
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

		const newUnused = [];
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

		const updateRes = await slides.updateOne(
			{ _id: objectSid },
			{
				$set: {
					pages: newPages,
					unused: newUnused,
				},
			}
		);

		if (!updateRes.result.ok) {
			throw { status: 400, error: 'change pages order failed' };
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	unusedQuestions,
	getQuestions,
	getAllQuestions,
	addQuestion,
	deleteQuestion,
	reorderQuestions,
};
