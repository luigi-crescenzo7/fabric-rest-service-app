'use strict'


/*
import { createGateway } from './fabric-utils.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import { buildCCPOrg1, enrollAdmin, buildCAClient, registerAndEnrollUser, buildWallet } from "./utils.js";
import FabricCAServices from 'fabric-ca-client';
import { Wallets } from "fabric-network";
import { authApiKey, FabricAPIKeyStrategy } from "./auth";*/


import express from 'express';
import https from 'https';
import fs from 'fs'
import cors from 'cors';
import { contractRouter } from './contract-router.js';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const { INTERNAL_SERVER_ERROR, NOT_FOUND } = StatusCodes;
import bodyParser from 'body-parser';


// -------------------------------------------

/*const channelName = 'mychannel';
const chaincodeName = 'test-contract';
const mspOrg1 = 'Org1MSP';
const org1UserId = 'kkkk';*/
let gateway;
const port = 8447;

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}


async function createServer(corsOptions) {
    const app = express();


    /* Passport Authentication
    app.use(express.json());
    passport.use('headerapikey', FabricAPIKeyStrategy);
    app.use(passport.initialize({}));*/

    app.use(cors(corsOptions));
    app.use((req, res, next) => {
        console.log('\n############### EXPRESS MIDDLEWARE ###############\n');
        console.log(`User-Agent: ${req.get('User-Agent')}`);
        console.log(`Requested route: ${req.url}`);
        console.log(`Request method: ${req.method}`)
        console.log('\n############### EXPRESS MIDDLEWARE ###############\n');
        next();
    });

    app.use(bodyParser.json());
    app.use('/api/contract', contractRouter);

    app.use((req, res) => {
        res.status(NOT_FOUND).json({
            status: getReasonPhrase(NOT_FOUND),
            timestamp: new Date().toISOString()
        });
    });

    app.use((req, res, err) => {
        res.status(INTERNAL_SERVER_ERROR).json({
            status: err.toString(),
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

    // app.listen(port, () => console.log(`listening on ${port}`))

    https.createServer(options, app).listen(port, () => console.log(`HTTPS server listening on port ${port}`));
}

init_server().catch((err) => {
    console.error(err);
});


/*async function init() {
    const ccpOrg1 = buildCCPOrg1();
    const caClient = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');

    const wallet = await buildWallet(Wallets, join(dirname(fileURLToPath(import.meta.url)), 'wallet'));

    await enrollAdmin(caClient, wallet, mspOrg1);
    await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1')

    const app = await createServer();
    gateway = await createGateway(ccpOrg1, wallet, org1UserId);


    const network = await gateway.getNetwork(channelName);
    network.addBlockListener(async (block, error) => {
        console.log("Block event:");
        if (!error) {
            console.log(block);
        } else {
            console.error(error);
        }
    });

    const contract = network.getContract(chaincodeName);
    app.locals.testContract = contract;
    // intercetta gli eventi generati dallo smart contract, dunque bisogna lanciare l'evento tramite setEvent nel chaincode.
    contract.addContractListener(async (event, error) => {
        if (error) return;
        console.log(event)
        console.log(`Event: payload ${event.payload.toString('utf-8')}`);
    });



    console.log('-----------------------------Invoking InitLedger-----------------------------');
    await contract.submitTransaction('InitLedger');
    app.listen(port, () => console.log(`Listening on localhost:${port}`));
    await contract.submitTransaction('CreateAsset', 'aaa', 'bb', 'cc', '11')
}

init().catch((error) => {
    if (gateway)
        gateway.disconnect();
    console.error(error);
})*/