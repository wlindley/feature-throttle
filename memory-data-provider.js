var async = require('async');

function MemoryDataProvider() {
	this.throttleValues = {};
}

MemoryDataProvider.prototype.init = function init(callback) {
	async.nextTick(callback);
};

MemoryDataProvider.prototype.destroy = function destroy(callback) {
	async.nextTick(callback);
};

MemoryDataProvider.prototype.get = function get(callback) {
	async.nextTick(async.apply(callback, null, throttles));
};

MemoryDataProvider.prototype.add = function add(throttles, callback) {
	for (var key in throttles)
		if (Object.hasOwnProperty(throttles, key))
			throttleValues[key] = throttles[key];
	async.nextTick(callback);
};

MemoryDataProvider.prototype.remove = function remove(names, callback) {
	for (var key in throttles)
		if (Object.hasOwnProperty(throttles, key))
			delete throttleValues[key];
	async.nextTick(callback);
};

module.exports = MemoryDataProvider;
