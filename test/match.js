'use strict';

var fs = require('fs');
var match = require('../lib/match');
var expect = require('must');

describe('match containers and images with the original system', function() {
  var instance;

  beforeEach(function() {
    var system = JSON.parse(fs.readFileSync(__dirname + '/match-system.json'));
    instance = match(system);
  });

  it('should match the image id to those in the original system definition', function() {
    var input = JSON.parse(fs.readFileSync(__dirname + '/match-input.json'));
    var expected = JSON.parse(fs.readFileSync(__dirname + '/match-output.json'));
    instance(input, function(err, result) {
      expect(result).to.eql(expected);
    });
  });

  it('should work synchronously', function() {
    var input = JSON.parse(fs.readFileSync(__dirname + '/match-input.json'));
    var expected = JSON.parse(fs.readFileSync(__dirname + '/match-output.json'));
    expect(instance(input)).to.eql(expected);
  });
});
