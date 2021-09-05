const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

const { fileStorage } = require('../../config');
const { errorHandler, shortName, validAnonymities } = require('../util');
const { checkSlideExistsAndIsCourseInstructor } = require('../instructors');

const slideInfo = async (req, res) => {
	try {
		const { slideID } = req.query;
		const { courses, slides } = req.app.locals;
		const slide = await slides.findOne(
			{ _id: ObjectId.createFromHexString(slideID) },
			{ projection: { pages: 0 } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };

		slides.updateOne({ _id: ObjectId.createFromHexString(slideID) }, { $inc: { viewCount: 1 } });

		const course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });

		res.json({
			filename: slide.filename,
			pageTotal: slide.pageTotal,
			title: slide.title,
			anonymity: slide.anonymity,
			loginUser: req.session.uid,
			username: shortName(req.session.realName),
			isInstructor: course.instructors.includes(req.session.uid),
			drawable: slide.drawable,
			downloadable: !slide.notAllowDownload,
			updated: slide.updated,
		});
	} catch (err) {
		errorHandler(res, err);
	}
};

const deleteSlide = async (req, res) => {
	try {
		const { sid } = req.query;
		const { slides, courses } = req.app.locals;
		if (sid.length !== 24) {
			return res.status(400).send();
		}
		await checkSlideExistsAndIsCourseInstructor(slides, courses, sid, req.session.uid);

		let updateRes = await courses.updateMany({}, { $pull: { slides: sid } });
		if (updateRes.modifiedCount !== 1) {
			throw `delete slide from course error: updateRes = ${updateRes}`;
		}

		let removeRes = await slides.deleteOne({ _id: ObjectId.createFromHexString(sid) });
		if (removeRes.deletedCount !== 1) {
			throw `delete slide error: removeRes = ${removeRes}`;
		}

		await fs.promises.rmdir(path.join(fileStorage, sid), { recursive: true });

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const setTitle = async (req, res) => {
	try {
		const { sid, title } = req.body;
		const { slides, courses } = req.app.locals;
		if (typeof sid !== 'string' || sid.length !== 24 || typeof title !== 'string') {
			return res.status(400).send();
		}
		await checkSlideExistsAndIsCourseInstructor(slides, courses, sid, req.session.uid);

		const updateRes = await slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ $set: { title: title } }
		);

		if (updateRes.result.n == 0) {
			throw { status: 400, error: 'set title failed' };
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const setAnonymity = async (req, res) => {
	try {
		const { sid, anonymity } = req.body;
		const { slides, courses } = req.app.locals;
		if (typeof sid !== 'string' || sid.length !== 24 || !validAnonymities.includes(anonymity)) {
			return res.status(400).send();
		}
		await checkSlideExistsAndIsCourseInstructor(slides, courses, sid, req.session.uid);

		const updateRes = await slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ $set: { anonymity: anonymity } }
		);

		if (updateRes.result.n == 0) {
			throw { status: 400, error: 'set anonymity failed' };
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const setDrawable = async (req, res) => {
	try {
		const { sid, drawable } = req.body;
		const { slides, courses } = req.app.locals;
		if (typeof sid !== 'string' || sid.length !== 24 || ![true, false].includes(drawable)) {
			return res.status(400).send();
		}
		await checkSlideExistsAndIsCourseInstructor(slides, courses, sid, req.session.uid);

		const updateRes = await req.app.locals.slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ $set: { drawable: drawable } }
		);

		if (updateRes.result.n == 0) {
			throw { status: 400, error: 'set drawable failed' };
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const setDownloadable = async (req, res) => {
	try {
		const { sid, downloadable } = req.body;
		const { slides, courses } = req.app.locals;
		if (typeof sid !== 'string' || sid.length !== 24 || ![true, false].includes(downloadable)) {
			return res.status(400).send();
		}
		await checkSlideExistsAndIsCourseInstructor(slides, courses, sid, req.session.uid);

		const updateRes = await req.app.locals.slides.updateOne(
			{ _id: ObjectId.createFromHexString(sid) },
			{ $set: { notAllowDownload: !downloadable } }
		);

		if (updateRes.result.n == 0) {
			throw { status: 400, error: 'set downloadable failed' };
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	slideInfo,
	deleteSlide,
	setTitle,
	setAnonymity,
	setDrawable,
	setDownloadable,
};
