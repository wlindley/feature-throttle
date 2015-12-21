var redis = require('./redis-wrapper');

var redisKey = "featureThrottles";

module.exports.name = "redis";

module.exports.get = function get(callback) {
	redis.hgetall(redisKey, function dataGet(err, throttles) {
		if (err)
			return callback(new Error(err));

		if (null === throttles)
			throttles = {};
		callback(null, throttles);
	});
};

module.exports.set = function set(throttles, callback) {
	redis.del(redisKey, function onDelete(err) {
		if (err)
			callback(new Error(err));
		
		redis.hmset(redisKey, throttles, callback);
	});
};