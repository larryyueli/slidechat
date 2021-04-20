const fs = require('fs');
const path = require('path');
const { ObjectID } = require('mongodb');

const { baseURL, authenticationFailMessage } = require('../config');

const instructorListPath = path.join(__dirname, '..', 'instructorList.json');

function readInstructors() {
	try {
		return JSON.parse(fs.readFileSync(instructorListPath));
	} catch (err) {
		console.error('Warning: Failed to load instructor list, it is set to an empty array');
		return [];
	}
}

let instructors = readInstructors();

/**
 * Middleware for checking if the user is logged in as an instructor
 */
function instructorAuth(req, res, next) {
	if (process.env.NODE_ENV !== 'production') {
		req.session.uid = instructors[0];
		req.session.realName = 'Rorolina Frixell';
		next();
	} else if (!req.session.uid) {
		res.redirect(`${baseURL}/p/login/prof`);
	} else if (!isInstructor(req.session.uid)) {
		res.status(401).send(
			`User ${req.session.uid} is not an instructor. This incident will be reported. ${authenticationFailMessage}`
		);
		console.error(`Instructor auth failed: ${req.session.uid}`);
	} else {
		next();
	}
}

/**
 * Check if an uid is in instructor list. If it is not found in the current list,
 * reload instructorList.json and re-check.
 * @param {string} uid
 */
function isInstructor(uid) {
	if (instructors.includes(uid)) {
		return true;
	} else {
		instructors = readInstructors();
		return instructors.includes(uid);
	}
}

function getInstructors() {
	return instructors;
}

const checkSlideExistsAndIsCourseInstructor = async (slides, courses, sid, uid) => {
	const slide = await slides.findOne(
		{ _id: ObjectID.createFromHexString(sid) },
		{ projection: { _id: 1, course: 1 } }
	);
	if (!slide) {
		throw { status: 400, error: 'slide not found' };
	}
	const course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });
	if (!course.instructors.includes(uid)) {
		throw { status: 403, error: 'Unauthorized' };
	}
};

module.exports = {
	isInstructor,
	instructorAuth,
	getInstructors,
	checkSlideExistsAndIsCourseInstructor,
};
