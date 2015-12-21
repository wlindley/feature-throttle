var assert = require('chai').assert;
var should = require('chai').should();
var sinon = require('sinon');
var async = require('async');
var featureThrottle = require('../feature-throttle');

describe('feature-throttle', function() {
	var dataSource = null;
	var originalThrottles = null;

	beforeEach(function() {
		dataSource = {
			"set" : sinon.stub(),
			"get" : sinon.stub()
		};
		originalThrottles = {};
		dataSource.set.callsArg(1);
		dataSource.get.callsArgWith(0, null, originalThrottles);
		featureThrottle.setDataSource(dataSource);
	});

	describe('#setThrottles', function() {
		it('should pass given throttles to data source', function(done) {
			var throttles = {"foo" : 1, "bar" : .5};
			featureThrottle.setThrottles(throttles, function(err) {
				if (err)
					throw err;
				dataSource.set.calledWith(throttles);
				done();
			});
		});
	});

	describe('#listThrottles', function() {
		it('should return throttles from data source', function(done) {
			originalThrottles['bing'] = .25;
			originalThrottles['baz'] = .125;
			featureThrottle.listThrottles(function(err, actual) {
				if (err)
					throw err;
				actual.should.equal(originalThrottles);
				done();
			});
		});
	});

	describe('#removeThrottle', function() {
		it('sets existing throttle data after deleting specified throttle', function(done) {
			originalThrottles['feature1'] = .5;
			originalThrottles['feature2'] = .6;
			featureThrottle.removeThrottle('feature2', function(err) {
				if (err)
					throw err;
				dataSource.set.calledWith({'feature1' : .5});
				done();
			});
		});

		it('does not throw when asked to remove non-existent throttle', function(done) {
			originalThrottles['feature1'] = .5;
			featureThrottle.removeThrottle('feature2', function(err) {
				if (err)
					throw err;
				dataSource.set.calledWith(originalThrottles);
				done();
			});
		});
	});

	describe('#updateThrottles', function() {
		it('adds and updates throttles without removing any', function(done){
			originalThrottles['feature1'] = .25;
			originalThrottles['feature2'] = .5;
			var additional = {'feature1' : .35, 'feature3' : .45};
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
			originalThrottles['feature'] = 0;
			featureThrottle.checkThrottle('feature', 'userId', function(err, didPass) {
				didPass.should.be.false;
				done();
			});
		});

		it('returns true when throttle is set to one', function(done) {
			originalThrottles['feature'] = 1;
			featureThrottle.checkThrottle('feature', 'userId', function(err, didPass) {
				didPass.should.be.true;
				done();
			});
		});

		it('returns expected value when throttle is set to fraction', function(done) {
			originalThrottles['feature'] = .5;
			var passes = 0;
			var fails = 0;
			var userIds = [];
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