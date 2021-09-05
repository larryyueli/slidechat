const { ObjectId } = require('mongodb');
const { errorHandler, shortName, validAnonymities } = require('../util');
const { isInstructor } = require('../instructors');

const myCourses = async (req, res) => {
	try {
		let user = await req.app.locals.users.findOne({ _id: req.session.uid }, { projection: { courses: 1 } });
		if (!user) {
			return res.json({
				uid: req.session.uid,
				user: shortName(req.session.realName),
				courses: [],
			});
		} // does not need to initialize here
		for (let course of user.courses) {
			course.time = ObjectId.createFromHexString(course.id).getTimestamp().getTime();
		}
		res.json({
			uid: req.session.uid,
			user: shortName(req.session.realName),
			courses: user.courses,
		});
	} catch (err) {
		errorHandler(res, err);
	}
};

const minimizeCourse = async (req, res) => {
	try {
		const { cid, status } = req.body;
		const { users } = req.app.locals;
		const user = await users.findOne({ _id: req.session.uid }, { projection: { courses: 1 } });
		if (!user) throw { status: 400, error: 'invalid user/course combination' };
		for (let i in user.courses) {
			if (user.courses[i].id === cid) {
				await users.updateOne(
					{ _id: req.session.uid },
					{
						$set: { [`courses.${i}.minimized`]: Boolean(status) },
					}
				);
				break;
			}
		}
		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const createCourse = async (req, res) => {
	try {
		const { name, anonymity, drawable, downloadable } = req.body;
		const { courses, users } = req.app.locals;
		if (
			typeof name !== 'string' ||
			!name ||
			!validAnonymities.includes(anonymity) ||
			drawable === undefined ||
			downloadable === undefined
		) {
			throw { status: 400, error: 'bad request' };
		}

		const insertRes = await courses.insertOne({
			name: name,
			instructors: [req.session.uid],
			slides: [],
			anonymity: anonymity,
			drawable: Boolean(drawable),
			notAllowDownload: !downloadable,
		});

		const cid = insertRes.ops[0]._id.toHexString();

		const updateRes = await users.updateOne(
			{ _id: req.session.uid },
			{ $push: { courses: { role: 'instructor', id: cid } } },
			{ upsert: true }
		);

		if (updateRes.modifiedCount === 0 && updateRes.upsertedCount === 0) {
			throw 'createCourse update failed';
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const modifyCourseDefault = async (req, res) => {
	try {
		const { cid, name, anonymity, drawable, downloadable } = req.body;
		if (
			cid.length !== 24 ||
			typeof name !== 'string' ||
			!name ||
			!validAnonymities.includes(anonymity) ||
			drawable === undefined ||
			downloadable === undefined
		) {
			throw { status: 400, error: 'bad request' };
		}
		const { courses } = req.app.locals;
		const course = await courses.findOne(
			{ _id: ObjectId.createFromHexString(cid) },
			{ projection: { instructors: 1 } }
		);
		if (!course) throw { status: 404, error: 'not found' };
		if (!course.instructors.includes(req.session.uid)) throw { status: 403, error: 'Unauthorized' };
		const updateRes = await courses.updateOne(
			{ _id: ObjectId.createFromHexString(cid) },
			{
				$set: {
					name: name,
					anonymity: anonymity,
					drawable: Boolean(drawable),
					notAllowDownload: !downloadable,
				},
			}
		);

		if (updateRes.result.n == 0) {
			throw { status: 400, error: 'update course name failed' };
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const deleteCourse = async (req, res) => {
	try {
		const { cid } = req.query;
		const { courses, users } = req.app.locals;
		if (cid.length != 24) {
			throw { status: 400, error: 'bad request' };
		}
		const objectID = ObjectId.createFromHexString(cid);
		const course = await courses.findOne({ _id: objectID }, { projection: { instructors: 1 } });
		if (!course) throw { status: 404, error: 'Course not found' };
		if (!course.instructors.includes(req.session.uid))
			throw { status: 403, error: 'Not an instructor of the course' };

		for (let instructor of course.instructors) {
			await users.updateOne({ _id: instructor }, { $pull: { courses: { id: cid } } });
		}

		let removeRes = await courses.deleteOne({ _id: objectID });
		if (removeRes.deletedCount !== 1) {
			throw `delete course error: removeRes = ${removeRes}`;
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const addInstructor = async (req, res) => {
	try {
		const { newUser, course: cid } = req.body;
		const { courses, users } = req.app.locals;
		if (typeof newUser !== 'string' || !newUser) {
			throw { status: 400, error: 'bad request' };
		}
		const course = await courses.findOne(
			{ _id: ObjectId.createFromHexString(cid) },
			{ projection: { instructors: 1 } }
		);
		if (!course) throw { status: 404, error: 'course not found' };
		if (!course.instructors.includes(req.session.uid)) throw { status: 403, error: 'Unauthorized' };

		if (!isInstructor(newUser)) {
			throw { status: 403, error: 'new user is not an instructor' };
		}

		// add instructor to course
		let updateRes = await courses.updateOne(
			{ _id: ObjectId.createFromHexString(cid) },
			{ $addToSet: { instructors: newUser } }
		);

		if (!updateRes.result.ok) {
			throw `add instructor failed, modifiedCount = ${updateRes.result}`;
		}

		// add course to instructor's course list, create user if not exist
		updateRes = await users.updateOne(
			{ _id: newUser },
			{ $addToSet: { courses: { role: 'instructor', id: cid } } },
			{ upsert: true }
		);

		if (!updateRes.result.ok) {
			throw `add course to instructor failed, ${updateRes.result}`;
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const getCourse = async (req, res) => {
	try {
		const { id: cid } = req.query;
		const { courses, slides } = req.app.locals;
		const course = await courses.findOne({
			_id: ObjectId.createFromHexString(cid),
		});
		if (!course) throw { status: 404, error: 'not found' };

		const courseSlides = [];
		for (let sid of course.slides) {
			const slideEntry = await slides.findOne({ _id: ObjectId.createFromHexString(sid) });
			if (!slideEntry) {
				console.log(`slide ${sid} not found`);
				continue;
			}
			courseSlides.push({
				id: sid,
				filename: slideEntry.filename,
				description: slideEntry.description,
				lastActive: slideEntry.lastActive,
				anonymity: slideEntry.anonymity,
				drawable: slideEntry.drawable,
				viewCount: slideEntry.viewCount,
				downloadable: !slideEntry.notAllowDownload,
			});
		}
		res.json({
			name: course.name,
			instructors: course.instructors,
			slides: courseSlides,
			anonymity: course.anonymity,
			drawable: course.drawable,
			downloadable: !course.notAllowDownload,
		});
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	myCourses,
	minimizeCourse,
	createCourse,
	modifyCourseDefault,
	deleteCourse,
	addInstructor,
	getCourse,
};
