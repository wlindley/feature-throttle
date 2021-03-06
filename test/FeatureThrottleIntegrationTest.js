var FeatureThrottle = require('../FeatureThrottle');
var RedisDataProvider = require('../RedisDataProvider');
var DynamoDataProvider = require('../DynamoDataProvider');
var MemoryDataProvider = require('../MemoryDataProvider');
var UserMapper = require('../HashUserMapper');
var should = require('chai').should();
var sinon = require('sinon');
var async = require('async');

var dataProviderTypes = [MemoryDataProvider, RedisDataProvider, DynamoDataProvider];

dataProviderTypes.forEach(function buildTestSuite(DataProvider) {
	var providerName = new DataProvider().name;

	describe(`FeatureThrottle (${providerName} Integration)`, function() {
		var testObj;

		beforeEach(function(done) {
			testObj = new FeatureThrottle(new DataProvider(), new UserMapper());
			testObj.init(done);
		});

		afterEach(function(done) {
			testObj.destroy(function(err) {
				testObj = null;
				done(err);
			});
		});

		describe('#setThrottles', function() {
			it('adds new throttles', function(done) {
				async.series([
					async.apply(testObj.setThrottles, {'feature2' : .2}),
					async.apply(async.waterfall, [
						testObj.listThrottles,
						async.asyncify(function(throttles) {
							throttles.should.include.key('feature2');
							throttles.feature2.should.equal(.2);
						})
					])
				], done);
			});

			it('updates existing throttles', function(done) {
				async.series([
					async.apply(testObj.setThrottles, {'feature1' : .3}),
					async.apply(testObj.setThrottles, {'feature1' : .8}),
					async.apply(async.waterfall, [
						testObj.listThrottles,
						async.asyncify(function(throttles) {
							throttles.should.include.key('feature1');
							throttles.feature1.should.equal(.8);
						})
					])
				], done);
			});

			it('deletes existing keys that are not present in new data', function(done) {
				async.series([
					async.apply(testObj.setThrottles, {'feature1' : .05}),
					async.apply(testObj.setThrottles, {'feature2' : .95}),
					async.apply(async.waterfall, [
						testObj.listThrottles,
						async.asyncify(function(throttles) {
							throttles.should.not.include.key('feature1');
							throttles.should.include.key('feature2');
							throttles.feature2.should.equal(.95);
						})
					])
				], done);
			});
		});

		describe('#removeThrottle', function() {
			it('removes all given throttles', function(done) {
				async.series([
					async.apply(testObj.setThrottles, {'feature1' : .1, 'feature2' : .2, 'feature3' : .3}),
					async.apply(testObj.removeThrottle, 'feature1', 'feature3'),
					async.apply(async.waterfall, [
						testObj.listThrottles,
						async.asyncify(function(throttles) {
							throttles.should.not.include.key('feature1');
							throttles.should.not.include.key('feature3');
							throttles.should.include.key('feature2');
							throttles.feature2.should.equal(.2);
						})
					])
				], done);
			});
		});

		describe('#updateThrottles', function() {
			it('adds and updates specified throttles, but does not delete anything', function(done) {
				async.series([
					async.apply(testObj.setThrottles, {'feature1' : .9, 'feature2' : .5}),
					async.apply(testObj.updateThrottles, {'feature1' : .35, 'feature3' : .3}),
					async.apply(async.waterfall, [
						testObj.listThrottles,
						async.asyncify(function(throttles) {
							throttles.should.include.keys('feature1', 'feature2', 'feature3');
							throttles.feature1.should.equal(.35);
							throttles.feature2.should.equal(.5);
							throttles.feature3.should.equal(.3);
						})
					])
				], done);
			});
		});

		describe('#checkThrottle', function() {
			it('returns false when throttle is set to zero', function(done) {
				async.series([
					async.apply(testObj.setThrottles, {'feature' : 0}),
					async.apply(async.waterfall, [
						async.apply(testObj.checkThrottle, 'feature', 'userId'),
						async.asyncify(function(didPass) {
							didPass.should.be.false;
						})
					])
				], done);
			});

			it('returns true when throttle is set to one', function(done) {
				async.series([
					async.apply(testObj.setThrottles, {'feature' : 1}),
					async.apply(async.waterfall, [
						async.apply(testObj.checkThrottle, 'feature', 'userId'),
						async.asyncify(function(didPass) {
							didPass.should.be.true;
						})
					])
				], done);
			});

			it('returns true when user mapper returns value below throttle', function(done) {
				var userMapper = new UserMapper();
				testObj = new FeatureThrottle(new DataProvider(), userMapper);
				sinon.stub(userMapper, 'mapUser').callsArgWithAsync(1, null, .1);
				async.series([
					testObj.init,
					async.apply(testObj.setThrottles, {'feature' : .5}),
					async.apply(async.waterfall, [
						async.apply(testObj.checkThrottle, 'feature', 'user01'),
						async.asyncify(function(didPass) {
							didPass.should.be.true;
						})
					])
				], done);
			});

			it('returns false when user mapper returns value above throttle', function(done) {
				var userMapper = new UserMapper();
				testObj = new FeatureThrottle(new DataProvider(), userMapper);
				sinon.stub(userMapper, 'mapUser').callsArgWithAsync(1, null, .9);
				async.series([
					testObj.init,
					async.apply(testObj.setThrottles, {'feature' : .5}),
					async.apply(async.waterfall, [
						async.apply(testObj.checkThrottle, 'feature', 'user01'),
						async.asyncify(function(didPass) {
							didPass.should.be.false;
						})
					])
				], done);
			});
		});
	});
});
