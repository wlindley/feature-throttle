var assert = require('chai').assert;
var should = require('chai').should();
var sinon = require('sinon');
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
});