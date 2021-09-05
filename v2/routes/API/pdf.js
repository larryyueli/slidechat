const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { exec } = require('child_process');

const { errorHandler, questionCount } = require('../util');
const PDFImage = require('../../lib/pdf-image');
const { fileStorage, convertOptions } = require('../../config');

const uploadSlide = async (req, res) => {
	try {
		const { cid } = req.body;
		const { file } = req.files;
		const { slides, courses } = req.app.locals;
		if (cid.length != 24 || !file || !file.name.toLocaleLowerCase().endsWith('.pdf')) {
			return res.status(400).send();
		}
		const course = await courses.findOne(
			{ _id: ObjectId.createFromHexString(cid) },
			{ projection: { _id: 1, instructors: 1, anonymity: 1, drawable: 1 } }
		);

		if (!course) {
			throw { status: 400, error: 'course not exist' };
		} else if (!course.instructors.includes(req.session.uid)) {
			throw { status: 403, error: 'Unauthorized' };
		}

		// Step 1: insert into database to get a ObjectId
		const insertRes = await slides.insertOne({
			course: course._id,
			filename: file.name,
			anonymity: course.anonymity,
			drawable: course.drawable,
			notAllowDownload: course.notAllowDownload,
		});

		// Step 2: use the id as the directory name, create a directory, move pdf to directory
		const objID = insertRes.ops[0]._id;
		const id = objID.toHexString();
		const dir = path.join(fileStorage, id);
		const thumbnailDir = path.join(dir, 'thumbnails');
		// overwrite if exists. should not happen: id is unique
		if (fs.existsSync(dir)) {
			console.log(`Directory ${id} already exists, overwriting...`);
			await fs.promises.rmdir(dir, { recursive: true });
		}
		await fs.promises.mkdir(thumbnailDir, { recursive: true });
		await file.mv(path.join(dir, file.name));

		// Step 3: convert to images
		const pdfImage = new PDFImage(path.join(dir, file.name), {
			imageFileBaseName: 'page',
			thumbnailFileBaseName: 'thumbnail',
			outputDirectory: dir,
			outputThumbnails: thumbnailDir,
			convertOptions: convertOptions,
		});
		const imagePaths = await pdfImage.convertFile();

		// Step 4: create the list of pages, update database
		const pages = imagePaths.map((_) => {
			return { questions: [] };
		});
		let updateRes = await slides.updateOne(
			{ _id: objID },
			{
				$set: {
					pages: pages,
					pageTotal: imagePaths.length,
					unused: [],
				},
			}
		);
		if (updateRes.modifiedCount !== 1) {
			throw 'slide add pages failed';
		}

		// step 5: add slide to its course
		updateRes = await courses.updateOne({ _id: ObjectId.createFromHexString(cid) }, { $push: { slides: id } });
		if (updateRes.modifiedCount !== 1) {
			throw 'slide add to course failed';
		}

		// step 6: add a default question
		const time = Date.now();
		const newQuestion = {
			status: 'unsolved',
			time: time,
			chats: [
				{
					time: time,
					body: 'You can ask a question to have a discussion on any page of the slides; others will be able to answer you and join the discussion. \n\nTo learn more features about how SlideChat works, check out [this demo](https://mcsapps.utm.utoronto.ca/slidechat/5f1b35eb3997b943b856e362)',
					user: 'SlideChat',
					uid: 'SlideChat',
					likes: [],
					endorsement: [],
				},
			],
			title: 'Welcome to SlideChat!',
		};
		updateRes = await slides.updateOne(
			{ _id: objID },
			{
				$push: {
					['pages.0.questions']: newQuestion,
				},
				$set: {
					lastActive: time,
				},
			}
		);
		if (updateRes.modifiedCount !== 1) {
			throw 'error when adding default question after uploading';
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const replaceSlide = async (req, res) => {
	try {
		const { sid } = req.body;
		const { file } = req.files;
		const { slides, courses } = req.app.locals;
		if (typeof sid !== 'string' || sid.length != 24 || !file || !file.name.toLocaleLowerCase().endsWith('.pdf')) {
			return res.status(400).send();
		}
		const slide = await slides.findOne({ _id: ObjectId.createFromHexString(sid) });
		if (!slide) {
			throw { status: 400, error: 'slide not found' };
		}

		const course = await courses.findOne({ _id: slide.course }, { projection: { instructors: 1 } });
		if (!course.instructors.includes(req.session.uid)) {
			throw { status: 403, error: 'Not an instructor of the course' };
		}

		const dir = path.join(fileStorage, sid);
		const thumbnailDir = path.join(dir, 'thumbnails');
		// remove old slide
		if (fs.existsSync(dir)) {
			await fs.promises.rmdir(dir, { recursive: true });
		}
		await fs.promises.mkdir(thumbnailDir, { recursive: true });
		await file.mv(path.join(dir, file.name));

		// Step 3: convert to images
		let pdfImage = new PDFImage(path.join(dir, file.name), {
			imageFileBaseName: 'page',
			thumbnailFileBaseName: 'thumbnail',
			outputDirectory: dir,
			outputThumbnails: thumbnailDir,
			convertOptions: convertOptions,
		});
		const imagePaths = await pdfImage.convertFile();

		// Step 4: create the list of pages, update database
		const pages = slide.pages;
		const oldLength = pages.length;
		const newLength = imagePaths.length;
		let updateRes;
		const updateTime = Date.now();
		if (oldLength > newLength) {
			// remove empty pages
			let i = newLength;
			while (i < pages.length) {
				if (questionCount(pages[i].questions) === 0) {
					pages.splice(i, 1);
				} else {
					i++;
				}
			}
			updateRes = await slides.updateOne(
				{ _id: ObjectId.createFromHexString(sid) },
				{
					$set: {
						pages: pages.slice(0, newLength),
						pageTotal: newLength,
						filename: file.name,
						updated: updateTime,
					},
					$push: {
						unused: {
							$each: pages.slice(newLength), // your batch
						},
					},
				}
			);
		} else {
			// add empty pages to new pages
			for (let i = oldLength; i < newLength; i++) {
				pages.push({ questions: [] });
			}
			updateRes = await slides.updateOne(
				{ _id: ObjectId.createFromHexString(sid) },
				{
					$set: {
						pages: pages,
						pageTotal: newLength,
						filename: file.name,
						updated: updateTime,
					},
				}
			);
		}

		if (updateRes.result.n == 0) {
			throw { status: 400, error: 'upload new slide failed' };
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const importSlide = async (req, res) => {
	try {
		const { cid, sid } = req.body;
		const { courses, slides } = req.app.locals;
		if (typeof cid !== 'string' || cid.length !== 24 || typeof sid !== 'string' || sid.length != 24)
			return res.status(400).send();

		const slide = await slides.findOne({ _id: ObjectId.createFromHexString(sid) });
		if (!slide) throw { status: 400, error: 'Slides do not exist' };
		if (slide.notAllowDownload)
			throw { status: 400, error: 'You cannot import a slide that does not allow download' };
		const course = await courses.findOne(
			{ _id: ObjectId.createFromHexString(cid) },
			{ projection: { instructors: 1 } }
		);
		if (!course.instructors.includes(req.session.uid))
			throw { status: 403, error: 'Not an instructor of the course' };
		if (course.slides && course.slides.includes(sid)) throw { status: 400, error: 'Slides already exists' };

		delete slide._id;
		const copied = await slides.insertOne(slide);
		const newObjID = copied.ops[0]._id;
		const newID = newObjID.toHexString();
		const newDir = path.join(fileStorage, newID);
		const dir = path.join(fileStorage, sid);
		await new Promise((resolve, reject) => {
			exec(`cp -R ${dir} ${newDir}`, (err, stdout, stderr) => {
				if (err) {
					return reject({
						message: 'Failed to copy files',
						error: err,
						stdout: stdout,
						stderr: stderr,
					});
				}
				return resolve();
			});
		});

		const updateRes = await courses.updateOne(
			{ _id: ObjectId.createFromHexString(cid) },
			{ $push: { slides: newID } }
		);
		if (!updateRes.result.ok) {
			throw 'slide add to course failed';
		}

		res.send();
	} catch (err) {
		errorHandler(res, err);
	}
};

const downloadPdf = async (req, res) => {
	try {
		const { slideID } = req.query;
		let slide = await req.app.locals.slides.findOne(
			{ _id: ObjectId.createFromHexString(slideID) },
			{ projection: { filename: true, anonymity: true, notAllowDownload: true } }
		);
		if (!slide) throw { status: 404, error: 'slide not found' };
		if (slide.anonymity != 'A' && !req.session.uid) throw { status: 401, error: 'Unauthorized' };
		if (slide.notAllowDownload) throw { status: 403, error: 'The slide is not allowed to be downloaded' };
		res.download(path.join(fileStorage, slideID, slide.filename));
	} catch (err) {
		errorHandler(res, err);
	}
};

module.exports = {
	uploadSlide,
	replaceSlide,
	importSlide,
	downloadPdf,
};
