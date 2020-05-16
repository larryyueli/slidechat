const express = require('express');
const path = require('path');

const router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const url = "mongodb://slidechat:V2Good!%40%23@localhost:27017/slidechat";
const dbconfig = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
};

const fs = require('fs');

let rawdata = fs.readFileSync('config/instructors.json');
let instructors = JSON.parse(rawdata);

router.get('/:slideID/:pageNumber', function (req, res) {
    MongoClient.connect(url, dbconfig).then(client => {
        const db = client.db("slidechat");
        var slides = db.collection('slides');
        return slides.findOne({ _id: ObjectID.createFromHexString(req.params.slideID) });
    }).then(slide=>{
        if (!slide){
            throw { status: 404, error: "slide not found" };
        }
        var result = {};
        result["img"] = slide.pages[req.params.pageNumber].location;
        result["questions"] = slide.pages[req.params.pageNumber].questions;
        for (let question of result.questions){
            delete question.chats;
        }
        res.json(result);
    }).catch(err => {
        if (err && err.status) {
            return res.status(err.status).send({ error: err.error });
        } else {
            console.error(err);
            return res.status(500).send();
        }
    });
});

router.get('/:slideID/:pageNumber/:questionID', function (req, res) {
    MongoClient.connect(url, dbconfig).then(client => {
        const db = client.db("slidechat");
        var slides = db.collection('slides');
        return slides.findOne({ _id: ObjectID.createFromHexString(req.params.slideID) });
    }).then(slide => {
        if (!slide) {
            throw { status: 404, error: "slide not found" };
        }
        var result = {};
        result["questions"] = slide.pages[req.params.pageNumber].questions[req.params.questionID].body;
        result["comments"] = slide.pages[req.params.pageNumber].questions[req.params.questionID].chats;
        res.json(result);
    }).catch(err => {
        if (err && err.status) {
            return res.status(err.status).send({ error: err.error });
        } else {
            console.error(err);
            return res.status(500).send();
        }
    });
});

/**
 * add a new instructor to users
 * body:
 * userName: admin's user name
 * password: admin's password
 * utorID: utorID
 */
// router.post('/api/addInstructor', function (req, res) {
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
router.post('/api/createCourse', function (req, res) {
    MongoClient.connect(url, dbconfig).then(client => {
        req.slidechat = client.db('slidechat')
        let users = req.slidechat.collection('users');
        return users.findOne({ _id: req.body.author });
    }).then(user => {
        if (!user || instructors.indexOf(user._id) < 0) {
            throw { status: 401, error: "Unauthorized" };
        }
        req.user = user;
        let courses = req.slidechat.collection('courses');
        let newCourse = { name: req.body.name, instructors: [req.body.author], slides: [] };
        return courses.insertOne(newCourse);
    }).then(course => {
        console.log(`Inserted course ${JSON.stringify(course.ops[0]._id)}`);
        req.id = course.ops[0]._id.toHexString();
        req.user.courses.push({ role: "instructor", id: req.id });
        let users = req.slidechat.collection('users');
        return users.updateOne({ _id: req.body.author }, { $push: { courses: { role: "instructor", id: req.id } } });
    }).then(updateRes => {
        if (updateRes.modifiedCount > 0) {
            console.log(`updated user ${JSON.stringify(req.body.author)}`);
            res.json({ id: req.id });
        } else {
            throw "createCourse update error";
        }
    }).catch(err => {
        if (err && err.status) {
            return res.status(err.status).send({ error: err.error });
        } else {
            console.error(err);
            return res.status(500).send();
        }
    });
});

/**
 * join a course
 * body:
 * cid: course id
 * author: uploader's utorid
 */
// router.post('/api/joinCourse', function (req, res) {
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

/**
 * add a new slide to course
 * body:
 * cid: course id
 * anoymity: anoymity level of the slide
 * author: uploader's utorid
 */
router.post('/api/slide', function (req, res) {
    if (req.body.cid.length != 24 || (req.body.anoymity != "anyone" && req.body.anoymity != "UofT student" && req.body.anoymity != "nonymous")) {
        return res.status(400).send();
    }
    MongoClient.connect(url, dbconfig).then(client => {
        req.db = client.db("slidechat");
        const courses = req.db.collection('courses');
        return courses.findOne({ _id: ObjectID.createFromHexString(req.body.cid) });
    }).then(course => {
        if (!course) {
            throw { status: 404, error: "course not exist" };
        } else if (course.instructors.indexOf(req.body.author)) {
            throw { status: 403, error: "Unauthorized" };
        } else {
            req.course = course;
            let newSlide = { anoymity: req.body.anoymity };
            // save pdf TODO
            newSlide.pdfLocation = "location";
            // pdf to img TODO
            newSlide.pages = [{ location: "location", questions: [] }];
            // insert into database
            let slides = req.db.collection('slides');
            return slides.insertOne(newSlide);
        }
    }).then(slide => {
        console.log(`Inserted slide ${JSON.stringify(slide.ops[0]._id)}`);
        req.id = slide.ops[0]._id.toHexString();
        req.course.slides.push(req.id);
        const courses = req.db.collection('courses');
        return courses.updateOne({ _id: ObjectID.createFromHexString(req.body.cid) }, { $set: { slides: req.course.slides } });
    }).then(updateRes => {
        if (updateRes.modifiedCount > 0) {
            console.log(`updated course ${JSON.stringify(req.body.cid)}`);
            res.json({ id: req.id });
        } else {
            throw "slide update error";
        }
    }).catch(err => {
        if (err && err.status) {
            return res.status(err.status).send({ error: err.error });
        } else {
            console.error(err);
            return res.status(500).send();
        }
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
router.post('/api/question', function (req, res) {
    if (req.body.sid.length != 24) {
        return res.status(400).send();
    }
    MongoClient.connect(url, dbconfig).then(client => {
        req.db = client.db("slidechat");
        const slides = req.db.collection('slides');
        return slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) });
    }).then(slide => {
        if (!slide) {
            throw { status: 404, error: "slide not found" };
        } else if (req.body.pageNum >= slide.pages.length) {
            throw { status: 400, error: "Bad Request" };
        }
        let newQuestion = { status: "unsolved", time: Date(), chats: [], title: req.body.title, author: req.body.author };
        slide.pages[req.body.pageNum].questions.push(newQuestion);
        var newChat = { time: Date(), body: req.body.body, author: req.body.author, likes: [], endorsement: null };
        slide.pages[req.body.pageNum].questions[slide.pages[req.body.pageNum].questions.length - 1].chats.push(newChat);
        const slides = req.db.collection('slides');
        return slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) }, { $set: { pages: slide.pages } });
    }).then(updateRes => {
        if (updateRes.modifiedCount > 0) {
            console.log(`updated slide ${JSON.stringify(req.body.sid)}`);
            res.json({ id: req.id });
        } else {
            throw "question update error";
        }
    }).catch(err => {
        if (err && err.status) {
            return res.status(err.status).send({ error: err.error });
        } else {
            console.error(err);
            return res.status(500).send();
        }
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
router.post('/api/chat', function (req, res) {
    if (req.body.sid.length != 24) {
        return res.status(400).send();
    }
    MongoClient.connect(url, dbconfig).then(client => {
        req.db = client.db("slidechat");
        const slides = req.db.collection('slides');
        return slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) });
    }).then(slide => {
        if (!slide) {
            throw { status: 404, error: "slide not found" };
        } else if (req.body.pageNum >= slide.pages.length || req.body.qid >= slide.pages[req.body.pageNum].questions.length) {
            throw { status: 400, error: "Bad Request" };
        }
        var newChat = { time: Date(), body: req.body.body, author: req.body.author, likes: [], endorsement: null };
        slide.pages[req.body.pageNum].questions[req.body.qid].chats.push(newChat);
        const slides = req.db.collection('slides');
        return slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) }, { $set: { pages: slide.pages } });
    }).then(updateRes => {
        if (updateRes.modifiedCount > 0) {
            console.log(`updated slide ${JSON.stringify(req.body.sid)}`);
            res.json({ id: req.id });
        } else {
            throw "chat update error";
        }
    }).catch(err => {
        if (err && err.status) {
            return res.status(err.status).send({ error: err.error });
        } else {
            console.error(err);
            return res.status(500).send();
        }
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
router.post('/api/like', function (req, res) {
    if (req.body.sid.length != 24) {
        return res.status(400).send();
    }
    MongoClient.connect(url, dbconfig).then(client => {
        req.db = client.db("slidechat");
        const slides = req.db.collection('slides');
        return slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) });
    }).then(slide => {
        if (!slide) {
            throw { status: 404, error: "slide not found" };
        } else if (req.body.pageNum >= slide.pages.length ||
            req.body.qid >= slide.pages[req.body.pageNum].questions.length ||
            req.body.cid >= slide.pages[req.body.pageNum].questions[req.body.qid].chats.length) {
            throw { status: 400, error: "Bad Request" };
        }
        slide.pages[req.body.pageNum].questions[req.body.qid].chats[req.body.cid].likes.push(req.body.author);
        const slides = req.db.collection('slides');
        return slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) }, { $set: { pages: slide.pages } });
    }).then(updateRes => {
        if (updateRes.modifiedCount > 0) {
            console.log(`updated slide ${JSON.stringify(req.body.sid)}`);
            res.json({ id: req.id });
        } else {
            throw "chat update error";
        }
    }).catch(err => {
        if (err && err.status) {
            return res.status(err.status).send({ error: err.error });
        } else {
            console.error(err);
            return res.status(500).send();
        }
    });
});

router.use(express.static(path.join(__dirname, '..', 'static')));

router.use((req, res) => res.status(404).send());

module.exports = router;
