
'use strict';

var containers = require('../lib/containers');
var images = require('../lib/images');
var buildMock = require('./mocks').buildMock;
var buildResult = require('./mocks').buildResult;
var expect = require('must');
var fs = require('fs');

describe('analyze containers', function() {

  var instance;
  var result;

  beforeEach(function(done) {
    instance = containers(buildMock);
    result = buildResult();
    images(buildMock)({}, result, done);
  });

  describe('without dockerFilters', function() {
    it('must create the topology based on the containers', function(done) {
      instance({}, result, function() {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/containers-without-dockerfilters.json'));
        expect(result.topology.containers).to.eql(expected);
        done();
      });
    });

    it('must create the topology based on the containers (dockerFilters present but empty)', function(done) {
      var opts = { dockerFilters: [] };
      instance(opts, result, function() {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/containers-without-dockerfilters.json'));
        expect(result.topology.containers).to.eql(expected);
        done();
      });
    });
  });

  describe('with dockerFilters', function() {

    var opts = { dockerFilters: ['sudc'] };

    it('must create the topology based on the containers', function(done) {
      instance(opts, result, function() {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/containers-with-dockerfilters.json'));
        expect(result.topology.containers).to.eql(expected);
        done();
      });
    });
  });
});
