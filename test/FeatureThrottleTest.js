var assert = require('chai').assert;
var should = require('chai').should();
var sinon = require('sinon');
var async = require('async');
var FeatureThrottle = require('../FeatureThrottle');
var DataProvider = require('../MemoryDataProvider');
var UserMapper = require('../HashUserMapper');

describe('FeatureThrottle (Unit)', function() {
	var dataProvider = null;
	var userMapper = null;
	var originalThrottles = null;
	var featureThrottle = null;

	beforeEach(function(done) {
		dataProvider = new DataProvider();
		originalThrottles = {};
		sinon.stub(dataProvider, 'remove').callsArgAsync(1);
		sinon.stub(dataProvider, 'add').callsArgAsync(1);
		sinon.stub(dataProvider, 'get').callsArgWithAsync(0, null, originalThrottles);

		userMapper = new UserMapper();

		featureThrottle = new FeatureThrottle(dataProvider, userMapper);
		featureThrottle.init(done);
	});

	afterEach(function(done) {
		featureThrottle.destroy(function(err) {
			featureThrottle = null;
			done(err);
		});
	});

	describe('#setThrottles', function() {
		it('adds new throttles', function(done) {
			var throttles = {'feature2' : .2};
			featureThrottle.setThrottles(throttles, function(err) {
				if (err)
					return done(err);
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
					return done(err);
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
					return done(err);
				assert(dataProvider.remove.calledWith(['feature1']));
				assert(dataProvider.add.calledWith(newThrottles));
				done();
			});
		});

		it('does not call add if no new or existing keys are specified', function(done) {
			originalThrottles['feature1'] = .45;
			featureThrottle.setThrottles({}, function(err) {
				if (err)
					return done(err);
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
					return done(err);
				actual.should.equal(originalThrottles);
				done();
			});
		});
	});

	describe('#removeThrottle', function() {
		it('removes single throttle', function(done) {
			featureThrottle.removeThrottle('feature2', function(err) {
				if (err)
					return done(err);
				assert(dataProvider.remove.calledWith(['feature2']));
				done();
			});
		});

		it('removes multiple throttles when multiple names are passed', function(done) {
			featureThrottle.removeThrottle('feature2', 'feature3', function(err) {
				if (err)
					return done(err);
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
					return done(err);
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

		it('returns true when user mapper returns value below throttle', function(done) {
			originalThrottles['feature'] = .5;
			sinon.stub(userMapper, 'mapUser').callsArgWithAsync(1, null, .1);
			async.waterfall([
				async.apply(featureThrottle.checkThrottle, 'feature', 'user01'),
				async.asyncify(function(didPass) {
					didPass.should.be.true;
				})
			], done);
		});

		it('returns false when user mapper returns value above throttle', function(done) {
			originalThrottles['feature'] = .5;
			sinon.stub(userMapper, 'mapUser').callsArgWithAsync(1, null, .9);
			async.waterfall([
				async.apply(featureThrottle.checkThrottle, 'feature', 'user01'),
				async.asyncify(function(didPass) {
					didPass.should.be.false;
				})
			], done);
		});

		it('returns error when throttle does not exist', function(done) {
			featureThrottle.checkThrottle('non-feature', 'user02', function(err, didPass) {
				should.exist(err);
				done();
			});
		});
	});
});
