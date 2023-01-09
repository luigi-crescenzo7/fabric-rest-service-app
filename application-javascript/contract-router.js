'use strict'

import { Router } from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import FabricCAServices from 'fabric-ca-client';
import { StatusCodes } from "http-status-codes";
import { createGateway } from './fabric-utils.js';
import { Wallets } from 'fabric-network';
import { buildCCPOrg1, enrollAdmin, buildCAClient, registerAndEnrollUser, buildWallet } from "./ca-utils.js";
import { randomInt } from 'crypto';
import ObjectID from 'bson-objectid';

const contractRouter = Router();
const _contractRouter = contractRouter;
export { _contractRouter as contractRouter };

const channelName = 'mychannel';
const chaincodeName = 'test-contract';
const mspOrg1 = 'Org1MSP';
let org1UserId = 'org1.user1';
let gateway;


function logChaincodeInvocation(methodName) {
    if (methodName) console.log(`-----------------------------Invoking ${methodName}-----------------------------`)
}

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function commit_listener(error, event) {
    if (error) throw new Error(`Commit listener error: ${error}`);

    console.log('\n############### NETWORK COMMIT EVENT LISTENER ###############\n')

    console.log(`Peer: ${event.peer.name}`)
    console.log(`Commit event: ${event.transactionId} committed: ${event.isValid}`);
    console.log('\n############### END NETWORK COMMIT EVENT LISTENER ###############\n')
};

contractRouter.get('/setup', async function (req, res) {

    if (gateway) {
        return res.status(StatusCodes.OK).json('Fabric Gateway is already up and running');
    }

    org1UserId += randomInt(1000);
    console.log('\n############### GATEWAY INITIALIZATION ###############\n')
    const ccpOrg1 = buildCCPOrg1();
    const caClient = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');
    const wallet = await buildWallet(Wallets, join(dirname(fileURLToPath(import.meta.url)), 'wallet'));

    await enrollAdmin(caClient, wallet, mspOrg1);
    await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
    console.log('\n############### END GATEWAY INITIALIZATION ###############\n')

    
    try {
        gateway = await createGateway(ccpOrg1, wallet, org1UserId);
    } catch (e) {
        gateway.disconnect();
        console.error(e);
    }

    let txid;
    const network = await gateway.getNetwork(channelName);
    const listener = async (event, error) => {
        if (error) throw new Error(`Block listener error: ${error}`);

        console.log('\n############### NETWORK BLOCK EVENT LISTENER ###############\n')
    
        console.log(`Network transaction block number: ${event.blockNumber}`);
        //console.log('previous block hash: '+event.blockData.header.previous_hash) <- stampa caratteri a caso
        txid = event.blockData.data.data[0].payload.header.channel_header.tx_id;
        
        console.log('Transaction events:')
        let txEvents = event.getTransactionEvents();
        for (let txEvent of txEvents) {
            console.log(`Transaction event ID: ${txEvent.transactionId}`);
            console.log(`Transaction event status code: ${txEvent.status}`);
            console.log(`Transaction event committed: ${txEvent.isValid}`);
            console.log('------------------------------------------------');
        }
        console.log('\n############### END NETWORK BLOCK EVENT LISTENER ###############\n')
    }

    await network.addBlockListener(listener);

    const contract = network.getContract(chaincodeName);
    // bisogna lanciare l'evento tramite setEvent nel chaincode.
    await contract.addContractListener(async (event, error) => {
        if (error) throw new Error(`Contract listener error: ${error}`);

        console.log('\n############### CONTRACT EVENT LISTENER ###############\n')
        console.log(`Contract event name: ${event.eventName}`);
        console.log(`Contract transaction event ID: ${event.getTransactionEvent().transactionId}`)
        console.log(`Contract event: payload ${event.payload.toString('utf-8')}`);
        console.log('\n############### END CONTRACT EVENT LISTENER ###############\n')
    });

    req.app.locals.testContract = contract;
    req.app.locals.chaincodeNetwork = network;

    logChaincodeInvocation('InitLedger');
    const arr = [];
    for (let i = 0; i < 5; ++i) {
        arr.push(ObjectID().toHexString());
    }
    await contract.submitTransaction('InitLedger', JSON.stringify(arr));

    // bisogna perforza creare prima la transazione (per ottenere l'id che serve al CommitListener) e poi fare submit()
    const tx = contract.createTransaction('CreateAsset');
    const tx2 = contract.createTransaction('CreateAsset');
    let txid1 = tx.getTransactionId();
    let txid2 = tx2.getTransactionId();


    logChaincodeInvocation('CreateAsset');
    await tx.submit(ObjectID().toHexString(), 'name', 'surname', 'CARD1', 'F', '2022-01-01', 'Tokyo', 'Italiana', '2022-01-01', 'FISC0192', 'ownerId1');

    logChaincodeInvocation('CreateAsset');
    await tx2.submit(ObjectID().toHexString(), 'nomone', 'cognomone', 'CARD2', 'F', '2022-01-01', 'New York', 'Italiana', '2022-01-01', 'FISC0193', 'ownerId1');

    const endorsers = network.getChannel().getEndorsers();

    try {
        await network.addCommitListener(commit_listener, endorsers, txid1);
        await network.addCommitListener(commit_listener, endorsers, txid2);
    } catch (e) {
        console.error(e);
        res.sendStatus(StatusCodes.BAD_REQUEST).json(e);
    }

    res.header('Content-Type', 'application/json');
    res.status(StatusCodes.OK).json('Connection with the gateway established');
});

contractRouter.post('/save', async function (req, res) {

    const contract = req.app.locals.testContract;
    const network = req.app.locals.chaincodeNetwork;

    const asset = req.body.asset;
    if (!asset) res.status(StatusCodes.BAD_REQUEST).json("expecting parameter 'asset' in request body");

    console.log(`Asset recevied from request: ${JSON.stringify(asset)}`);

    const tx = await contract.createTransaction('CreateAsset');
    const txId = tx.getTransactionId();

    const {name, surname, cardNumber, sex, dateOfBirth, placeOfBirth, nationality, expiryDate, fiscalCode, ownerId } = asset;

    logChaincodeInvocation('CreateAsset');
    const result = await tx.submit(ObjectID().toHexString(), name, surname,
                                     cardNumber, sex, dateOfBirth, placeOfBirth, 
                                     nationality, expiryDate, fiscalCode, ownerId);

    try {
        await network.addCommitListener(commit_listener, network.getChannel().getEndorsers(), txId);
    } catch (e) {
        console.error(e);
        res.status(StatusCodes.BAD_REQUEST).json(`Error: ${e}`);
    }

    res.header('Content-Type', 'application/json');
    res.status(StatusCodes.OK).json(JSON.parse(result.toString()));
});

contractRouter.post('/asset', async function (req, res) {
    console.log(`POST request body: ${JSON.stringify(req.body)}`);
    const contract = req.app.locals.testContract;
    const assetId = req.body.assetId;

    logChaincodeInvocation('GetAsset');
    const result = await contract.evaluateTransaction('GetAsset', assetId);
    console.log("result: " + result);
    console.log(typeof result);

    res.header('Content-Type', 'application/json');
    res.status(StatusCodes.OK).json(JSON.parse(result.toString()));
});

contractRouter.post('/ownerId', async function (req, res) {
    const contract = req.app.locals.testContract;
    if (!req.body) res.status(StatusCodes.BAD_REQUEST).json("body error");

    const ownerId = req.body.ownerId;
    if (!ownerId) res.status(StatusCodes.BAD_REQUEST).json("ownerId param does not exist in request body");

    const result = await contract.evaluateTransaction('GetAssetsByOwner', ownerId.toString());
    console.log(`result: ${result}`);

    res.header('Content-Type', 'application/json');
    res.status(StatusCodes.OK).json(JSON.parse(result.toString()));
});


contractRouter.post('/remove', async function (req, res) {
    if (!req.app.locals.testContract) return;

    const contract = req.app.locals.testContract;

    if (!contract) return res.status(StatusCodes.BAD_REQUEST).json('no contract found');

    const assetId = req.body.assetId;

    if (!assetId) return res.status(StatusCodes.BAD_REQUEST).json('no body present');

    logChaincodeInvocation('DeleteAsset');
    const result = await contract.submitTransaction('DeleteAsset', assetId.toString())

    res.header('Content-Type', 'application/json');
    res.status(StatusCodes.OK).json(JSON.parse(result.toString()));
});

contractRouter.get('/all', async function (req, res) {

    const contract = req.app.locals.testContract;

    if (!contract) return res.status(StatusCodes.BAD_REQUEST).json('no contract found');

    logChaincodeInvocation('GetAllAssets');

    const results = await contract.evaluateTransaction('GetAllAssets');

    if (!results) res.status(StatusCodes.OK).json('no assets found in current world state');

    const json_data = JSON.parse(results.toString());
    
    res.header('Content-Type', 'application/json');
    res.status(StatusCodes.OK).json(json_data);
});
