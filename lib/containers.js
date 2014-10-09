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

var matchImageToContainer = function(container, results) {
  var result = _.find(results.containerDefinitions, function(cdef) {
    return _.find(cdef.specific.imageTags, function(tag) {
      if (tag === container.Image) {
        cdef.specific.imageTag = tag;
        cdef.name = tag;
      }
      return tag === container.Image;
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
        if (cdef) {
          instance.contains.push(container.Id);
          newTopology[container.Id] = {id: container.Id,
                                       containerDefinitionId: cdef.id,
                                       containedBy:  instance.id,
                                       contains: [],
                                       specific: {dockerImageId: cdef.specific.dockerImageId,
                                                  dockerContainerId: container.Id,
                                                  containerBinary: '',
                                                  dockerLocalTag: '',
                                                  buildNumber: 0,
                                                  version: ''}};
        }
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
