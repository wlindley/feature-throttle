var redis = require("redis");

module.exports = redis.createClient();
module.exports.on('connect', function redistConnectionHandler(err) {
	if (err)
		console.log("Error connecting to redis server");
	else
		console.log("Connected to redis server");
});