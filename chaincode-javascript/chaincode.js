'use strict';

const { Contract } = require('fabric-contract-api');
const IdCard = require('./idcard.js');
const jsonData = require('./tmp.json')

//const stringify = require('json-stringify-deterministic');
//const sorter = require('sort-keys-recursive');
const Person = require('./person.js');

//const json_data = require('./data.json');


class IdCardContract extends Contract {

    async InitLedger(ctx, jsonArray) {
        const stub = ctx.stub;
        console.log(jsonArray);

        
        const array = JSON.parse(jsonArray);

        let i = 0;
        for(let jsonElement of jsonData) {
            jsonElement.docType = 'asset';
            jsonElement.key = array[i++];
            await stub.putState(jsonElement.key, Buffer.from(JSON.stringify(jsonElement)));
        }
        /*let compositeKey;
        let element;
        
                for (let i = 0; i < 5; ++i) {
                    compositeKey = `Person`;
                    element = new Person(stub.createCompositeKey(
                        compositeKey,
                        [`id${i}`, `ownerId${i}`]).replace(/\0/g, ''),
                        `we${i}`, `we${i}`, 11, `ownerId${i}`);
        
                    element.docType = 'asset';
                    await stub.putState(element.id, Buffer.from(JSON.stringify(element)));
                    console.info(`asset with id ${element.id}`);
                }

        const objects = [
            new Person(array[0], 'we1', 'we1', 11, 'ownerId1'),
            new Person(array[1], 'we2', 'we2', 22, 'ownerId2'),
            new Person(array[2], 'we3', 'we3', 33, 'ownerId3'),
            new Person(array[3], 'we4', 'we4', 44, 'ownerId4'),
            new Person(array[4], 'we5', 'we5', 55, 'ownerId5')
        ];

        for (let element of objects) {
            element.docType = 'asset';
            await stub.putState(element.id, Buffer.from(JSON.stringify(element)));
        }*/
    }


    async CreateAsset(ctx, key, name, surname, cardNumber, sex, dateOfBirth, placeOfBirth, nationality, expiryDate, fiscalCode, ownerId) {
        const flag = await this.assetExist(ctx, key);
        //const compositeKey = ctx.stub.createCompositeKey('Person', [key, ownerId]).replace(/\0/g, '');
        if (flag) throw new Error(`asset with key ${key} already exists`);

        const cardAsset = new IdCard(key, name, surname, cardNumber,
                                     sex, dateOfBirth, placeOfBirth, 
                                     nationality, expiryDate, fiscalCode, ownerId);
        //const asset = new Person(key, name, surname, age, ownerId);

        cardAsset.docType = 'asset';
        const assetJson = JSON.stringify(cardAsset);
        const assetBytes = Buffer.from(assetJson);
        await ctx.stub.putState(key, assetBytes);
        ctx.stub.setEvent('create-asset', assetBytes);

        return assetJson;
    }

    async DeleteAsset(ctx, key) {
        const flag = await this.assetExist(ctx, key);

        if (!flag) {
            throw new Error(`Asset with id: ${key} does not exist`);
        }

        const asset = await ctx.stub.getState(key);

        try {
            await ctx.stub.deleteState(key);
        } catch (error) {
            console.log(error);
            return false;
        } finally {
            await ctx.stub.setEvent('asset-deleted', asset.id);
            return true;
        }
    }

    async UpdateAsset(ctx, key, name, surname, age) {
        const flag = await this.assetExist(ctx, key);

        if (!flag) {
            throw new Error(`Asset with id: ${key} does not exist`);
        }

        const updatedAsset = new Person(key, name, surname, age);
        const assetJson = JSON.stringify(updatedAsset);
        await ctx.stub.putState(key, Buffer.from(assetJson));
        await ctx.stub.setEvent('updated-asset', JSON.stringify(updatedAsset));
        return assetJson;
    }

    async assetExist(ctx, key) {
        const asset = await ctx.stub.getState(key);
        const flag = asset && asset.length > 0;
        if (flag) {
            await ctx.stub.setEvent('asset-extst', asset.id);
            return true;
        } else {
            await ctx.stub.setEvent('asset-not-exist', 0);
            return false;
        }
    }

    async GetAllAssets(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            //allResults.push({ Key: result.value.key, Record: record });
            allResults.push(record);
            result = await iterator.next();
        }
        iterator.close();
        return JSON.stringify(allResults);
    }

    async GetAsset(ctx, key) {
        const flag = await this.assetExist(ctx, key);

        if (!flag) {
            throw new Error(`asset with key ${key} does not exist`);
        }

        const asset = await context.stub.getState(key);

        if (!asset)
            throw new Error(`asset not found ${key}`);

        await context.stub.setEvent('fetch-asset', asset);

        return asset.toString();
    }


    async GetAssetsByOwner(ctx, ownerId) {
        const assets = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let asset = await iterator.next();
        while (!asset.done) {
            let data = Buffer.from(asset.value.value.toString()).toString('utf8');
            let obj;
            try {
                obj = JSON.parse(data);
            } catch (err) {
                console.log(err);
                obj = data;
            }

            if (obj.ownerId === ownerId)
                assets.push(obj);
            asset = await iterator.next();
        }

        iterator.close();
        return JSON.stringify(assets);
    }
}

module.exports = IdCardContract