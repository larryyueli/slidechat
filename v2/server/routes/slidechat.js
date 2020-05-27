const express = require('express');
const PDFImage = require("../lib/pdf-image").PDFImage;
const fs = require('fs');
const path = require('path');

const { MongoClient, ObjectID } = require('mongodb');
const dbConfig = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
};

const config = JSON.parse(fs.readFileSync('config.json'));
const instructors = config.instructors;
const dbURL = config.dbURL;

function errorHandler(res, err) {
    if (err && err.status) {
        return res.status(err.status).send({ error: err.error });
    } else {
        console.error(err);
        return res.status(500).send();
    }
}

function instructorAuth(req, res, next) {
    // todo
    if (instructors.indexOf(req.body.user) < 0) {
        res.status(401).send("Unauthorized");
        console.error(req.body);
    } else {
        next();
    }
}

function isNotValidPage(pageNum, pageTotal) {
    if (isNaN(pageNum)
        || +pageNum < 1
        || +pageNum > pageTotal) {
        return true;
    }
    return false;
}

function isNotValidQuestionID(qid, questions) {
    if (isNaN(qid)
        || +qid < 0
        || +qid >= questions.length) {
        return true;
    }
    return false;
}

async function startApp() {
    const router = express.Router();

    let dbClient;
    try {
        dbClient = await MongoClient.connect(dbURL, dbConfig);
    } catch {
        console.error("Cannot connect to the database, shutting down...");
        process.exit(1);
    }

    console.log('connected to database');
    const db = dbClient.db('slidechat');
    const users = db.collection('users');
    const courses = db.collection('courses');
    const slides = db.collection('slides');


    /**=====================
     *    Instructor APIs
     * ===================== */

    /**
     * create a new course
     * req body:
     *   course: course name
     *   user: instructor utorid
     */
    router.post('/api/createCourse', instructorAuth, async (req, res) => {
        try {
            let insertRes = await courses.insertOne({
                name: req.body.course,
                instructors: [req.body.user],
                slides: []
            });

            let courseID = insertRes.ops[0]._id.toHexString();

            let updateRes = await users.updateOne({ _id: req.body.user },
                { $push: { courses: { role: "instructor", id: courseID } } },
                { upsert: true });

            if (updateRes.modifiedCount === 0 && updateRes.upsertedCount === 0) {
                throw "createCourse update failed";
            }

            console.log(`created course: ${req.body.course}`);
            res.json({ id: courseID });
        } catch (err) {
            errorHandler(res, err);
        }
    });


    /**
     * add a new instructor to a course
     * body:
     *   user: utorid
     *   newUser: utorid
     *   course: object ID of a course
     */
    router.post('/api/addInstructor', instructorAuth, async (req, res) => {
        try {
            if (typeof req.body.newUser !== 'string') {
                throw { status: 400, error: 'bad request' };
            }
            let course = await courses.findOne({ _id: ObjectID.createFromHexString(req.body.course) },
                { projection: { instructors: 1 } });
            if (!course) throw { status: 404, error: "course not found" };
            if (course.instructors.indexOf(req.body.user) < 0) throw { status: 401, error: "Unauthorized" };

            // add instructor to course
            let updateRes = await couses.updateOne({ _id: ObjectID.createFromHexString(req.body.course) },
                { $push: { instructors: req.body.newUser } });
            if (updateRes.modifiedCount !== 1) {
                throw `add instructor failed, modifiedCount = ${updateRes.modifiedCount}`;
            }

            // add course to instructor's course list
            updateRes = await users.updateOne({ _id: req.body.newUser },
                { $push: { courses: { role: "instructor", id: courseID } } },
                { upsert: true });

            if (updateRes.modifiedCount === 0 && updateRes.upsertedCount === 0) {
                throw "add course to instructor failed";
            }

            res.send();
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * add a new slide to course
     * req body:
     *   cid: course id
     *   anonymity: anonymity level of the slide
     *   user: instructor utorid
     * req.files:
     *   file: *.pdf
     */
    router.post('/api/addSlide', instructorAuth, async (req, res) => {
        try {
            if (req.body.cid.length != 24
                || (["anyone", "UofT student", "nonymous"].indexOf(req.body.anonymity) < 0)
                || !req.files.file
                || !req.files.file.name.toLocaleLowerCase().endsWith('.pdf')) {
                return res.status(400).send();
            }
            let course = await courses.findOne({ _id: ObjectID.createFromHexString(req.body.cid) });

            if (!course) {
                throw { status: 400, error: "course not exist" };
            } else if (false) {   // check in instructor's list TODO: UNSAFE
                throw { status: 403, error: "Unauthorized" };
            }

            // Step 1: insert into database to get a ObjectID
            let insertRes = await slides.insertOne({
                filename: req.files.file.name,
                anonymity: req.body.anonymity
            });

            // Step 2: use the id as the directory name, create a directory, move pdf to directory
            let objID = insertRes.ops[0]._id;
            let id = objID.toHexString();
            let dir = path.join('files', id);
            console.log(`Saving files to: ${dir}`);

            // overwrite if exists. should not happen: id is unique
            if (fs.existsSync(dir)) {
                console.log(`Directory ${id} already exists, overwriting...`);
                fs.rmdirSync(dir, { recursive: true });
            }
            fs.mkdirSync(path.join('files', id));

            await req.files.file.mv(path.join(dir, req.files.file.name));

            // Step 3: convert to images
            let pdfImage = new PDFImage(path.join(dir, req.files.file.name), {
                pdfFileBaseName: 'page',
                outputDirectory: dir
            });
            let imagePaths = await pdfImage.convertFile();

            // Step 4: create the list of pages, update database
            let pages = [];
            for (let i of imagePaths) {
                pages.push({ questions: [] });
            }
            let updateRes = await slides.updateOne({ _id: objID }, {
                $set: {
                    pdfLocation: path.join(dir, req.files.file.name),
                    pages: pages,
                    pageTotal: imagePaths.length
                }
            });
            if (updateRes.modifiedCount !== 1) {
                throw "slide add pages failed";
            }

            // step 5: add slide to its course
            updateRes = await courses.updateOne({ _id: ObjectID.createFromHexString(req.body.cid) },
                { $push: { slides: id } });
            if (updateRes.modifiedCount !== 1) {
                throw "slide add to course failed";
            }

            console.log("pdf file processing complete")
            res.json({ id: id });
        } catch (err) {
            errorHandler(res, err);
        }
    });

    // router.post('/api/testPDF', (req, res) => {
    //     console.log(req.files.file.name);
    //     res.send();
    // });


    /**====================
     *    Everyone APIs
     * ==================== */

    /**
     * get the courses the user joined, either as an instructor or a student
     * also the list of slides of that each course
     * req body:
     *   id: utorid
     */
    router.get('/api/myCourses', async (req, res) => {
        try {
            let user = await users.findOne({ _id: req.query.id });
            if (!user) return res.json([]);  // does not need to initialize here

            let result = [];
            console.log(user.courses);
            for (let course of user.courses) {
                let myCourse = await courses.findOne({ _id: ObjectID.createFromHexString(course.id) },
                    { projection: { instructors: 0 } });
                if (!myCourse) {
                    console.log(`course ${course.id} not found`);
                    continue;
                }

                let courseSlides = [];

                console.log(myCourse.slides);
                for (let slideId in myCourse.slides) {
                    let slideEntry = await slides.findOne({ _id: ObjectID.createFromHexString(slideId) },
                        { projection: { filename: 1 } });
                    if (!slideEntry) {
                        console.log(`slide ${slideId} not found`);
                        continue;
                    }
                    courseSlides.push({ filename: slideEntry.filename, id: slideId });
                }
                result.push({
                    name: myCourse.name,
                    role: course.role,
                    slides: courseSlides
                });
            }
            res.json(result);
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * get slide image
     * req body:
     *   slideID: object ID of the slide
     *   pageNum: integer range from from 1 to pageTotal (inclusive)
     */
    router.get('/api/slideImg', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.query.slideID) },
                { projection: { _id: true } });
            if (!slide) throw { status: 404, error: "slide not found" };
            if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
                throw { status: 400, error: "bad request" };
            }
            res.sendFile(`page-${+req.query.pageNum - 1}.png`, {
                root: path.join('files', req.query.slideID)
            });
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * get total number of pages of a slide
     * req body:
     *   slideID: object ID of a slide
     */
    router.get('/api/pageTotal', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.query.slideID) },
                { projection: { pageTotal: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            res.json({ pageTotal: slide.pageTotal });
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * get question list of a page
     * req body:
     *   slideID: object ID of a slide
     *   pageNum: integer range from from 1 to pageTotal (inclusive)
     */
    router.get('/api/questions', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.query.slideID) },
                { projection: { pages: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            if (isNotValidPage(req.query.pageNum, slide.pageTotal)) {
                throw { status: 400, error: "bad request" };
            }
            let result = slide.pages[+req.query.pageNum - 1].questions;
            for (let question of result) {
                delete question.chats;
            }
            res.json(result);
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * get chats under a question
     * req query:
     *   slideID: object ID of a slide
     *   pageNum: integer range from from 1 to pageTotal (inclusive)
     *   qid: question index, integer range from from 0 to questions.length (exclusive)
     */
    router.get('/api/chats', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.query.slideID) },
                { projection: { pages: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            if (isNotValidPage(req.query.pageNum, slide.pageTotal)
                || isNotValidQuestionID(req.query.qid, slide.pages[+req.query.pageNum - 1].questions)) {
                throw { status: 400, error: "bad request" };
            }
            res.json(slide.pages[+req.query.pageNum - 1].questions[req.query.qid].chats);
        } catch (err) {
            errorHandler(res, err);
        }
    });


    /**
     * add a new question to page
     * req body:
     *   sid: slide id
     *   pageNum: page number
     *   title: question title
     *   body: question body
     *   user: utorid
     */
    router.post('/api/addQuestion', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { projection: { pageTotal: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            if (isNotValidPage(req.body.pageNum, slide.pageTotal)
                || typeof req.body.title !== 'string'
                || typeof req.body.body !== 'string'
                || typeof req.body.user !== 'string') {
                throw { status: 400, error: "bad request" };
            }

            let time = Date.now();
            let newQuestion = {
                status: "unsolved",
                time: time,
                chats: [],
                title: req.body.title,
                user: req.body.user
            };
            let newChat = {
                time: time,
                body: req.body.body,
                user: req.body.user,
                likes: [],
                endorsement: []
            };
            newQuestion.chats.push(newChat);

            let insertQuestion = {}; // cannot use template string on the left hand side
            insertQuestion[`pages.${req.body.pageNum - 1}.questions`] = newQuestion;
            let updateRes = await slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { $push: insertQuestion });
            if (updateRes.modifiedCount !== 1) {
                throw "question update error";
            }

            res.send();
        } catch (err) {
            errorHandler(res, err);
        }
    });


    /**
     * add a new chat to question
     * body:
     *   sid: slide id
     *   qid: question index, integer range from from 0 to questions.length (exclusive)
     *   pageNum: page number
     *   body: message body
     *   user: utorid
     */
    router.post('/api/addChat', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { projection: { pageTotal: 1, pages: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            if (isNotValidPage(req.body.pageNum, slide.pageTotal)
                || isNotValidQuestionID(req.body.qid, slide.pages[+req.body.pageNum - 1].questions)
                || typeof req.body.body !== 'string'
                || typeof req.body.user !== 'string') {
                throw { status: 400, error: "bad request" };
            }

            let time = Date.now();
            let newChat = {
                time: time,
                body: req.body.body,
                user: req.body.user,
                likes: [],
                endorsement: []
            };

            let insertChat = {}; // cannot use template string on the left hand side
            insertChat[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats`] = newChat;
            let updateLastActiveTime = {};
            updateLastActiveTime[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.time`] = time;
            let updateRes = await slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { $push: insertChat, $set: updateLastActiveTime });

            if (updateRes.modifiedCount !== 1) {
                throw "chat update error";
            }

            res.send();
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * add a new chat to question
     * req body:
     *   sid: slide id
     *   qid: question index
     *   cid: chat index
     *   pageNum: page number
     *   user: utorid
     */
    router.post('/api/like', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { projection: { questions: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            if (isNotValidPage(req.body.pageNum, slide.pageTotal)
                || isNotValidQuestionID(req.body.qid, slide.pages[+req.body.pageNum - 1].questions)
                || typeof req.body.title !== 'string'
                || typeof req.body.body !== 'string'
                || typeof req.body.user !== 'string') {
                throw { status: 400, error: "bad request" };
            }

            // is valid chat id
            if (isNaN(req.body.cid)
                || +req.body.cid < 0
                || +req.body.cid > slide.pages[+req.body.pageNum - 1].questions[req.body.qid].length) {
                throw { status: 400, error: "bad request" };
            }

            let insertLike = {}; // cannot use template string on the left hand side
            // if instructor, add to endorsement, else add to likes
            if (instructors.indexOf(req.body.user) < 0) {
                insertLike[`pages.${req.body.pageNum}.questions.${req.body.qid}.chats.${req.body.cid}.likes`] = req.body.user;
            } else {
                insertLike[`pages.${req.body.pageNum}.questions.${req.body.qid}.chats.${req.body.cid}.endorsement`] = req.body.user;
            }
            let updateRes = await slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { $push: insertLike });

            if (updateRes.modifiedCount !== 1) {
                throw "like update error";
            }

            res.send();
        } catch (err) {
            errorHandler(res, err);
        }
    });

    router.get('/', (req, res) => res.sendFile('index.html', { root: 'static' }));

    router.get('/:slideID([A-Fa-f0-9]+)/', (req, res) => { res.sendFile('index.html', { root: 'react-build' }); });

    router.use(express.static('react-build'));

    router.use((req, res) => res.status(404).send());

    console.log("slidechat app started");
    return router;
}

module.exports = startApp;
