const { ObjectId } = require('mongodb');
const { isNotValidPage, notExistInList, errorHandler, shortName } = require('../util');
const { isInstructor } = require('../instructors');

const getChats = async (req, res) => {
	try {
		const { slideID, pageNum, qid } = req.query;
		const { slides } = req.app.locals;
		const slide = await slides.findOne(
			{ _id: ObjectId.createFromHexString(slideID) },
			{ projection: { pages: true, anonymity: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		if (isNotValidPage(pageNum, slide.pageTotal) || notExistInList(qid, slide.pages[+pageNum - 1].questions)) {
			throw { status: 400, error: 'bad request' };
		}
		const question = slide.pages[+pageNum - 1].questions[qid];

		// hide students' id, except if it is their own, keep it for showing the modify button
		if (!isInstructor(req.session.uid)) {
			for (let i of question.chats) {
				if (i && i.uid !== req.session.uid) i.uid = undefined;
			}
		}

		const viewCountField = `pages.${+pageNum - 1}.questions.${qid}.viewCount`;
		slides.updateOne({ _id: ObjectId.createFromHexString(slideID) }, { $inc: { [viewCountField]: 1 } });

		res.json({
			title: question.title,
			chats: question.chats,
			drawing: question.drawing,
			viewCount: question.viewCount ? question.viewCount + 1 : 1,
		});
	} catch (err) {
		errorHandler(res, err);
	}
};

const addChat = async (req, res) => {
	try {
		const { sid, pageNum, qid, body, user } = req.body;
		const { slides, io } = req.app.locals;
		const slide = await slides.findOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ projection: { pageTotal: true, pages: true, anonymity: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		if (
			isNotValidPage(pageNum, slide.pageTotal) ||
			notExistInList(qid, slide.pages[pageNum - 1].questions) ||
			typeof body !== 'string' ||
			!body ||
			typeof user !== 'string'
		) {
			throw { status: 400, error: 'bad request' };
		}

		const time = Date.now();
		const newChat = {
			time: time,
			body: body, // does not escape here, md renderer(markdown-it) will escape it
			user: slide.anonymity === 'C' ? shortName(req.session.realName) : user,
			uid: slide.anonymity === 'C' || slide.anonymity === 'D' ? req.session.uid : undefined,
			likes: [],
			endorsement: [],
		};

		const updateRes = await req.app.locals.slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{
				$push: {
					[`pages.${pageNum - 1}.questions.${qid}.chats`]: newChat,
				},
				$set: {
					lastActive: time,
					[`pages.${pageNum - 1}.questions.${qid}.time`]: time,
				},
			}
		);
		if (!updateRes.result.ok) {
			throw 'chat update error';
		}
		res.send();

		delete newChat.uid;
		newChat.pageNum = pageNum;
		newChat.qid = qid;
		io.to(sid).emit('new reply', newChat);
	} catch (err) {
		errorHandler(res, err);
	}
};

const modifyChat = async (req, res) => {
	try {
		const { sid, qid, cid, pageNum, body } = req.body;
		const { slides, io } = req.app.locals;
		const slide = await slides.findOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ projection: { pageTotal: true, pages: true, anonymity: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (
			isNotValidPage(pageNum, slide.pageTotal) ||
			notExistInList(qid, slide.pages[pageNum - 1].questions) ||
			notExistInList(cid, slide.pages[pageNum - 1].questions[qid].chats) ||
			typeof body !== 'string' ||
			!body
		) {
			throw { status: 400, error: 'bad request' };
		}
		if (slide.pages[pageNum - 1].questions[qid].chats[cid].uid !== req.session.uid || !req.session.uid)
			throw { status: 403, error: 'Forbidden' };

		const time = Date.now();
		const updateRes = await slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{
				$set: {
					[`pages.${pageNum - 1}.questions.${qid}.chats.${cid}.body`]: body,
					[`pages.${pageNum - 1}.questions.${qid}.chats.${cid}.time`]: time,
					[`pages.${pageNum - 1}.questions.${qid}.chats.${cid}.modified`]: true,
					[`pages.${pageNum - 1}.questions.${qid}.time`]: time,
				},
			}
		);

		if (!updateRes.result.ok) {
			throw 'chat modify error';
		}
		res.send();

		io.to(sid).emit('modify', {
			pageNum: pageNum,
			qid: qid,
			cid: cid,
			time: time,
			body: body,
		});
	} catch (err) {
		errorHandler(res, err);
	}
};

const deleteOwnChat = async (req, res) => {
	try {
		const { sid, qid, cid, pageNum } = req.body;
		const { slides, io } = req.app.locals;
		const slide = await slides.findOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ projection: { pageTotal: true, pages: true, anonymity: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (
			isNotValidPage(pageNum, slide.pageTotal) ||
			notExistInList(qid, slide.pages[pageNum - 1].questions) ||
			cid === 0 ||
			notExistInList(cid, slide.pages[pageNum - 1].questions[qid].chats)
		) {
			throw { status: 400, error: 'bad request' };
		}
		if (slide.pages[pageNum - 1].questions[qid].chats[cid].uid !== req.session.uid || !req.session.uid)
			throw { status: 403, error: 'Forbidden' };

		const updateRes = await req.app.locals.slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{
				$set: {
					[`pages.${pageNum - 1}.questions.${qid}.chats.${cid}`]: null,
				},
			}
		);

		if (!updateRes.result.ok) {
			throw 'delete own chat error';
		}
		res.send();

		io.to(sid).emit('delete chat', {
			pageNum: pageNum,
			qid: qid,
			cid: cid,
		});
	} catch (err) {
		errorHandler(res, err);
	}
};

const deleteChat = async (req, res) => {
	try {
		const { sid, pageNum, qid, cid } = req.query;
		const { slides, courses, io } = req.app.locals;
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

		if (
			+cid === 0 ||
			isNotValidPage(pageNum, slide.pageTotal) ||
			notExistInList(qid, slide.pages[pageNum - 1].questions) ||
			notExistInList(cid, slide.pages[pageNum - 1].questions[qid].chats)
		) {
			throw { status: 400, error: 'bad request' };
		}

		const updateRes = await req.app.locals.slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ $set: { [`pages.${pageNum - 1}.questions.${qid}.chats.${cid}`]: null } }
		);
		if (updateRes.modifiedCount !== 1) {
			throw 'delete chat error';
		}
		res.send();

		io.to(sid).emit('delete chat', {
			pageNum: +pageNum,
			qid: +qid,
			cid: cid,
		});
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	getChats,
	addChat,
	modifyChat,
	deleteOwnChat,
	deleteChat,
};
