const os = require('os');
const path = require('path');
const querystring = require('querystring');
const { dbUser, dbPsw } = require('./secrets');

const escapedUser = querystring.escape(dbUser);
const escapedPsw = querystring.escape(dbPsw);

module.exports = {
	baseURL: '/slidechat',

	instructorURL: '/prof',

	socketPath: '/socket/', // in production mode, client connect to baseURL+socketPath

	cookieName: '_SlideChatSess',

	dbURL: `mongodb://${escapedUser}:${escapedPsw}@localhost:27017/slidechat`,

	fileStorage: path.join(os.homedir(), '.slidechat', 'files'),

	convertOptions: { '-adaptive-resize': '1200x', '-density': '300' },

	authenticationFailMessage:
		'To get instructor access, please send your UTORID to Larry Zhang (ylzhang AT cs.toronto.edu).',
};
