const express = require('express');

const { instructorAuth, getInstructors } = require('./instructors');
const api = require('./API');
const sessionAPI = require('./API/session');

/**
 * Setup routes for the app
 * @param {Express} app
 */
function setupRoutes(app) {
	if (process.env.NODE_ENV !== 'production') {
		app.use('/', (req, res, next) => {
			req.session.uid = getInstructors()[0];
			req.session.realName = 'Totooria Helmold';
			next();
		});

		app.get('/sess', (req, res) => {
			res.json(req.session);
		});
	}

	// Login redirection, "/p" path is protect by Shibboleth (aka UTORID login)
	app.get(/^\/p\/login\//, sessionAPI.loginRedirect);

	// APIs
	app.use('/api', api);

	// Static content + front-end routing
	app.use('/prof', instructorAuth, express.static('instructor-client/build'));
	app.get(/^\/prof/, instructorAuth, (req, res) => {
		res.sendFile('index.html', { root: 'instructor-client/build' });
	});

	app.use(express.static('client/build'));
	app.get(/^\/([A-Fa-f0-9\/]+)?$/, (req, res) => {
		res.sendFile('index.html', { root: 'client/build' });
	});

	app.use((req, res) => res.status(404).send());
}

module.exports = setupRoutes;
