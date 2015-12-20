var crypto = require('crypto');

var dataSource = null;

module.exports.setDataSource = function setDataSource(source) {
	dataSource = source;
};

module.exports.listThrottles = function listThrottles(callback) {
	dataSource.get(function dataGet(err, throttles) {
		if (err)
			return callback(new Error(err));

		if (null === throttles)
			throttles = {};
		callback(null, throttles);
	});
};

module.exports.setThrottle = function setThrottle(name, percent, callback) {
	module.exports.listThrottles(function onListThrottles(err, throttles) {
		if (err)
			return callback(new Error(err));

		throttles[name] = percent;
		dataSource.set(throttles, callback);
	});
};

module.exports.checkThrottle = function checkThrottle(name, id, callback) {
	module.exports.listThrottles(function onListThrottles(err, throttles){
		if (err)
			return callback(new Error(err));
		if (!(name in throttles))
			return callback(new Error("throttle not found"));

		var hash = crypto.createHash('sha1').update(id).digest('hex');
		var lowByte = parseInt(hash.substr(-2), 16);
		var percent = Number(lowByte) / 256.0;
		callback(null, percent < throttles[name]);
	});
};