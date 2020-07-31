'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const MongoSessStore = require('connect-mongodb-session')(session);

const config = require('./config');
const secrets = require('./secrets');
const startSlideChat = require('./routes/slidechat');

const {
	PORT = 10000,
	NODE_ENV = 'development',
	SESS_MAX_AGE = 60 * 24 * 60 * 60 * 1000, // 60 days
} = process.env;

const sessStore = new MongoSessStore({
	uri: config.dbURL,
	collection: 'sess',
});
sessStore.on('error', (err) => {
	console.error(err);
});

morgan.token('id', (req) => {
	if (req.session) return req.session.uid;
});
morgan.token('body', (req) => {
	return JSON.stringify(req.body);
})

let main = (async () => {
	const app = express();
	app.disable('x-powered-by'); // remove the HTTP header "X-powered-by: express"

	app.use(compression());
	if (NODE_ENV !== 'production') app.use(cors());
	app.use(morgan(':id :method :url :body :status :res[content-length] - :response-time ms'));
	app.use(bodyParser.json()); // support json encoded bodies
	app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
	app.use(cookieParser());
	app.use(fileUpload());

	app.use(
		session({
			name: config.cookieName,
			saveUninitialized: false,
			resave: true,
			rolling: false,
			secret: secrets.sessSecret,
			store: sessStore,
			cookie: {
				// path: config.baseURL, // doesn't work because of reverse proxy
				httpOnly: true,
				// secure: NODE_ENV === 'production', // doesn't work because of reverse proxy
				secure: false,
				maxAge: SESS_MAX_AGE,
				sameSite: NODE_ENV === 'production',
			},
		})
	);

	const slidechat = await startSlideChat();
	app.use('/', slidechat);

	app.use((req, res) => res.status(404).send());

	app.listen(PORT, function () {
		console.log(`App listening on port ${PORT} in ${NODE_ENV} mode`);
	});
})();
