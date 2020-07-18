const express = require('express');
const { MongoClient } = require('mongodb');
const dbConfig = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
};

const { dbURL } = require('../config');
const instructorAPI = require('./instructorAPI');
const commonAPI = require('./commonAPI');

async function startSlidechat() {
    const router = express.Router();

    let dbClient;
    try {
        dbClient = await MongoClient.connect(dbURL, dbConfig);
    } catch {
        console.error("Cannot connect to the database, shutting down...");
        process.exit(1);
    }

    console.log('connected to database');
    const db = dbClient.db('slidechat');

    router.use(instructorAPI(db));
    router.use(commonAPI(db));

    router.get(/^\/p\/login\/[A-Fa-f0-9]+\/?/, (req, res) => { res.sendFile('login.html', { root: 'static' }); });
    
    // router.get('/', (req, res) => res.sendFile('index.html', { root: 'client-build' }));
    router.get(/^\/([A-Fa-f0-9]+\/?)?$/, (req, res) => { res.sendFile('index.html', { root: 'client-build' }); });

    router.use(express.static('client-build'));

    router.use((req, res) => res.status(404).send());

    console.log("slidechat app started");
    return router;
}

module.exports = startSlidechat;
