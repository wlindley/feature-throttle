var redis = require('./redis-wrapper');
var async = require('async');

var redisKey = 'featureThrottles';

function RedisDataProvider() {

}

RedisDataProvider.prototype.name = 'Redis';

RedisDataProvider.prototype.init = function init(callback) {
	async.nextTick(callback);
};

RedisDataProvider.prototype.destroy = function destroy(callback) {
	async.nextTick(callback);
};

RedisDataProvider.prototype.get = function get(callback) {
	redis.hgetall(redisKey, function dataGet(err, throttles) {
		if (err)
			return callback(new Error(err));

		if (null === throttles)
			throttles = {};
		for (var key in throttles)
			if (Object.prototype.hasOwnProperty.call(throttles, key))
				throttles[key] = Number(throttles[key]);
		callback(null, throttles);
	});
};

RedisDataProvider.prototype.add = function add(throttles, callback) {
	redis.hmset(redisKey, throttles, callback);
};

RedisDataProvider.prototype.remove = function remove(names, callback) {
	var args = [redisKey].concat(names, [callback]);
	redis.hdel.apply(redis, args);
};

module.exports = RedisDataProvider;
