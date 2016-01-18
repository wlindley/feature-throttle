var aws = require('aws-sdk');
var async = require('async');
aws.config.update({
	region : 'us-west-2',
	endpoint : 'http://localhost:8000'
});
var dynamodb = new aws.DynamoDB();
var dynamodbDoc = new aws.DynamoDB.DocumentClient();
var tableName = 'feature-throttles';

function DynamoDataProvider() {

}

DynamoDataProvider.prototype.name = 'Dynamo';

DynamoDataProvider.prototype.init = function init(callback) {
	dynamodb.listTables({}, function onListTables(err, result) {
		if (err)
			throw new Error(err);
		if (-1 === result.TableNames.indexOf(tableName))
			return createTable(callback);
		callback();
	});
};

DynamoDataProvider.prototype.destroy = function destroy(callback) {
	dynamodb.deleteTable({TableName : tableName}, function onDeleteTable(err, result) {
		callback(err);
	});
};

DynamoDataProvider.prototype.get = function get(callback) {
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

DynamoDataProvider.prototype.add = function add(throttles, callback) {
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

DynamoDataProvider.prototype.remove = function remove(names, callback) {
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

function createTable(callback) {
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
		callback();
	});
}

module.exports = DynamoDataProvider;
