'use strict';
const jsonData = require('./tmp.json')
const IdCardContract = require('./chaincode.js');
module.exports.IdCardContract = IdCardContract;
module.exports.contracts = [IdCardContract];

//console.log(jsonData);
//console.log(new Date(jsonData[0].dateOfBirth).toISOString())