var express = require('express');
var bodyParser = require('body-parser');
var featureThrottle = require('./feature-throttle');
var redisDataSource = require('./redis-data-source');
featureThrottle.setDataSource(redisDataSource);

var app = express();
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get('/throttle', function getThrottle(req, res) {
	featureThrottle.listThrottles(function onListThrottles(err, throttles) {
		if (err)
			res.status(500).send();
		else
			res.json(throttles);
	});
});

app.post('/throttle/:name', function postThrottle(req, res) {
	featureThrottle.setThrottle(req.params.name, parseFloat(req.body), function onSetThrottle(err) {
		if (err)
			res.status(500).send();
		else
			res.send();
	});
});

app.get('/throttle/:name/passes/:id', function getThrottlePasses(req, res) {
	featureThrottle.checkThrottle(req.params.name, req.params.id, function onCheckThrottle(err, doesPass) {
		if (err)
			res.status(500).send();
		else
			res.send(doesPass);
	});
});

var server = app.listen(8080, function serverStarted() {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Server is listenting at http://%s:%s", host, port);
});