"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const MAX_EXPIRATION = 60 * 60 * 24 * 30;

const redisClient = redis.createClient({
  host: process.env.ENDPOINT,
  port: parseInt(process.env.PORT || "6379"),
});

const getAsync = util.promisify(redisClient.get).bind(redisClient);
const decrbyAsync = util.promisify(redisClient.decrby).bind(redisClient);

async function getBalanceRedis(key) {
  const res = await getAsync(key);
  return parseInt(res || "0");
}

async function chargeRedis(key, charges) {
  return decrbyAsync(key, charges);
}

function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}
function getCharges(serviceType, unit) {

    var voiceCharge = DEFAULT_BALANCE / 20;
    var dataCharge = DEFAULT_BALANCE / 10;

    if(serviceType == "voice")
        return voiceCharge * unit;
    else if(serviceType == "data")
        return dataCharge * unit;
}

exports.resetRedis = async function () {
    await redisClient.set(KEY, String(DEFAULT_BALANCE));
    return DEFAULT_BALANCE;
};

exports.chargeRequestRedis = async function (input) {

     const serviceType = input.serviceType;
     const unitValue = input.unit;
    var charges = getCharges(serviceType, unitValue);
    var remainingBalance = await getBalanceRedis(KEY);
    const isAuthorized = authorizeRequest(remainingBalance, charges);
    if (!isAuthorized) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }
    var newBalance = await chargeRedis(KEY, charges);
    return {
        remainingBalance: newBalance,
        charges,
        isAuthorized,
    };
};

