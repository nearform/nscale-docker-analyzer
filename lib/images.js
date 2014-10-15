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

function build(dockerSupport) {
  /**
   * check this - important not to duplicate images in the container definitions section...
   */
  function fetchImages(options, result, done) {
    var topologyContainers    = result.topology.containers;
    var containerDefinitions  = result.containerDefinitions;
    var queryImages           = dockerSupport(options).queryImages;

    function genDefinition(image) {
      if (!_.find(containerDefinitions, function(cdef) { return cdef.id === image.Id; })) {
        containerDefinitions.push({id: image.Id,
                                   name: image.RepoTags[0],
                                   type: 'docker',
                                   specific: {repositoryUrl: '',
                                              buildScript: '',
                                              'arguments': '',
                                              buildHead: 0,
                                              dockerImageId: image.Id,
                                              imageTags: image.RepoTags,
                                              imageTag: image.RepoTags[0]}});
      }
    }

    async.eachSeries(_.values(topologyContainers), function(instance, cb) {
      queryImages(instance.specific.privateIpAddress, function(err, images) {
        if (err) {
          return cb(err);
        }

        if (options && options.dockerFilters && options.dockerFilters.length > 0) {
          _.each(images, function(image) {
            _.each(options.dockerFilters, function(filter) {
              if (image.RepoTags[0].indexOf(filter) !== -1) {
                genDefinition(image);
              }
            });
          });
        }
        else {
          _.each(images, genDefinition);
        }
        cb();
      });
    }, done);
  }

  return fetchImages;
}

module.exports = build;
