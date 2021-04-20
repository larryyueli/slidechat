const { baseURL, cookieName } = require('../../config');
const { getInstructors } = require('../instructors');

const loginRedirect = (req, res) => {
	// login is already handled by Shibboleth when arrives here
	if (process.env.NODE_ENV !== 'production') {
		req.session.uid = getInstructors()[0];
		req.session.realName = 'Totooria Helmold';
	} else if (!req.headers.utorid) {
		return res.status(401).send('Unauthorized');
	} else {
		// Shibboleth put user info into req.headers, e.g. req.headers.utorid, req.headers.http_mail, req.headers.origin
		req.session.uid = req.headers.utorid;
		req.session.realName = req.headers.http_cn;
		req.session.email = req.headers.http_mail;
	}
	res.redirect(baseURL + req.path.substring(8));
};

const logout = (req, res, next) => {
	req.session.destroy((err) => {
		if (err) {
			next(err);
		} else res.clearCookie(cookieName).send();
	});
};

module.exports = {
	loginRedirect,
	logout,
};
