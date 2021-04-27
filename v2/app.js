'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const MongoSessStore = require('connect-mongodb-session')(session);
const { MongoClient, ObjectID } = require('mongodb');
const http = require('http');
const io = require('socket.io')();

require('dotenv').config({ debug: process.env.DEBUG });

const config = require('./config');
const setupRoutes = require('./routes/routes');

const {
	PORT = 10000,
	NODE_ENV = 'development',
	SESS_SECRET = 'secret',
	CONNECTION_STRING = 'mongodb://localhost:27017/slidechat',
} = process.env;

const sessStore = new MongoSessStore({
	uri: config.dbURL,
	collection: 'sess',
});
sessStore.on('error', (err) => {
	console.error(err);
});

morgan.token('id', (req) => {
	return req.session?.uid;
});
morgan.token('body', (req) => {
	return JSON.stringify(req.body);
});

(async () => {
	const app = express();
	app.disable('x-powered-by'); // remove the HTTP header "X-powered-by: express"

	app.use(compression());
	if (NODE_ENV !== 'production') app.use(cors());
	app.use(morgan(':id :method :url :body :status :res[content-length] - :response-time ms'));
	app.use(express.json()); // support json encoded bodies
	app.use(express.urlencoded({ extended: true })); // support encoded bodies
	app.use(fileUpload());

	app.use(
		session({
			name: config.cookieName,
			saveUninitialized: false,
			resave: true,
			rolling: false,
			secret: SESS_SECRET,
			store: sessStore,
			cookie: {
				// path: config.baseURL, // doesn't work because of reverse proxy
				httpOnly: true,
				// secure: NODE_ENV === 'production', // doesn't work because of reverse proxy
				secure: false,
				maxAge: config.sessMaxAge,
				sameSite: NODE_ENV === 'production',
			},
		})
	);

	try {
		const dbClient = await MongoClient.connect(CONNECTION_STRING, {
			useUnifiedTopology: true,
			useNewUrlParser: true,
		});
		const slideChat = dbClient.db('slidechat');
		app.locals.slides = slideChat.collection('slides');
		app.locals.courses = slideChat.collection('courses');
		app.locals.users = slideChat.collection('users');
		console.log('connected to database');
	} catch (err) {
		console.dir(err);
		console.error('Cannot connect to the database, shutting down...');
		process.exit(1);
	}

	const server = http.createServer(app);
	io.attach(server, {
		path: config.socketPath,
		serveClient: false,
		cors: NODE_ENV !== 'production' ? { origin: '*' } : undefined,
	});
	io.on('connection', (socket) => {
		socket.on('join slide room', async (slideID) => {
			try {
				const slide = await app.locals.slides.findOne(
					{ _id: ObjectID.createFromHexString(slideID) },
					{ projection: { _id: true } }
				);
				if (slide) {
					socket.join(slideID);
				} else {
					socket.emit('error', 'Join slide room: invalid slide ID!');
				}
			} catch (err) {
				return;
			}
		});
		socket.on('leave', (roomID) => socket.leave(roomID));
	});
	app.locals.io = io;

	setupRoutes(app);

	server.listen(PORT, function () {
		console.log(`App listening on port ${PORT} in ${NODE_ENV} mode`);
	});
})();
