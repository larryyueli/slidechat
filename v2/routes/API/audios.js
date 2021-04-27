const path = require('path');
const fs = require('fs');
const { ObjectID } = require('mongodb');

const { fileStorage } = require('../../config');
const { isNotValidPage, errorHandler } = require('../util');

const hasAudio = async (req, res) => {
	try {
		if (req.query.slideID.length !== 24) {
			return res.status(400).send();
		}
		const slide = await req.app.locals.slides.findOne(
			{ _id: ObjectID.createFromHexString(req.query.slideID) },
			{ projection: { audios: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		res.json(slide.audios);
	} catch (err) {
		errorHandler(res, err);
	}
};

const getAudio = async (req, res) => {
	try {
		const { slideID, pageNum } = req.query;
		if (slideID.length !== 24) {
			return res.status(400).send();
		}
		const slide = await req.app.locals.slides.findOne(
			{ _id: ObjectID.createFromHexString(slideID) },
			{ projection: { _id: true, anonymity: true, audios: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity !== 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		const filename = slide.audios[pageNum];
		if (!filename) return res.status(404).send();
		res.sendFile(path.join(fileStorage, slideID, pageNum, filename));
	} catch (err) {
		errorHandler(res, err);
	}
};

const postAudio = async (req, res) => {
	try {
		const { sid, pageNum } = req.body;
		const { file } = req.files;
		const { slides, courses } = req.app.locals;
		if (typeof sid !== 'string' || sid.length !== 24 || !file || !file.name.toLocaleLowerCase().endsWith('.mp3')) {
			return res.status(400).send();
		}
		const slide = await slides.findOne({ _id: ObjectID.createFromHexString(sid) });
		if (!slide) {
			throw { status: 400, error: 'slide not found' };
		}

		const course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });
		if (!course.instructors.includes(req.session.uid)) {
			throw { status: 403, error: 'Unauthorized' };
		} else if (isNotValidPage(pageNum, slide.pageTotal)) {
			throw { status: 400, error: 'bad request' };
		}

		const dir = path.join(fileStorage, sid, pageNum);
		// remove old audio
		if (fs.existsSync(dir)) {
			await fs.promises.rmdir(dir, { recursive: true });
		}
		await fs.promises.mkdir(dir, { recursive: true });
		await file.mv(path.join(dir, file.name));

		const updateRes = await slides.updateOne(
			{ _id: ObjectID.createFromHexString(sid) },
			{
				$set: {
					[`audios.${pageNum}`]: file.name,
				},
			}
		);
		if (!updateRes.result.ok) {
			throw 'audio upload failed';
		}
		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const deleteAudio = async (req, res) => {
	try {
		const { sid, pageNum } = req.query;
		const { slides, courses } = req.app.locals;
		if (sid.length !== 24) {
			return res.status(400).send();
		}
		const slide = await slides.findOne({ _id: ObjectID.createFromHexString(sid) });
		if (!slide) {
			throw { status: 400, error: 'slide not found' };
		}

		const course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });
		if (!course.instructors.includes(req.session.uid)) {
			throw { status: 403, error: 'Unauthorized' };
		} else if (isNotValidPage(pageNum, slide.pageTotal)) {
			throw { status: 400, error: 'bad request' };
		}

		const dir = path.join(fileStorage, sid, pageNum);
		// remove old audio
		if (fs.existsSync(dir)) {
			await fs.promises.rmdir(dir, { recursive: true });
		}

		const updateRes = await slides.updateOne(
			{ _id: ObjectID.createFromHexString(sid) },
			{
				$unset: {
					[`audios.${pageNum}`]: '',
				},
			}
		);
		if (!updateRes.result.ok) {
			throw 'audio delete failed';
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	hasAudio,
	getAudio,
	postAudio,
	deleteAudio,
};
