var aws = require('aws-sdk');
var async = require('async');
aws.config.update({
	region : 'us-west-2',
	endpoint : 'http://localhost:8000'
});
var dynamodb = new aws.DynamoDB();
var dynamodbDoc = new aws.DynamoDB.DocumentClient();
var tableName = 'feature-throttles';
module.exports.name = 'dynamodb';
init();

function init() {
	dynamodb.listTables({}, function onListTables(err, result) {
		if (err)
			throw new Error(err);
		if (-1 === result.TableNames.indexOf(tableName))
			createTable();
		else
			console.log('Dynamo table %s already created', tableName);
	});
}

function createTable() {
	console.log('Creating Dynamo table ' + tableName);
	var params = {
		TableName : tableName,
		KeySchema : [
			{ AttributeName : 'name', KeyType : 'HASH' }
		],
		AttributeDefinitions : [
			{ AttributeName : 'name', AttributeType : 'S' }
		],
		ProvisionedThroughput : {
			ReadCapacityUnits : 10,
			WriteCapacityUnits : 10
		}
	};
	dynamodb.createTable(params, function onCreateTable(err, result) {
		if (err)
			throw new Error(err);
		console.log('Dynamo table %s created', tableName);
	});
}

module.exports.deleteTable = function deleteTable() {
	dynamodb.deleteTable({TableName : tableName}, function onDeleteTable(err, result) {
		if (err)
			throw new Error(err);
		console.log('Dynamo table %s deleted, %s', tableName, result);
	});
};

module.exports.get = function get(callback) {
	var params = {
		TableName : tableName
	};
	dynamodbDoc.scan(params, function onScan(err, result) {
		if (err)
			throw new Error(err);

		var throttles = {};
		result.Items.forEach(function onEach(item, index, array) {
			throttles[item.name] = item.value;
		});
		callback(null, throttles);
	});
};

module.exports.add = function add(throttles, callback) {
	async.forEachOf(throttles,
		function onEach(item, key, itemComplete) {
			var params = {
				TableName : tableName,
				Item : {
					'name' : key,
					'value' : item
				}
			};
			dynamodbDoc.put(params, itemComplete);
		},
		callback);
};

module.exports.remove = function remove(names, callback) {
	async.each(names,
		function onEach(item, itemComplete) {
			var params = {
				TableName : tableName,
				Key : { name : item }
			};
			dynamodbDoc.delete(params, itemComplete);
		},
		callback);
};
