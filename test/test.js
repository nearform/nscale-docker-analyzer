
var dockerAnalyzer = require('../');
var fs = require('fs');
var assert = require('assert');
var expect = require('must');

describe('docker-analyzer', function() {
  function buildMock() {
    function query(file, ipaddress, cb) {
      fs.readFile(file, function(err, data) {
        if (data) {
          data = JSON.parse(data);
        }
        cb(err, data);
      })
    }

    return {
      queryContainers: query.bind(null, __dirname + '/containers.json'),
      queryImages: query.bind(null, __dirname + '/images.json')
    }
  }

  function buildResult() {
    return {
      'name': '',
      'namespace': '',
      'id': '',
      'containerDefinitions': [{
        'name': 'Machine',
        'type': 'blank-container',
        'specific': {},
        'id': '85d99b2c-06d0-5485-9501-4d4ed429799c'
      }],
      'topology': {
        'containers': {
          '10': {
            'id': '10',
            'containerDefinitionId': '85d99b2c-06d0-5485-9501-4d4ed429799c',
            'containedBy': '10',
            'contains': [],
            'type': 'blank-container',
            'specific': {'ipaddress': 'localhost'}
          },
        }
      }
    };
  }

  var instance;
  var result;

  beforeEach(function() {
    instance = dockerAnalyzer(buildMock);
    result = buildResult()
  });

  describe('without dockerFilters', function() {
    it('must create the container definitions based on the images', function(done) {
      instance.fetchImages({}, result, function(err) {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/images-without-dockerfilters.json'));
        expect(result.containerDefinitions).to.eql(expected);
        done();
      });
    });

    it('must create the container definitions based on the images (dockerFilters present but empty)', function(done) {
      instance.fetchImages({ dockerFilters: [] }, result, function(err) {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/images-without-dockerfilters.json'));
        expect(result.containerDefinitions).to.eql(expected);
        done();
      });
    });

    it('must create the topology based on the containers', function(done) {
      instance.fetchImages({}, result, function(err) {
        instance.fetchContainers({}, result, function(err) {
          var expected = JSON.parse(fs.readFileSync(__dirname + '/containers-without-dockerfilters.json'));
          expect(result.topology.containers).to.eql(expected);
          done();
        })
      });
    });

    it('must create the topology based on the containers (dockerFilters present but empty)', function(done) {
      var opts = { dockerFilters: [] }
      instance.fetchImages(opts, result, function(err) {
        instance.fetchContainers(opts, result, function(err) {
          var expected = JSON.parse(fs.readFileSync(__dirname + '/containers-without-dockerfilters.json'));
          expect(result.topology.containers).to.eql(expected);
          done();
        })
      });
    });
  });

  describe('with dockerFilters', function() {

    var opts = { dockerFilters: ['sudc'] }

    it('must create the container definitions based on the images', function(done) {
      instance.fetchImages(opts, result, function(err) {
        var expected = JSON.parse(fs.readFileSync(__dirname + '/images-with-dockerfilters.json'));
        expect(result.containerDefinitions).to.eql(expected);
        done();
      });
    })

    it('must create the topology based on the containers', function(done) {
      instance.fetchImages(opts, result, function(err) {
        instance.fetchContainers(opts, result, function(err) {
          var expected = JSON.parse(fs.readFileSync(__dirname + '/containers-with-dockerfilters.json'));
          expect(result.topology.containers).to.eql(expected);
          done();
        })
      });
    });
  })
})
