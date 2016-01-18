var crypto = require('crypto');
var async = require('async');

function HashUserMapper() {

}

HashUserMapper.prototype.mapUser = function(userId, callback) {
	var hash = crypto.createHash('sha1').update(userId).digest('hex');
	var lowByte = parseInt(hash.substr(-2), 16);
	var percent = Number(lowByte) / 256.0;
	async.nextTick(async.apply(callback, null, percent));
};

module.exports = HashUserMapper;