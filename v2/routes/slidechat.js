const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const dbConfig = {
	useUnifiedTopology: true,
	useNewUrlParser: true,
};

const { baseURL, dbURL, cookieName } = require('../config');
const instructorAPI = require('./instructorAPI');
const commonAPI = require('./commonAPI');

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

const instructorURL = '/prof';

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
		res.status(401).send(`User ${req.session.uid} is not an instructor. This incident will be reported.`);
		console.error(`Instructor auth failed: ${req.session.uid}`);
	} else {
		next();
	}
}

/**
 * Check if an uid is in instructor list. If it is not found in the current list,
 * reload instructorList.json and re-check.
 * @param {String} uid
 */
function isInstructor(uid) {
	if (instructors.indexOf(uid) >= 0) {
		return true;
	} else {
		instructors = readInstructors();
		return instructors.indexOf(uid) >= 0;
	}
}

async function startSlideChat() {
	const router = express.Router();

	let dbClient;
	try {
		dbClient = await MongoClient.connect(dbURL, dbConfig);
	} catch {
		console.error('Cannot connect to the database, shutting down...');
		process.exit(1);
	}

	console.log('connected to database');
	const db = dbClient.db('slidechat');

	if (process.env.NODE_ENV !== 'production') {
		router.use('/', (req, res, next) => {
			req.session.uid = instructors[0];
			req.session.realName = 'Totooria Helmold';
			next();
		});

		router.get('/sess', (req, res) => {
			console.log(req.session);
			console.log(req.sessionID);
			req.session.test = 'asdf';
			res.json(req.session);
		});
	}

	router.get(/^\/p\/login\//, (req, res) => {
		// login is already handled by Shibboleth when arrives here
		if (process.env.NODE_ENV !== 'production') {
			req.session.uid = instructors[0];
			req.session.realName = 'Totooria Helmold';
		} else if (!req.headers.utorid) {
			return res.status(401).send('Unauthorized');
		} else {
			// Shibboleth put user info into req.headers, e.g. req.headers.utorid, req.headers.http_mail, req.headers.origin
			req.session.uid = req.headers.utorid;
			req.session.realName = req.headers.http_cn;
			req.session.email = req.headers.http_mail;
		}
		let path = req.path.split('/');
		if (path[3] === 'prof') {
			res.redirect(`${baseURL}/prof`);
		} else {
			res.redirect(`${baseURL}/${path[3]}#${path[4]}`);
		}
	});

	router.get('/api/logout', (req, res) => {
		req.session.destroy((err) => {
			if (err) {
				console.error(err);
				res.status(500).send();
			} else res.clearCookie(cookieName).send();
		});
	});

	// APIs
	router.use(instructorAPI(db, instructorAuth, isInstructor));
	router.use(commonAPI(db));

	// Routes
	router.get(instructorURL, instructorAuth, (req, res) => {
		res.sendFile('index.html', { root: 'instructor-client/build' });
	});
	// front-end route
	router.get(`${instructorURL}/reorderQuestions/:slideID([A-Fa-f0-9]+)`, instructorAuth, (req, res) => {
		res.sendFile('index.html', { root: 'instructor-client/build' });
	});
	router.use(instructorURL, instructorAuth, express.static('instructor-client/build'));

	router.get(/^\/([A-Fa-f0-9]+\/?)?$/, (req, res) => {
		res.sendFile('index.html', { root: 'client/build' });
	});
	router.use(express.static('client/build'));

	router.use((req, res) => res.status(404).send());

	console.log('SlideChat started');
	return router;
}

module.exports = startSlideChat;
