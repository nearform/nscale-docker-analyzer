/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';
var async = require('async');
var _ = require('lodash');

var nameRegexp = /([A-z0-9]+:[0-9]+\/[A-z0-9]+)\/([A-z0-9\-\_]+)-([A-z0-9\.\_]+):[0-9]+$/;
var nameRegexpWithAppend = /([A-z0-9]+:[0-9]+\/[A-z0-9]+)\/([A-z0-9\-\_]+)-([A-z0-9\.\_]+)-([A-z0-9\.\_]+):[0-9]+$/;
var nameRegexpLatest = /([A-z0-9]+:[0-9]+\/[A-z0-9]+)\/([A-z0-9\-\_]+)-([A-z0-9\.\_]+):[0-9latest]+$/;
var nameRegexpWithAppendLatest = /([A-z0-9]+:[0-9]+\/[A-z0-9]+)\/([A-z0-9\-\_]+)-([A-z0-9\.\_]+)-([A-z0-9\.\_]+):[0-9latest]+$/;



var stripTag = function(tagStr) {
  var expr = nameRegexp;
  var matchResult;
  var compare = tagStr;
  if (tagStr.match(nameRegexpWithAppend)) {
    expr = nameRegexpWithAppend;
  }
  if (tagStr.match(expr)) {
    matchResult = tagStr.match(expr);
    matchResult.shift();
    compare = matchResult[0] + '/' + matchResult[1] + '-' + matchResult[2];
  }
  else {
    expr = nameRegexpLatest;
    if (tagStr.match(nameRegexpWithAppendLatest)) {
      expr = nameRegexpWithAppendLatest;
    }
    matchResult = tagStr.match(expr);
    if (matchResult) {
      matchResult.shift();
      compare = matchResult[0] + '/' + matchResult[1] + '-' + matchResult[2];
    }
  }
  return compare;
};



var matchImageToContainer = function(container, results) {
  var result = _.find(results.containerDefinitions, function(cdef) {
    return _.find(cdef.specific.imageTags, function(tag) {
      return stripTag(tag) === stripTag(container.Image);
    });
  });
  return result;
};

function build(dockerSupport) {
  function fetchContainers(options, result, done) {
    var queryContainers = dockerSupport(options).queryContainers;
    var topologyContainers = result.topology.containers;
    var newTopology = {};

    async.eachSeries(_.values(topologyContainers), function(instance, cb) {

      function genContainer(container) {
        var cdef = matchImageToContainer(container, result);
        if (!cdef) {
          return;
        }

        if (_.find(instance.contains, function(c) { return c === container.Id; })) {
          return;
        }

        if (instance.type === 'process') {
          return;
        }
        instance.contains.push(container.Id);

        var cont = {
          id: container.Id,
          containerDefinitionId: cdef.id,
          containedBy:  instance.id,
          contains: [],
          specific: {
            dockerImageId: cdef.specific.dockerImageId,
            dockerContainerId: container.Id,
            containerBinary: '',
            imageTag: cdef.specific.imageTag,
            buildNumber: 0,
            version: ''
          }
        };

        if (container.Ports) {
          cont.specific.ports = container.Ports;
        }
        newTopology[cont.id] = cont;
      }

      queryContainers(instance.specific.privateIpAddress, function(err, containers) {
        if (err) {
          return cb(err);
        }

        if (options.dockerFilters && options.dockerFilters.length > 0) {
          _.each(containers, function(container) {
            _.each(options.dockerFilters, function(filter) {
              if (container.Image.indexOf(filter) !== -1) {
                genContainer(container);
              }
            });
          });
        }
        else {
          _.each(containers, genContainer);
        }
        cb();
      });
    }, function() {
      _.merge(result.topology.containers, newTopology);
      done();
    });
  }

  return fetchContainers;
}

module.exports = build;

