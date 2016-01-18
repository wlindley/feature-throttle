var express = require('express');
var bodyParser = require('body-parser');
var featureThrottle = require('./feature-throttle');
//var redisDataProvider = require('./redis-data-provider');
var dynamodbDataProvider = require('./dynamo-data-provider');
//featureThrottle.setDataProvider(redisDataProvider);
featureThrottle.setDataProvider(dynamodbDataProvider);

var app = express();
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.set('views', './views');
app.set('view engine', 'jade');

app.get('/throttles', function getThrottle(req, res) {
	featureThrottle.listThrottles(function onListThrottles(err, throttles) {
		if (err)
			res.status(500).send();
		else
			res.json(throttles);
	});
});

app.post('/throttles', function postThrottles(req, res) {
	featureThrottle.updateThrottles(req.body, function onSetThrottle(err) {
		if (err)
			res.status(500).send();
		else
			res.send();
	});
});

app.post('/throttle/:name', function postThrottle(req, res) {
	var throttles = {};
	throttles[req.params.name] = parseFloat(req.body);
	featureThrottle.updateThrottles(throttles, function onSetThrottle(err) {
		if (err)
			res.status(500).send();
		else
			res.send();
	});
});

app.delete('/throttle/:name', function deleteThrottle(req, res) {
	featureThrottle.removeThrottle(req.params.name, function onRemoveThrottle(err) {
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

app.get('/throttle-editor', function getThrottleEditor(req, res) {
	featureThrottle.listThrottles(function onListThrottles(err, throttles) {
		var params = {};
		params.throttles = throttles;
		params.redirectUri = '/throttle-editor';
		res.render('throttle-editor', params);
	});
});

app.post('/throttle-editor', function postThrottleEditor(req, res) {
	var throttleData = req.body;
	var newName = throttleData.newName;
	var newValue = throttleData.newValue;
	var redirectUri = throttleData.redirectUri;
	delete throttleData.newName;
	delete throttleData.newValue;
	delete throttleData.redirectUri;
	if (newName) {
		if (newValue)
			throttleData[newName] = parseFloat(newValue);
		else
			throttleData[newName] = 0.0;
	}
	featureThrottle.setThrottles(throttleData, function onSetThrottles(err) {
		if (err)
			res.status(500).send();
		else
			res.redirect(redirectUri);
	});
});

var server = app.listen(8080, function serverStarted() {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server is listenting at http://%s:%s', host, port);
});
