'use strict';

var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var bodyParser = require('body-parser');

var slidechat = require('./routes/slidechat');
var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false })); 
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());

app.use('/slidechat', slidechat);

app.use((req, res) => res.status(404).send());

app.listen(10000, function () {
  console.log('App listening on port ' + 10000);
});
