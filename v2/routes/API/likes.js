const { ObjectId } = require('mongodb');
const { isNotValidPage, notExistInList, errorHandler, shortName } = require('../util');

const like = async (req, res) => {
	try {
		const { sid, pageNum, qid, cid, user } = req.body;
		const { slides, io } = req.app.locals;
		const objectSid = ObjectId.createFromHexString(sid);
		const slide = await slides.findOne(
			{ _id: objectSid },
			{ projection: { pageTotal: true, pages: true, anonymity: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity !== 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		if (
			isNotValidPage(pageNum, slide.pageTotal) ||
			notExistInList(qid, slide.pages[pageNum - 1].questions) ||
			notExistInList(cid, slide.pages[pageNum - 1].questions[qid].chats)
		) {
			throw { status: 400, error: 'bad request' };
		}

		let uid = slide.anonymity === 'C' || slide.anonymity === 'D' ? req.session.uid : user;
		let insertLike = {}; // cannot use template string on the left hand side
		insertLike[`pages.${pageNum - 1}.questions.${qid}.chats.${cid}.likes`] = uid;

		// if anonymous, randomly generated username may repeat, so it does not make
		// sense to only allow one like per name. So everyone can like as many times
		// as they want
		let updateRes, likeCountChange;
		if (slide.anonymity !== 'A') {
			// like if not yet liked, otherwise unlike
			if (slide.pages[pageNum - 1].questions[qid].chats[cid].likes.includes(uid)) {
				updateRes = await slides.updateOne({ _id: objectSid }, { $pull: insertLike });
				likeCountChange = -1;
			} else {
				updateRes = await slides.updateOne({ _id: objectSid }, { $addToSet: insertLike });
				likeCountChange = 1;
			}
		} else {
			updateRes = await slides.updateOne({ _id: objectSid }, { $push: insertLike });
			likeCountChange = 1;
		}

		if (updateRes.modifiedCount !== 1) {
			throw 'like update error';
		}
		io.to(sid).emit('like', {
			pageNum: pageNum,
			qid: qid,
			cid: cid,
			user: user,
			likeCountChange: likeCountChange,
		});
		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const endorse = async (req, res) => {
	try {
		const { sid, pageNum, qid, cid } = req.body;
		const { courses, slides, io } = req.app.locals;
		const slide = await slides.findOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ projection: { pageTotal: 1, pages: 1, anonymity: 1, course: 1 } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };

		const course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });
		if (!course.instructors.includes(req.session.uid)) {
			throw { status: 403, error: 'Unauthorized' };
		}

		if (
			isNotValidPage(pageNum, slide.pageTotal) ||
			notExistInList(qid, slide.pages[pageNum - 1].questions) ||
			notExistInList(cid, slide.pages[pageNum - 1].questions[qid].chats)
		) {
			throw { status: 400, error: 'bad request' };
		}

		const endorseName = shortName(req.session.realName);
		const updateEndorse = { [`pages.${pageNum - 1}.questions.${qid}.chats.${cid}.endorsement`]: endorseName };
		let updateRes;

		// endorse if not already endorsed, otherwise revoke the endorsement
		let endorseCountChange, solved;
		if (slide.pages[pageNum - 1].questions[qid].chats[cid].endorsement.includes(endorseName)) {
			const chats = slide.pages[pageNum - 1].questions[qid].chats;
			const needUnsetSolved = !chats.some((chat, i) => {
				if (!chat) return false;
				for (let j of chat.endorsement) {
					if (j !== endorseName || (j === endorseName && +i !== cid)) {
						return true;
					}
				}
				return false;
			});
			if (needUnsetSolved) {
				const setUnsolved = {
					[`pages.${pageNum - 1}.questions.${qid}.status`]: 'unsolved',
				};
				updateRes = await req.app.locals.slides.updateOne(
					{ _id: ObjectId.createFromHexString(sid) },
					{ $pull: updateEndorse, $set: setUnsolved }
				);
				solved = 0;
			} else {
				updateRes = await req.app.locals.slides.updateOne(
					{ _id: ObjectId.createFromHexString(sid) },
					{ $pull: updateEndorse }
				);
				solved = 1;
			}
			endorseCountChange = -1;
		} else {
			const setSolved = { [`pages.${pageNum - 1}.questions.${qid}.status`]: 'solved' };
			updateRes = await req.app.locals.slides.updateOne(
				{ _id: ObjectId.createFromHexString(sid) },
				{ $addToSet: updateEndorse, $set: setSolved }
			);
			endorseCountChange = 1;
			solved = 1;
		}

		if (updateRes.modifiedCount !== 1) {
			throw 'endorse update error';
		}
		res.send();
		io.to(sid).emit('endorse', {
			pageNum: pageNum,
			qid: qid,
			cid: cid,
			user: endorseName,
			solved: solved,
			endorseCountChange: endorseCountChange,
		});
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	like,
	endorse,
};
