const os = require('os');
const path = require('path');
const querystring = require('querystring');
const {dbUser, dbPsw, instructors} = require('./secrets');

const escapedUser = querystring.escape(dbUser);
const escapedPsw = querystring.escape(dbPsw);

module.exports = {
    port: 10001,

    instructorURL: '/prof',

    dbURL: `mongodb://${escapedUser}:${escapedPsw}@localhost:27017/slidechat`,

    fileStorage: path.join(os.homedir(), ".slidechat", "files"),

    convertOptions: { "-density": 150 },

    instructors: instructors
}