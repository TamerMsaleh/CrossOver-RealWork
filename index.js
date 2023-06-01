"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const memcached = require("memcached");
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
exports.resetRedis = async function () {
    redisClient.set(KEY, String(DEFAULT_BALANCE));
    return DEFAULT_BALANCE;
};

exports.chargeRequestRedis = async function (input) {
     var remainingBalance = await getBalanceRedis(KEY);
    var charges = getCharges();
    const isAuthorized = authorizeRequest(remainingBalance, charges);
    if (!isAuthorized) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }
    var ret = await chargeRedis(KEY, charges);
    return {
        remainingBalance: ret,
        charges,
        isAuthorized,
    };
};
function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}
function getCharges() {
    return DEFAULT_BALANCE / 20;
}
