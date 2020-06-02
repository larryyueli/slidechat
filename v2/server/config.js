const os = require('os');
const path = require('path');

module.exports = {
    port: 10000,

    dbURL: "mongodb://slidechat:V2Good!%40%23@localhost:27017/slidechat",

    fileStorage: path.join(os.homedir(), ".slidechat", "files"),

    instructors: [
        "lulingxi",
        "yaochen8",
        "huakevi6"
    ]
}