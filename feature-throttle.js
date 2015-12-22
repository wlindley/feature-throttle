var crypto = require('crypto');

var dataSource = null;

module.exports.setDataSource = function setDataSource(source) {
	dataSource = source;
};

module.exports.removeThrottle = function removeThrottle(name, callback) {
	var names = Array.prototype.slice.call(arguments, 0, -1);
	dataSource.remove(names, arguments[arguments.length - 1]);
};

module.exports.listThrottles = function listThrottles(callback) {
	dataSource.get(callback);
};

module.exports.updateThrottles = function updateThrottles(throttles, callback) {
	if (null === throttles || 0 === Object.keys(throttles).length)
		return callback();
	dataSource.add(throttles, callback);
};

module.exports.setThrottles = function setThrottles(input, callback) {
	dataSource.get(function onListThrottles(err, throttles) {
		if (err)
			throw new Error(err);

		var toRemove = [];
		for (var key in throttles)
			if (!(key in input))
				toRemove.push(key);
		if (0 !== toRemove.length) {
			dataSource.remove(toRemove, function onRemove(err) {
				if (err)
					throw new Error(err);

				module.exports.updateThrottles(input, callback);
			});
		} else {
			module.exports.updateThrottles(input, callback);
		}
	});
};

module.exports.checkThrottle = function checkThrottle(name, id, callback) {
	dataSource.get(function onListThrottles(err, throttles) {
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