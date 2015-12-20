var redis = require('./redis-wrapper');

var redisKey = "featureThrottles";

module.exports.name = "redis";

module.exports.get = function get(callback) {
	redis.hgetall(redisKey, callback);
};

module.exports.set = function set(throttles, callback) {
	redis.hmset(redisKey, throttles, callback);
};