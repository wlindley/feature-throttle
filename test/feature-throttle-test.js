var assert = require('chai').assert;
var should = require('chai').should();
var sinon = require('sinon');
var async = require('async');
var featureThrottle = require('../feature-throttle');

describe('feature-throttle', function() {
	var dataSource = null;

	beforeEach(function() {
		dataSource = {
			"set" : sinon.stub(),
			"get" : sinon.stub()
		};
		featureThrottle.setDataSource(dataSource);
	});

	describe('#setThrottles', function() {
		it('should pass given throttles to data source', function(done) {
			var throttles = {"foo" : 1, "bar" : .5};
			featureThrottle.setThrottles(throttles, done);
			dataSource.set.calledWith(throttles, done);
			done();
		});
	});

	describe('#listThrottles', function() {
		it('should return throttles from data source', function(done) {
			var expected = {"bing" : .25, "baz" : .125};
			dataSource.get.callsArgWith(0, null, expected);
			featureThrottle.listThrottles(function(err, actual) {
				if (err)
					throw err;
				actual.should.equal(expected);
				done();
			});
		});
	});

	describe('#removeThrottle', function() {
		it('sets existing throttle data after deleting specified throttle', function(done) {
			var original = {"feature1" : .5, "feature2" : .6};
			dataSource.get.callsArgWith(0, null, original);
			dataSource.set.callsArg(1);
			featureThrottle.removeThrottle("feature2", function(err) {
				if (err)
					throw err;
				dataSource.set.calledWith({"feature1" : .5});
				done();
			});
		});

		it('does not throw when asked to remove non-existent throttle', function(done) {
			var original = {"feature1" : .5};
			dataSource.get.callsArgWith(0, null, original);
			dataSource.set.callsArg(1);
			featureThrottle.removeThrottle("feature2", function(err) {
				if (err)
					throw err;
				dataSource.set.calledWith(original);
				done();
			});
		});
	});

	describe('#updateThrottles', function() {
		it('adds and updates throttles without removing any', function(done){
			var original = {'feature1' : .25, 'feature2' : .5};
			var additional = {'feature1' : .35, 'feature3' : .45};
			dataSource.get.callsArgWith(0, null, original);
			dataSource.set.callsArg(1);
			featureThrottle.updateThrottles(additional, function(err){
				if (err)
					throw err;
				var combined = {'feature1' : .35, 'feature2' : .5, 'feature3' : .45};
				dataSource.set.calledWith(combined);
				done();
			});
		});
	});

	describe('#checkThrottle', function() {
		it('returns false when throttle is set to zero', function(done) {
			var throttles = {'feature' : 0};
			dataSource.get.callsArgWith(0, null, throttles);
			featureThrottle.checkThrottle('feature', 'userId', function(err, didPass) {
				didPass.should.be.false;
				done();
			});
		});

		it('returns true when throttle is set to one', function(done) {
			var throttles = {'feature' : 1};
			dataSource.get.callsArgWith(0, null, throttles);
			featureThrottle.checkThrottle('feature', 'userId', function(err, didPass) {
				didPass.should.be.true;
				done();
			});
		});

		it('returns expected value when throttle is set to fraction', function(done) {
			var throttles = {'feature' : .5};
			var passes = 0;
			var fails = 0;
			var userIds = [];
			dataSource.get.callsArgWith(0, null, throttles);
			for (var i = 0; i < 1000; i++)
				userIds.push("user" + (Math.random() * 10000));
			async.each(userIds, function(userId, itComplete){
				featureThrottle.checkThrottle('feature', userId, function(err, didPass) {
					if (err)
						throw err;
					if (didPass)
						passes++;
					else
						fails++;
					itComplete();
				});
			}, function(err) {
				if (err)
					throw err;
				var percentPassed = passes / (passes + fails);
				percentPassed.should.be.above(.4).and.below(.6);
				done();
			});
		});
	});
});