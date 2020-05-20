var express = require('express');
var router = express.Router();

router.get("/", function(req, res, next) {
    res.send("The API is working properly now.")
});

module.exports = router;
