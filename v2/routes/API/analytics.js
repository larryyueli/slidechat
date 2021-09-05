const { ObjectId } = require('mongodb');
const { isNotValidPage, errorHandler } = require('../util');

const incrementSlideStats = async (req, res) => {
	try {
		const { slides } = req.app.locals;
		const sid = ObjectId.createFromHexString(req.query.slideID);
		const slide = await slides.findOne(
			{ _id: sid },
			{ projection: { pages: true, anonymity: true, pageTotal: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity !== 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };

		const slideStats = JSON.parse(req.body);
		if (Object.keys(slideStats).some((pageNum) => isNotValidPage(pageNum, slide.pageTotal))) {
			throw { status: 400, error: 'bad request' };
		}

		const maxTime = 600_000; // 10 min in ms
		const increment = {};
		for (let pageNum in slideStats) {
			if (isNotValidPage(pageNum, slide.pageTotal)) continue;
			const { viewCount, timeViewed } = slideStats[pageNum];
			increment[`pages.${pageNum - 1}.viewCount`] = viewCount;
			increment[`pages.${pageNum - 1}.timeViewed`] = timeViewed > maxTime ? maxTime : timeViewed;
		}

		slides.updateOne({ _id: sid }, { $inc: increment });

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const getSlideStats = async (slides, sid) => {
	if (sid.length !== 24) {
		throw { status: 400, error: 'Invalid slide ID' };
	}

	const slide = await slides.findOne({ _id: ObjectId.createFromHexString(sid) });
	if (!slide) throw { status: 400, error: 'Slide not found' };

	const viewCount = [];
	const timeViewed = [];
	for (const i of slide.pages) {
		viewCount.push(i.viewCount || 0);
		timeViewed.push(i.timeViewed || 0);
	}
	return { viewCount, timeViewed };
};

const getSlideStatsJSON = async (req, res) => {
	try {
		res.send(await getSlideStats(req.app.locals.slides, req.query.slideID));
	} catch (err) {
		errorHandler(res, err);
	}
};

const getSlideStatsCSV = async (req, res) => {
	try {
		const { viewCount, timeViewed } = await getSlideStats(req.app.locals.slides, req.query.slideID);
		const csv = 'viewCount, totalTime(ms)\n' + viewCount.map((count, i) => `${count}, ${timeViewed[i]}`).join('\n');
		res.header('Content-Type', 'text/csv');
		res.attachment(`slide-${req.query.slideID}-stats.csv`);
		res.send(csv);
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	incrementSlideStats,
	getSlideStatsJSON,
	getSlideStatsCSV,
};
