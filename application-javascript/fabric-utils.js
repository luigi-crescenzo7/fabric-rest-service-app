'use strict'


import { resolve } from 'path';
import { Wallets, Gateway, DefaultEventHandlerStrategies } from 'fabric-network';
import fs from 'fs';


export async function createGateway(ccpOrg1, wallet, org1UserId) {
    const gateway = new Gateway();

    const connectionOptions = {
        eventHandlerOptions: DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX,
        wallet, identity: org1UserId, discovery: {enabled: true, asLocalhost: true}
    }

    await gateway.connect(ccpOrg1, connectionOptions);

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
    return wallet ? wallet : null;
}
