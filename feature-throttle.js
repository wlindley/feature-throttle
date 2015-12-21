var crypto = require('crypto');

var dataSource = null;

module.exports.setDataSource = function setDataSource(source) {
	dataSource = source;
};

module.exports.removeThrottle = function removeThrottle(name, callback) {
	dataSource.get(function onListThrottles(err, throttles) {
		if (err)
			return callback(new Error(err));

		delete throttles[name];
		dataSource.set(throttles, callback);
	});
};

module.exports.listThrottles = function listThrottles(callback) {
	dataSource.get(callback);
};

module.exports.updateThrottles = function updateThrottles(input, callback) {
	dataSource.get(function onListThrottles(err, throttles) {
		if (err)
			return callback(new Error(err));

		for (var key in input)
			throttles[key] = input[key];
		dataSource.set(throttles, callback);
	});
};

module.exports.setThrottles = function setThrottles(input, callback) {
	dataSource.set(input, callback);
};

module.exports.checkThrottle = function checkThrottle(name, id, callback) {
	dataSource.get(function onListThrottles(err, throttles){
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