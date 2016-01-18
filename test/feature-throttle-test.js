var assert = require('chai').assert;
var should = require('chai').should();
var sinon = require('sinon');
var async = require('async');
var FeatureThrottle = require('../feature-throttle');

describe('feature-throttle', function() {
	var dataProvider = null;
	var originalThrottles = null;
	var featureThrottle = null;

	beforeEach(function() {
		dataProvider = {
			'add' : sinon.stub(),
			'get' : sinon.stub(),
			'remove' : sinon.stub()
		};
		originalThrottles = {};
		dataProvider.remove.callsArg(1);
		dataProvider.add.callsArg(1);
		dataProvider.get.callsArgWith(0, null, originalThrottles);
		featureThrottle = new FeatureThrottle(dataProvider);
	});

	describe('#setThrottles', function() {
		it('adds new throttles', function(done) {
			var throttles = {'feature2' : .2};
			featureThrottle.setThrottles(throttles, function(err) {
				if (err)
					throw err;
				assert(dataProvider.add.calledWith(throttles));
				assert(!dataProvider.remove.called);
				done();
			});
		});

		it('updates existing throttles', function(done) {
			originalThrottles['feature1'] = .3;
			var updated = {'feature1' : .8};
			featureThrottle.setThrottles(updated, function(err) {
				if (err)
					throw err;
				assert(dataProvider.add.calledWith(updated));
				assert(!dataProvider.remove.called);
				done();
			});
		});

		it('deletes existing keys that are not present in new data', function(done) {
			originalThrottles['feature1'] = .05;
			var newThrottles = {'feature2' : .95};
			featureThrottle.setThrottles(newThrottles, function(err) {
				if (err)
					throw err;
				assert(dataProvider.remove.calledWith(['feature1']));
				assert(dataProvider.add.calledWith(newThrottles));
				done();
			});
		});

		it('does not call add if no new or existing keys are specified', function(done) {
			originalThrottles['feature1'] = .45;
			featureThrottle.setThrottles({}, function(err) {
				if (err)
					throw err;
				assert(!dataProvider.add.called);
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
		it('removes single throttle', function(done) {
			featureThrottle.removeThrottle('feature2', function(err) {
				if (err)
					throw err;
				assert(dataProvider.remove.calledWith(['feature2']));
				done();
			});
		});

		it('removes multiple throttles when multiple names are passed', function(done) {
			featureThrottle.removeThrottle('feature2', 'feature3', function(err) {
				if (err)
					throw err;
				assert(dataProvider.remove.calledWith(['feature2', 'feature3']));
				done();
			});
		});
	});

	describe('#updateThrottles', function() {
		it('adds and updates specified throttles', function(done){
			var additional = {'feature1' : .35, 'feature3' : .45};
			featureThrottle.updateThrottles(additional, function(err){
				if (err)
					throw err;
				assert(dataProvider.add.calledWith(additional));
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
				userIds.push('user' + (Math.random() * 10000));
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
