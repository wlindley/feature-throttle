var redis = require('./redis-wrapper');

var redisKey = 'featureThrottles';

module.exports.name = 'redis';

module.exports.get = function get(callback) {
	redis.hgetall(redisKey, function dataGet(err, throttles) {
		if (err)
			return callback(new Error(err));

		if (null === throttles)
			throttles = {};
		callback(null, throttles);
	});
};

module.exports.add = function add(throttles, callback) {
	redis.hmset(redisKey, throttles, callback);
};

module.exports.remove = function remove(names, callback) {
	var args = [redisKey].concat(names, [callback]);
	redis.hdel.apply(redis, args);
};
