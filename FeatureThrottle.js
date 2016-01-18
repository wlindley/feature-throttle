var crypto = require('crypto');

function FeatureThrottle(dataProvider) {
	var self = this;

	this.init = function init(callback) {
		dataProvider.init(callback);
	};

	this.destroy = function destroy(callback) {
		dataProvider.destroy(callback);
	};

	this.removeThrottle = function removeThrottle(name, callback) {
		var names = Array.prototype.slice.call(arguments, 0, -1);
		dataProvider.remove(names, arguments[arguments.length - 1]);
	};

	this.listThrottles = function listThrottles(callback) {
		dataProvider.get(callback);
	};

	this.updateThrottles = function updateThrottles(throttles, callback) {
		if (null === throttles || 0 === Object.keys(throttles).length)
			return callback();
		dataProvider.add(throttles, callback);
	};

	this.setThrottles = function setThrottles(input, callback) {
		dataProvider.get(function onListThrottles(err, throttles) {
			if (err)
				throw new Error(err);

			var toRemove = [];
			for (var key in throttles)
				if (!(key in input))
					toRemove.push(key);
			if (0 !== toRemove.length) {
				dataProvider.remove(toRemove, function onRemove(err) {
					if (err)
						throw new Error(err);

					self.updateThrottles(input, callback);
				});
			} else {
				self.updateThrottles(input, callback);
			}
		});
	};

	this.checkThrottle = function checkThrottle(name, id, callback) {
		dataProvider.get(function onListThrottles(err, throttles) {
			if (err)
				return callback(new Error(err));
			if (!(name in throttles))
				return callback(new Error('throttle not found'));

			var hash = crypto.createHash('sha1').update(id).digest('hex');
			var lowByte = parseInt(hash.substr(-2), 16);
			var percent = Number(lowByte) / 256.0;
			callback(null, percent < throttles[name]);
		});
	};
}

module.exports = FeatureThrottle;