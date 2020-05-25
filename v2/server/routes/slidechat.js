const express = require('express');
const PDFImage = require("pdf-image").PDFImage;
const fs = require('fs');
const path = require('path');

const { MongoClient, ObjectID } = require('mongodb');
const dbConfig = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
};


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
    next();
}

async function startApp() {
    const router = express.Router();

    const config = JSON.parse(fs.readFileSync('config.json'));
    const instructors = config.instructors;
    const dbURL = config.dbURL;

    let dbClient;
    try {
        dbClient = await MongoClient.connect(dbURL, dbConfig);
    } catch {
        console.error("Cannot connect to the database, shutting down...");
        process.exit(1);
    }

    const db = dbClient.db('slidechat');
    const users = db.collection('users');
    const courses = db.collection('courses');
    const slides = db.collection('slides');

    router.get('/api/:slideID/:pageNumber/img', (req, res) => {
        slides.findOne({
            _id: ObjectID.createFromHexString(req.params.slideID)
        }).then(slide => {
            if (!slide) throw { status: 404, error: "slide not found" };
            res.json({ img: slide.pages[req.params.pageNumber].location });
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    router.get('/api/:slideID/:pageNumber/questions', (req, res) => {
        slides.findOne({
            _id: ObjectID.createFromHexString(req.params.slideID)
        }).then(slide => {
            if (!slide) {
                throw { status: 404, error: "slide not found" };
            }
            let result = { questions: slide.pages[req.params.pageNumber].questions };
            for (let question of result.questions) {
                delete question.chats;
            }
            res.json(result);
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    router.get('/api/:slideID/:pageNumber/:questionID', (req, res) => {
        slides.findOne({
            _id: ObjectID.createFromHexString(req.params.slideID)
        }).then(slide => {
            if (!slide) throw { status: 404, error: "slide not found" };
            res.json({
                questions: slide.pages[req.params.pageNumber].questions[req.params.questionID].body,
                comments: slide.pages[req.params.pageNumber].questions[req.params.questionID].chats
            });
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    /**
     * add a new instructor to users
     * body:
     * userName: admin's user name
     * password: admin's password
     * utorID: utorID
     */
    // router.post('/api/addInstructor', (req, res) =>  {
    //     if (typeof req.body.utorID != 'number'){
    //         return res.status(400).send({error:"invalid urtorID"});
    //     } if (req.body.userName != "admin user name" || req.body.password != "admin password"){
    //         return res.status(403).send({ error: "invalid userName or password" });
    //     }
    //     MongoClient.connect(url)
    //         .then(function (client) {
    //             const slidechat = client.db('slidechat');
    //             req.users = slidechat.collection('users');
    //             return req.users.findOne({ _id: req.body.utorID });
    //         }).then(usersRes =>{
    //             if (usersRes){
    //                 throw { status: 400, error: "this user is an instructor" };
    //             }
    //             return req.users.insertOne({ _id: req.body.utorID, courses: [] });
    //         }).then(usersRes => {
    //             console.log(`Inserted instructor ${JSON.stringify(usersRes.ops[0])}`);
    //             res.json({ "ok": usersRes.ops[0]._id });
    //         }).catch(err => { 
    //             if (err.status){
    //                 return res.status(err.status).send({ error: err.error}); 
    //             }else{
    //                 console.error(err);
    //                 return res.status(500).send(); 
    //             }
    //         });
    // });

    /**
     * add a new course to user
     * body:
     * name: course name
     * author: uploader's utorid
     */
    router.post('/api/createCourse', instructorAuth, (req, res) => {
        users.findOne({
            _id: req.body.author
        }).then(user => {
            if (!user || instructors.indexOf(user._id) < 0) {
                throw { status: 401, error: "Unauthorized" };
            }
            req.user = user;
            let newCourse = { name: req.body.name, instructors: [req.body.author], slides: [] };
            return courses.insertOne(newCourse);
        }).then(course => {
            console.log(`Inserted course ${JSON.stringify(course.ops[0]._id)}`);
            req.id = course.ops[0]._id.toHexString();
            req.user.courses.push({ role: "instructor", id: req.id });
            return users.updateOne({ _id: req.body.author }, { $push: { courses: { role: "instructor", id: req.id } } });
        }).then(updateRes => {
            if (updateRes.modifiedCount > 0) {
                console.log(`updated user ${JSON.stringify(req.body.author)}`);
                res.json({ id: req.id });
            } else {
                throw "createCourse update error";
            }
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    /**
     * join a course
     * body:
     * cid: course id
     * author: uploader's utorid
     */
    // router.post('/api/joinCourse', (req, res) =>  {
    //     MongoClient.connect(url, function (err, db) {
    //         var courses = db.collection('courses');
    //         var course = null;
    //         courses.findOne({ _id: ObjectID.createFromHexString(req.body.cid) }, function (err, res) {
    //             course = res.ops[0];
    //         });
    //         if (!course) {
    //             res.status(404).json({ error: "course not exist" });
    //         } else {
    //             var users = db.collection('users');
    //             users.findOne({ _id: ObjectID.createFromHexString(req.body.author) }, function (err, res) {
    //                 var user = res.ops[0];
    //                 user.courses.push({ role: "student", id: course._idtoHexString() });
    //             });
    //             res.json({});
    //         }
    //     });
    // });

    router.post('/api/testPDF', (req, res) => {
        console.log(req.files.file.name);
    });

    /**
     * add a new slide to course
     * body:
     * cid: course id
     * anoymity: anoymity level of the slide
     * author: uploader's utorid
     */
    router.post('/api/addSlide', instructorAuth, (req, res) => {
        if (req.body.cid.length != 24
            || (["anyone", "UofT student", "nonymous"].indexOf(req.body.anoymity) < 0)
            || !req.files.file
            || !req.files.file.name.toLocaleLowerCase().endsWidth('.pdf')) {
            return res.status(400).send();
        }

        courses.findOne({
            _id: ObjectID.createFromHexString(req.body.cid)
        }).then(course => {
            if (!course) {
                throw { status: 404, error: "course not exist" };
            } else if (course.instructors.indexOf(req.body.author) < 0) {   // TODO: UNSAFE
                throw { status: 403, error: "Unauthorized" };
            }

            // Step 1: insert into database to get a ObjectID
            let newSlide = {
                filename: req.files.file.name,
                anoymity: req.body.anoymity
            };
            return slides.insertOne(newSlide);
        }).then(slide => {  // Step 2: use the id as the directory name, create a directory, move pdf to directory
            req.ObjectID = slide.ops[0]._id;
            req.id = req.ObjectID.toHexString();
            req.dir = path.join('files', req.id);
            console.log(`Saving files to: ${req.dir}`);

            // overwrite if exists. should not happen: id is unique
            if (fs.existsSync(req.dir)) {
                console.log(`Directory ${id} already exists, overwriting...`);
                fs.rmdirSync(req.dir, { recursive: true });
            }

            fs.mkdirSync(path.join('files', id));
            return req.files.file.mv(req.dir);
        }).then(_ => {  // Step 3: convert to images
            let pdfImage = new PDFImage(path.join(req.dir, req.files.file.name), {
                pdfFileBaseName: 'page',
                outputDirectory: req.dir
            });
            return pdfImage.convertFile();
        }).then(imagePaths => { // Step 4: create the list of pages, update database
            let pages = [];
            for (let i of imagePaths) {
                pages.push({ location: i, questions: [] });
            }
            return slides.updateOne({ _id: req.ObjectID }, {
                $set: {
                    pdfLocation: path.join(req.dir, req.files.file.name),
                    pages: pages
                }
            });
        }).then(updateRes => {  // step 5: add slide to its course
            if (updateRes.modifiedCount <= 0) {
                throw "slide update pages error";
            }
            return courses.updateOne({ _id: ObjectID.createFromHexString(req.body.cid) }, { $push: { slides: req.id } });
        }).then(updateRes => {  // done
            if (updateRes.modifiedCount <= 0) {
                throw "slide update error";
            }
            res.json({ ok: req.id });
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    router.get('/api/myCourses', instructorAuth, (req, res) => {
        users.findOne({
            _id: req.body.id
        }).then(async user => {
            if (!user) { throw { status: 404, error: "user not found" } }
            let result = [];
            for (let course of user.courses) {
                let myCourse = await courses.findOne({ _id: ObjectID.createFromHexString(course.id) }, { name: 1, slides: 1 });
                if (!myCourse) {
                    console.log(`course ${course.id} not found`);
                    continue;
                }
                // console.log(myCourse);
                let courseSlides = [];
                for (let slideId in myCourse.slides) {
                    let slideEntry = await slides.findOne({ _id: ObjectID.createFromHexString(slideId) }, { filename: 1 });
                    if (!slideEntry) {
                        console.log(`slide ${slideId} not found`);
                        continue;
                    }
                    courseSlides.push({ filename: slideEntry.filename, id: slideId });
                }
                result.push({
                    name: myCourse.name,
                    slides: courseSlides
                });
            }
            res.json(result);
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    /**
     * add a new question to page
     * body:
     * sid: slide id
     * pageNum: page number
     * title: question title
     * body: question body
     * author: uploader's utorid
     */
    router.post('/api/addQuestion', (req, res) => {
        if (req.body.sid.length != 24) {
            return res.status(400).send();
        }

        slides.findOne({
            _id: ObjectID.createFromHexString(req.body.sid)
        }).then(slide => {
            if (!slide) {
                throw { status: 404, error: "slide not found" };
            } else if (req.body.pageNum >= slide.pages.length) {
                throw { status: 400, error: "Bad Request" };
            }

            let newQuestion = { status: "unsolved", time: Date(), chats: [], title: req.body.title, author: req.body.author };
            var newChat = { time: Date(), body: req.body.body, author: req.body.author, likes: [], endorsement: null };
            newQuestion.chats.push(newChat);
            let insertQuestion = {}; // cannot use template string on the left hand side
            insertQuestion[`pages.${req.body.pageNum}.questions`] = newQuestion;

            return slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) }, { $push: insertQuestion });
        }).then(updateRes => {
            if (updateRes.modifiedCount > 0) {
                console.log(`updated slide ${JSON.stringify(req.body.sid)}`);
                res.json({ id: req.id });
            } else {
                throw "question update error";
            }
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    /**
     * add a new chat to question
     * body:
     * sid: slide id
     * qid: question index
     * pageNum: page number
     * body: question body
     * author: uploader's utorid
     */
    router.post('/api/addChat', (req, res) => {
        if (req.body.sid.length != 24) {
            return res.status(400).send();
        }

        slides.findOne({
            _id: ObjectID.createFromHexString(req.body.sid)
        }).then(slide => {
            if (!slide) {
                throw { status: 404, error: "slide not found" };
            } else if (req.body.pageNum >= slide.pages.length
                || req.body.qid >= slide.pages[req.body.pageNum].questions.length) {
                throw { status: 400, error: "Bad Request" };
            }
            let newChat = { time: Date(), body: req.body.body, author: req.body.author, likes: [], endorsement: null };
            let insertChat = {}; // cannot use template string on the left hand side
            insertChat[`pages.${req.body.pageNum}.questions.${req.body.qid}.chats`] = newChat;
            return slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) }, { $push: insertChat });
        }).then(updateRes => {
            if (updateRes.modifiedCount > 0) {
                console.log(`updated slide ${JSON.stringify(req.body.sid)}`);
                res.json({ id: req.id });
            } else {
                throw "chat update error";
            }
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    /**
     * add a new chat to question
     * body:
     * sid: slide id
     * qid: question index
     * cid: chat index
     * pageNum: page number
     * author: uploader's utorid
     */
    router.post('/api/like', (req, res) => {
        if (req.body.sid.length != 24) {
            return res.status(400).send();
        }

        slides.findOne({
            _id: ObjectID.createFromHexString(req.body.sid)
        }).then(slide => {
            if (!slide) {
                throw { status: 404, error: "slide not found" };
            } else if (req.body.pageNum >= slide.pages.length ||
                req.body.qid >= slide.pages[req.body.pageNum].questions.length ||
                req.body.cid >= slide.pages[req.body.pageNum].questions[req.body.qid].chats.length) {
                throw { status: 400, error: "Bad Request" };
            }
            let insertLike = {}; // cannot use template string on the left hand side
            insertLike[`pages.${req.body.pageNum}.questions.${req.body.qid}.chats.${req.body.cid}.likes`] = req.body.author;
            return slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) }, { $push: insertLike });
        }).then(updateRes => {
            if (updateRes.modifiedCount > 0) {
                console.log(`updated slide ${JSON.stringify(req.body.sid)}`);
                res.json({ id: req.id });
            } else {
                throw "chat update error";
            }
        }).catch(err => {
            errorHandler(res, err);
        });
    });

    router.get('/', (req, res) => res.sendFile('index.html', { root: path.join(__dirname, '..', 'static') }));

    router.use('/:slideID', (req, res) => res.sendFile('index.html', { root: path.join(__dirname, '..', 'react-build') }));

    router.use(express.static('react-build'));

    router.use((req, res) => res.status(404).send());

    console.log("slidechat app started");
    return router;
}



module.exports = startApp;
