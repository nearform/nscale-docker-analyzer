
'use strict';

var fs = require('fs');

function buildMock() {
  function query(file, ipaddress, cb) {
    fs.readFile(file, function(err, data) {
      if (data) {
        data = JSON.parse(data);
      }
      cb(err, data);
    });
  }

  return {
    queryContainers: query.bind(null, __dirname + '/containers.json'),
    queryImages: query.bind(null, __dirname + '/images.json')
  };
}

exports.buildMock = buildMock;

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

exports.buildResult = buildResult;
