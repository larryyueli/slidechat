const path = require('path');
const express = require('express');
const { ObjectID } = require('mongodb');

const { instructors, fileStorage } = require('../config');
const { isNotValidPage, notExistInList, errorHandler } = require('./util');

function commonAPI(db) {
    let router = express.Router();

    const users = db.collection('users');
    const courses = db.collection('courses');
    const slides = db.collection('slides');


    /**
     * get the course information, the list of slides of the course
     * req query:
     *   id: courseID
     */
    router.get('/api/course', async (req, res) => {
        try {
            let course = await courses.findOne({ _id: ObjectID.createFromHexString(req.query.id) });
            if (!course) throw { status: 404, error: "not found" };

            let courseSlides = [];
            for (let slideId of course.slides) {
                let slideEntry = await slides.findOne({ _id: ObjectID.createFromHexString(slideId) },
                    { projection: { filename: 1, description: 1 } });
                if (!slideEntry) {
                    console.log(`slide ${slideId} not found`);
                    continue;
                }
                courseSlides.push({ id: slideId, filename: slideEntry.filename, description: slideEntry.description });
            }
            res.json({
                name: course.name,
                instructors: course.instructors,
                role: course.role,
                slides: courseSlides,
                cid: course.id
            });
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * get information of a slide, e.g. total number of pages, filename, title, etc.
     * req body:
     *   slideID: object ID of a slide
     */
    router.get('/api/slideInfo', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.query.slideID) },
                { projection: { pages: 0 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            res.json({
                filename: slide.filename,
                pageTotal: slide.pageTotal,
                title: slide.title,
                anonymity: slide.anonymity,
            });
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * get the unused questions of a slide
     * req query:
     *   id: slideId
     */
    router.get('/api/unusedQuestions', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.query.id) },
                { projection: { unused: 1 } });
            if (!slide) return res.sendStatus(404);
            let result = slide.unused;
            if (!result) return res.send([]);
            for (let i = 0; i < result.length; i++) {
                for (let question of result[i].questions) {
                    if (question) {
                        delete question.chats;
                    }
                }
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
            res.sendFile(path.join(fileStorage, req.query.slideID, `page-${+req.query.pageNum - 1}.png`));
        } catch (err) {
            errorHandler(res, err);
        }
    });

    /**
     * download PDF file
     * req body:
     *   slideID: object ID of the slide
     */
    router.get('/api/downloadPdf', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.query.slideID) },
                { projection: { filename: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            res.download(path.join(fileStorage, req.query.slideID, slide.filename));
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
                if (question) {
                    delete question.chats;
                }
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
                || notExistInList(req.query.qid, slide.pages[+req.query.pageNum - 1].questions)) {
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
     *   user: userID
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
                title: escape(req.body.title),
                user: req.body.user
            };
            let newChat = {
                time: time,
                body: req.body.body,    // does not escape here, md renderer(markdown-it) will escape it
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
     *   user: userID
     */
    router.post('/api/addChat', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { projection: { pageTotal: 1, pages: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            if (isNotValidPage(req.body.pageNum, slide.pageTotal)
                || notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions)
                || typeof req.body.body !== 'string'
                || typeof req.body.user !== 'string') {
                throw { status: 400, error: "bad request" };
            }

            let time = Date.now();
            let newChat = {
                time: time,
                body: req.body.body,        // does not escape here, md renderer(markdown-it) will escape it
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
     *   user: userID
     */
    router.post('/api/like', async (req, res) => {
        try {
            let slide = await slides.findOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { projection: { pageTotal: 1, pages: 1 } });
            if (!slide) throw { status: 404, error: "slide not found" };
            if (isNotValidPage(req.body.pageNum, slide.pageTotal)
                || notExistInList(req.body.qid, slide.pages[+req.body.pageNum - 1].questions)
                || notExistInList(req.body.cid, slide.pages[+req.body.pageNum - 1].questions[req.body.qid].chats)) {
                throw { status: 400, error: "bad request" };
            }

            let insertLike = {}; // cannot use template string on the left hand side
            // if instructor, add to endorsement, else add to likes
            if (instructors.indexOf(req.body.user) < 0) {
                insertLike[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}.likes`] = req.body.user;
            } else {
                insertLike[`pages.${req.body.pageNum - 1}.questions.${req.body.qid}.chats.${req.body.cid}.endorsement`] = req.body.user;
            }
            let updateRes = await slides.updateOne({ _id: ObjectID.createFromHexString(req.body.sid) },
                { $addToSet: insertLike });

            if (updateRes.modifiedCount !== 1) {
                throw "like update error";
            }

            res.send();
        } catch (err) {
            errorHandler(res, err);
        }
    });

    return router;
}

module.exports = commonAPI;