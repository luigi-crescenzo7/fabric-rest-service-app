'use strict';

const { Contract } = require('fabric-contract-api');
const IdCard = require('./idcard.js');
const jsonData = require('./tmp.json')

class IdCardContract extends Contract {

    async InitLedger(ctx, jsonArray) {
        const stub = ctx.stub;

        const array = JSON.parse(jsonArray);

        let i = 0;
        for(let jsonElement of jsonData) {
            jsonElement.docType = 'asset';
            jsonElement.key = array[i++];
            await stub.putState(jsonElement.key, Buffer.from(JSON.stringify(jsonElement)));
        }
    }


    async CreateAsset(ctx, key, name, surname, cardNumber, sex, dateOfBirth, placeOfBirth, nationality, expiryDate, fiscalCode, ownerId) {
        const flag = await this.assetExist(ctx, key);
        if (flag) throw new Error(`asset with key ${key} already exists`);

        const cardAsset = new IdCard(key, name, surname, cardNumber,
                                     sex, dateOfBirth, placeOfBirth, 
                                     nationality, expiryDate, fiscalCode, ownerId);

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