const path = require('path');
const { ObjectId } = require('mongodb');

const { fileStorage } = require('../../config');
const { isNotValidPage, errorHandler } = require('../util');

const slideImg = async (req, res) => {
	try {
		const { slideID, pageNum } = req.query;
		const slide = await req.app.locals.slides.findOne(
			{ _id: ObjectId.createFromHexString(slideID) },
			{ projection: { _id: true, anonymity: true, pageTotal: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity !== 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		if (isNotValidPage(pageNum, slide.pageTotal)) {
			throw { status: 400, error: 'bad request' };
		}
		res.sendFile(path.join(fileStorage, slideID, `page-${+pageNum - 1}.png`));
	} catch (err) {
		errorHandler(res, err);
	}
};

const slideThumbnail = async (req, res) => {
	try {
		const { slideID, pageNum } = req.query;
		const slide = await req.app.locals.slides.findOne(
			{ _id: ObjectId.createFromHexString(slideID) },
			{ projection: { _id: true, anonymity: true, pageTotal: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity !== 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		if (isNotValidPage(pageNum, slide.pageTotal)) {
			throw { status: 400, error: 'bad request' };
		}
		res.sendFile(path.join(fileStorage, slideID, 'thumbnails', `thumbnail-${+pageNum - 1}.png`));
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	slideImg,
	slideThumbnail,
};
