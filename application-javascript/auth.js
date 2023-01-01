'use strict'


const {HeaderAPIKeyStrategy} = require('passport-headerapikey');
const passport = require('passport');

const {StatusCodes, getReasonPhrase} = require('http-status-codes');
const {UNAUTHORIZED} = StatusCodes;


module.exports.FabricAPIKeyStrategy = new HeaderAPIKeyStrategy(
    // change 'header' and 'prefix' properties
    {header: 'Authorization', prefix: 'Api-Key '},
    false,
    function (apiKey, done) {
        console.log(apiKey);
        const user = {
            key: apiKey
        };
        done(null, user);
    }
);


module.exports.authApiKey =
    (req, res, next) => {
        passport.authenticate(
            'headerapikey',
            {session: false},
            (err, user) => {
                console.log("auth service");
                if (err) next(err);
                console.log(err, user);
                const userKey = user.key;
                console.log('key: ', userKey)
                if (!userKey) res.status(UNAUTHORIZED).json({
                    status: getReasonPhrase(UNAUTHORIZED),
                    reason: 'user not authorized',
                    timestamp: new Date().toISOString()
                });

                req.logIn(userKey, {session: false}, function (err) {
                    return err ? next(err) : next();
                })
                // -----------------------------------
            })(req, res, next);
    };
