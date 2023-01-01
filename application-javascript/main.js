'use strict';

const {Gateway, Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');

const {
    buildCAClient,
    buildCCPOrg1,
    buildCCPOrg2,
    buildWallet,
    registerAndEnrollUser,
    enrollAdmin
} = require('./utils.js')

const channelName = 'mychannel';
const chaincodeName = 'test-contract';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'user1org';

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {

    try {
        const ccpOrg1 = buildCCPOrg1();
        const caClient = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');

        const wallet = await buildWallet(Wallets, walletPath);

        await enrollAdmin(caClient, wallet, mspOrg1);

        await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

        const gateway = new Gateway();

        try {
            await gateway.connect(ccpOrg1, {
                wallet, identity: org1UserId, discovery: {enabled: true, asLocalhost: true}
            });

            const network = await gateway.getNetwork(channelName);
            const contract = await network.getContract(chaincodeName);


            console.log("init-ledger");
            await contract.submitTransaction('InitLedger');
            console.log("get assets");
            const results = await contract.evaluateTransaction("GetAllAssets");
            console.log(`result: ${prettyJSONString(results.toString('utf-8'))}`)

        } finally {
            gateway.disconnect();
        }
    } catch (error) {
        console.error(error);
    }
}

main().catch((error) => console.error(error));