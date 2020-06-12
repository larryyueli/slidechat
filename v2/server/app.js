'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const config = require('./config');
const startSlidechat = require('./routes/slidechat');

let main = (async () => {
  const app = express();
  app.disable("x-powered-by");  // remove the HTTP header "X-powered-by: express"

  app.use(compression());
  app.use(cors());
  app.use(morgan('dev'));
  app.use(bodyParser.json()); // support json encoded bodies
  app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
  app.use(cookieParser());
  app.use(fileUpload());

  const slidechat = await startSlidechat();
  app.use('/slidechat', slidechat);

  app.use((req, res) => res.status(404).send());

  app.listen(config.port, function () {
    console.log('App listening on port ' + config.port);
  });
})();