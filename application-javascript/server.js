'use strict'


import express from 'express';
import https from 'https';
import fs from 'fs'
import cors from 'cors';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, NOT_FOUND } = StatusCodes;
import bodyParser from 'body-parser';
import { privateRouter } from './private-router.js';


let gateway;
const port = 8447;

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}


async function createServer(corsOptions) {
    const app = express();

    app.use(cors(corsOptions));
    app.use((req, res, next) => {
        console.log('\n[############### EXPRESS MIDDLEWARE ###############]\n');
        console.log(`User-Agent: ${req.get('User-Agent')}`);
        console.log(`Requested route: ${req.url}`);
        console.log(`Request method: ${req.method}`);
        console.log(`Timestamp: ${new Date().toLocaleTimeString()}`);
        console.log('\n[############### EXPRESS MIDDLEWARE ###############]\n');
        next();
    });

    app.use(bodyParser.json());
    app.use('/api/private', privateRouter);

    app.use((req, res) => {
        res.status(NOT_FOUND).json({
            status: getReasonPhrase(NOT_FOUND),
            timestamp: new Date().toISOString()
        });
    });

    app.use((req, res, err) => {
        res.status(INTERNAL_SERVER_ERROR).json({
            status: getReasonPhrase(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString()
        });
    });

    return app;
}

async function init_server() {
    let corsOptions = {
        origins: '*'
    };

    const app = await createServer(corsOptions).catch((err) => {
        console.error(err);
    })

    const serverKey = fs.readFileSync('./node_ssl/server-key.pem');
    const serverCert = fs.readFileSync('./node_ssl/server-cert.pem');

    const options = {
        origins: '*',
        key: serverKey,
        cert: serverCert
    }


    https.createServer(options, app).listen(port, () => console.log(`HTTPS server listening on port ${port}`));
}

init_server().catch((err) => {
    console.error(err);
});
