
'use strict';

var fetchImages = require('../lib/images');
var buildMock = require('./mocks').buildMock;
var buildResult = require('./mocks').buildResult;
var expect = require('must');
var fs = require('fs');

describe('analyze docker images', function() {

  var instance;
  var result;

  beforeEach(function() {
    instance = fetchImages(buildMock);
    result = buildResult();
  });

  describe('without dockerFilters', function() {
    it('must create the container definitions based on the images', function(done) {
      instance({}, result, function() {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/images-without-dockerfilters.json'));
        expect(result.containerDefinitions).to.eql(expected);
        done();
      });
    });

    it('must create the container definitions based on the images (dockerFilters present but empty)', function(done) {
      instance({ dockerFilters: [] }, result, function() {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/images-without-dockerfilters.json'));
        expect(result.containerDefinitions).to.eql(expected);
        done();
      });
    });
  });

  describe('with dockerFilters', function() {

    var opts = { dockerFilters: ['sudc'] };

    it('must create the container definitions based on the images', function(done) {
      instance(opts, result, function() {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/images-with-dockerfilters.json'));
        expect(result.containerDefinitions).to.eql(expected);
        done();
      });
    });
  });
});
