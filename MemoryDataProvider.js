var async = require('async');

function MemoryDataProvider() {
	this.throttleValues = {};
}

MemoryDataProvider.prototype.name = 'Memory';

MemoryDataProvider.prototype.init = function init(callback) {
	async.nextTick(callback);
};

MemoryDataProvider.prototype.destroy = function destroy(callback) {
	async.nextTick(callback);
};

MemoryDataProvider.prototype.get = function get(callback) {
	async.nextTick(async.apply(callback, null, this.throttleValues));
};

MemoryDataProvider.prototype.add = function add(throttles, callback) {
	for (var key in throttles)
		this.throttleValues[key] = throttles[key];
	async.nextTick(callback);
};

MemoryDataProvider.prototype.remove = function remove(names, callback) {
	for (var i = 0; i < names.length; i++)
		delete this.throttleValues[names[i]];
	async.nextTick(callback);
};

module.exports = MemoryDataProvider;
