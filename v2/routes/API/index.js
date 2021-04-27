const express = require('express');
const courses = require('./courses');
const slides = require('./slides');
const questions = require('./questions');
const replies = require('./replies');
const likes = require('./likes');
const analytics = require('./analytics');
const audios = require('./audios');
const images = require('./images');
const pdf = require('./pdf');
const { instructorAuth } = require('../instructors');
const { logout } = require('./session');

const api = express.Router();

/**
 * get the courses the instructor joined
 */
api.get('/myCourses', courses.myCourses);

/**
 * store the status of minimization of courses on an instructor's page
 * req body:
 * 	 cid: course id
 *   status: minimize status of the course
 */
api.post('/minimizeCourse', instructorAuth, courses.minimizeCourse);

/**
 * get the unused questions of a slide
 * req query:
 *   id: slideId
 */
api.get('/unusedQuestions', instructorAuth, questions.unusedQuestions);

/**
 * create a new course
 * req body:
 *   course: course name
 *   anonymity: anonymity level of the slide
 *     A: anonymous
 *     B: login required, anonymous to everyone
 *     C: non-anonymous
 *     D: anonymous to classmates but not instructors
 *   drawable: allow drawing
 * 	 downloadable: allow downloading
 */
api.post('/createCourse', instructorAuth, courses.createCourse);

/**
 * modify default settings of a course
 * req body:
 *   cid: object ID of the course
 *   name: course name
 * 	 anonymity: anonymity level of the slide
 *     A: anonymous
 *     B: login required, anonymous to everyone
 *     C: non-anonymous
 *     D: anonymous to classmates but not instructors
 *   drawable: allow drawing
 */
api.post('/modifyCourseDefault', instructorAuth, courses.modifyCourseDefault);

/**
 * delete a course
 * req query:
 * 	 cid: object ID of a course
 */
api.delete('/course', instructorAuth, courses.deleteCourse);

/**
 * add a new instructor to a course
 * body:
 *   newUser: userID
 *   course: object ID of a course
 */
api.post('/addInstructor', instructorAuth, courses.addInstructor);

/**
 * get the course information, the list of slides of the course
 * req query:
 *   id: courseID
 */
api.get('/course', courses.getCourse);

/**
 * get information of a slide, e.g. total number of pages, filename, title, etc.
 * req query:
 *   slideID: object ID of a slide
 */
api.get('/slideInfo', slides.slideInfo);

/**
 * get slide image
 * req query:
 *   slideID: object ID of the slide
 *   pageNum: integer range from from 1 to pageTotal (inclusive)
 */
api.get('/slideImg', images.slideImg);

/**
 * get slide thumbnail
 * req query:
 *   slideID: object ID of the slide
 *   pageNum: integer range from from 1 to pageTotal (inclusive)
 */
api.get('/slideThumbnail', images.slideThumbnail);

/**
 * download PDF file
 * req query:
 *   slideID: object ID of the slide
 */
api.get('/downloadPdf', pdf.downloadPdf);

/**
 * get question list of a page
 * req query:
 *   slideID: object ID of a slide
 *   pageNum: integer range from from 1 to pageTotal (inclusive)
 */
api.get('/questions', questions.getQuestions);

/**
 * get all questions of a file
 * req query:
 *   slideID: object ID of a slide
 */
api.get('/questionsAll', questions.getAllQuestions);

/**
 * get chats under a question
 * req query:
 *   slideID: object ID of a slide
 *   pageNum: integer range from from 1 to pageTotal (inclusive)
 *   qid: question index, integer range from from 0 to questions.length (exclusive)
 */
api.get('/chats', replies.getChats);

/**
 * add a new question to page
 * req body:
 *   sid: slide id
 *   pageNum: page number
 *   title: question title
 *   body(optional): question body
 *   user: userID
 *   drawing(optional): the drawing for the question
 */
api.post('/addQuestion', questions.addQuestion);

/**
 * add a new chat to question
 * body:
 *   sid: slide id
 *   qid: question index, integer range from from 0 to questions.length (exclusive)
 *   pageNum: page number
 *   body: message body
 *   user: userID
 */
api.post('/addChat', replies.addChat);

/**
 * like a chat
 * req body:
 *   sid: slide id
 *   qid: question index
 *   cid: chat index
 *   pageNum: page number
 *   user: userID
 */
api.post('/like', likes.like);

/**
 * Modify the content of a chat message
 * Only the owner of the message is allowed. Anonymous chat does not allow anyone
 * to modify.
 * req body:
 *   sid: slide id
 *   qid: question index, integer range from from 0 to questions.length (exclusive)
 *   pageNum: page number
 *   cid: chat index
 *   body: message body
 */
api.post('/modifyChat', replies.modifyChat);

/**
 * Delete one's own chat message
 * Anonymous chat does not allow anyone to delete except instructors.
 * Index 0 (question body) is not allowed to delete because it contains question
 * owner information
 * req body:
 *   sid: slide id
 *   qid: question index
 *   pageNum: page number
 *   cid: chat index
 */
api.post('/deleteOwnChat', replies.deleteOwnChat);

/**
 * Set the view count and time viewed for multiple pages
 *
 * req body (JSON string, because of limitation of navigator.sendBeacon):
 *   [pageNum]: { viewCount: int, timeViewed: int (milliseconds) }
 * example:
 * {
 *   1: { viewCount: 4, timeViewed: 60000 },
 *   4: { viewCount: 1, timeViewed: 45000 }
 * }
 */
api.post('/slideStats', express.text(), analytics.incrementSlideStats);

/**
 * add a new slide to course
 * req body:
 *   cid: course id
 * req.files:
 *   file: *.pdf
 */
api.post('/addSlide', instructorAuth, pdf.uploadSlide);

/**
 * upload a new version of slide
 * req body:
 *   sid: the old slide id
 * req.files:
 *   file: *.pdf
 */
api.post('/uploadNewSlide', instructorAuth, pdf.replaceSlide);

/**
 * import a slide from another course
 * req body:
 *   cid: course id of the dst course
 *   sid: slide id of the src slide
 */
api.post('/importSlide', instructorAuth, pdf.importSlide);

/**
 * reorder the questions of a slide
 * req body:
 *   questionOrder: the order of questions
 *   sid: the slide id
 */
api.post('/reorderQuestions', instructorAuth, questions.reorderQuestions);

/**
 * set title of a slide
 * req body:
 *   title: new title of the slide
 *   sid: the slide id
 */
api.post('/setTitle', instructorAuth, slides.setTitle);

/**
 * set anonymity level of a slide
 * req body:
 *   anonymity: new anonymity level of the slide
 *   sid: the slide id
 */
api.post('/setAnonymity', instructorAuth, slides.setAnonymity);

/**
 * set drawable of a slide
 * req body:
 *   drawable: the slide is drawable or not
 *   sid: the slide id
 */
api.post('/setDrawable', instructorAuth, slides.setDrawable);

/**
 * set downloadable of a slide
 * req body:
 *   downloadable: the slide is downloadable or not
 *   sid: the slide id
 */
api.post('/setDownloadable', instructorAuth, slides.setDownloadable);

/**
 * Delete a slide
 * req query:
 *   sid: slide object ID
 */
api.delete('/slide', instructorAuth, slides.deleteSlide);

/**
 * Delete a question
 * req query:
 *   sid: slide object ID
 *   pageNum: page number, integer range from from 1 to pageTotal (inclusive)
 *   qid: question index, integer range from from 0 to questions.length (exclusive)
 */
api.delete('/question', instructorAuth, questions.deleteQuestion);

/**
 * Delete a chat
 * Deleting 0-th chat (question body) of a question is not allowed due to it contains
 * the time the question is created
 * req query:
 *   sid: slide object ID
 *   pageNum: page number, integer range from from 1 to pageTotal (inclusive)
 *   qid: question index, integer range from from 0 to questions.length (exclusive)
 *   cid: chat index
 */
api.delete('/chat', instructorAuth, replies.deleteChat);

/**
 * endorse a chat (if already endorsed by the user, then revoke endorsement)
 * req body:
 *   sid: slide id
 *   qid: question index
 *   cid: chat index
 *   pageNum: page number
 */
api.post('/endorse', instructorAuth, likes.endorse);

/**
 * get the stats for a slide (view count and time viewed for every page)
 * req query:
 *   slideID: object ID of a slide
 */
api.get('/slideStats', instructorAuth, analytics.getSlideStatsJSON);
api.get('/slideStatsCSV', instructorAuth, analytics.getSlideStatsCSV);

/**
 * send { [page]: filename } for each page has an audio for all pages
 * req query:
 *   slideID: object ID of the slide
 */
api.get('/hasAudio', audios.hasAudio);

/**
 * get slide audio of a page
 * req query:
 *   slideID: object ID of the slide
 *   pageNum: integer range from from 1 to pageTotal (inclusive)
 */
api.get('/slideAudio', audios.getAudio);

/**
 * post audio to page
 * req body:
 *   sid: object ID of the slide
 *   pageNum: integer range from from 1 to pageTotal (inclusive)
 * req.files:
 *   file: *.mp3
 */
api.post('/audio', instructorAuth, audios.postAudio);

/**
 * delete audio to page
 * req query:
 *   sid: object ID of the slide
 *   pageNum: integer range from from 1 to pageTotal (inclusive)
 */
api.delete('/audio', instructorAuth, audios.deleteAudio);

/**
 * Logout the current user
 */
api.get('/logout', logout);

module.exports = api;
