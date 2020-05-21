'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

const slidechat = require('./routes/slidechat');

const app = express();
app.disable("x-powered-by");  // remove the HTTP header "X-powered-by: express"
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());

app.use('/slidechat', slidechat);

app.use((req, res) => res.status(404).send());

app.listen(10000, function () {
  console.log('App listening on port ' + 10000);
});
