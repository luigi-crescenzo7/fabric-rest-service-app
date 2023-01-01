'use strict'


//const fs = require('fs');
import { resolve } from 'path';
import { Wallets, Gateway, DefaultEventHandlerStrategies } from 'fabric-network';
import fs from 'fs';


/*const dotenv = require('dotenv').config()
const env = require('env-var')

const org1Connection = env.get('ORG1_CONNECTION_CONFIG').required().asJsonObject()
module.exports.org1Connection = org1Connection

const org1CertFile = env.get('ORG1_CERTIFICATE_FILE').required().asString()
module.exports.org1CertFile = org1CertFile

const org1PrivateKey = env.get('ORG1_PRIVATE_KEY').required().asString()
module.exports.org1PrivateKey = org1PrivateKey
*/

export async function createGateway(ccpOrg1, wallet, org1UserId) {
    const gateway = new Gateway();

    const connectionOptions = {
        eventHandlerOptions: DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX,
        wallet, identity: org1UserId, discovery: {enabled: true, asLocalhost: true}
    }

    await gateway.connect(ccpOrg1, connectionOptions);

    /* inutile (?)
    const options = {
        wallet,
        identity,
        discovery: {enabled: true, asLocalhost: true}
    }
    await gateway.connect(connection, options);*/
    return gateway;
}



// deprecated
export async function buildWallet() {
    const walletPath = resolve(__dirname, "wallet");

    if (!walletPath) {
        throw new Error('missing required path');
    }
        
    if(fs.existsSync(walletPath)) 
        return new Error(`${walletPath} already exists.`);
    
    let wallet = await Wallets.newFileSystemWallet(walletPath);
    /* inutile (?)
    const dataKey = fs.readFileSync('/home/gigi/fabric-samples/test-network/' + 'organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com' +
    '/msp/keystore/ff0df5f89a8632a11e37cabad555903d3150d57b41048ab88cdd23878d534de4_sk')
    const dataCertFile = fs.readFileSync('/home/gigi/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/cert.pem')

    const keyTrimmed = dataKey.toString().replace('\n', '')
    const certTrimmed = dataCertFile.toString().replace('\n', '')

    const org1Identity = {
        credentials: {
            certificate: certTrimmed,
            privateKey: keyTrimmed,
        },
        mspId: mspOrg1,
        type: 'X.509',
    };

    await wallet.put(mspOrg1, org1Identity);*/
    return wallet ? wallet : null;
}
