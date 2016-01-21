var aws = require('aws-sdk');
var async = require('async');

var awsConfig = { region : 'us-west-2' };
if (process.env.test)
	awsConfig.endpoint = 'http://localhost:8000';
aws.config.update(awsConfig);
var dynamodb = new aws.DynamoDB();
const TABLE_NAME = 'feature-throttles';

function DynamoDataProvider() {

}

DynamoDataProvider.prototype.name = 'Dynamo';

DynamoDataProvider.prototype.init = function init(callback) {
	dynamodb.listTables({}, function onListTables(err, result) {
		if (err)
			return callback(new Error(err));
		if (-1 === result.TableNames.indexOf(TABLE_NAME))
			return createTable(callback);
		callback();
	});
};

DynamoDataProvider.prototype.destroy = function destroy(callback) {
	dynamodb.deleteTable({TableName : TABLE_NAME}, function onDeleteTable(err, result) {
		callback(err);
	});
};

DynamoDataProvider.prototype.get = function get(callback) {
	var params = {
		TableName : TABLE_NAME
	};
	dynamodb.scan(params, function onScan(err, result) {
		if (err)
			return callback(new Error(err));

		var throttles = {};
		result.Items.forEach(function onEach(item, index, array) {
			throttles[item.throttle.S] = Number(item.threshold.N);
		});
		callback(null, throttles);
	});
};

DynamoDataProvider.prototype.add = function add(throttles, callback) {
	async.forEachOf(throttles,
		function onEach(item, key, itemComplete) {
			var params = {
				TableName : TABLE_NAME,
				Item : {
					throttle : { 'S' : key },
					threshold : { 'N' : String(item) }
				}
			};
			dynamodb.putItem(params, function(err, result) {
				itemComplete(err, result);
			});
		},
		callback);
};

DynamoDataProvider.prototype.remove = function remove(names, callback) {
	async.each(names,
		function onEach(item, itemComplete) {
			var params = {
				TableName : TABLE_NAME,
				Key : { throttle : { 'S' : item } }
			};
			dynamodb.deleteItem(params, itemComplete);
		},
		callback);
};

function createTable(callback) {
	var params = {
		TableName : TABLE_NAME,
		KeySchema : [
			{ AttributeName : 'throttle', KeyType : 'HASH' }
		],
		AttributeDefinitions : [
			{ AttributeName : 'throttle', AttributeType : 'S' }
		],
		ProvisionedThroughput : {
			ReadCapacityUnits : 10,
			WriteCapacityUnits : 10
		}
	};
	dynamodb.createTable(params, function onCreateTable(err, result) {
		if (err)
			return callback(new Error(err));
		callback();
	});
}

module.exports = DynamoDataProvider;
