const os = require('os');
const path = require('path');

module.exports = {
	baseURL: '/slidechat',

	socketPath: '/socket/', // in production mode, client connect to baseURL+socketPath

	cookieName: '_SlideChatSess',

	sessMaxAge: 60 * 24 * 60 * 60 * 1000, // 60 days

	fileStorage: path.join(os.homedir(), '.slidechat', 'files'),

	convertOptions: { '-adaptive-resize': '1200x', '-density': '300' },

	authenticationFailMessage:
		'To get instructor access, please send your UTORID to Larry Zhang (ylzhang AT cs.toronto.edu).',
};
