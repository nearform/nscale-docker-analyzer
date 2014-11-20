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


function initFilters(config, system) {
  var cnames = _.map(system.containerDefinitions, function(cdef) { return {name: cdef.name, type: cdef.type}; });
  cnames = _.filter(cnames, function(name) { return name.type === 'docker'; });

  config.dockerFilters = config.dockerFilters || [];

  if (system.name) {
    if (!_.find(config.dockerFilters, function(filter) { return filter === system.name; })) {
      config.dockerFilters.push(system.name);
    }
  }

  _.each(cnames, function(name) {
    if (!_.find(config.dockerFilters, function(filter) { return filter === name.name; })) {
      if (system.name && name.name.indexOf(system.name) !== 0) {
        config.dockerFilters.push(name.name);
      }
    }
  });
}



function build(dockerSupport, config, system) {
  var fetchImages = require('./lib/images')(dockerSupport);
  var fetchContainers = require('./lib/containers')(dockerSupport);
  var match = require('./lib/match')(system);

  initFilters(config, system);

  function dockerAnalyzer(config, result, done) {
    async.eachSeries([
      fetchImages,
      fetchContainers,
      match
    ], function(func, cb) {
      func(config, result, function(err) {
        if (err) { return cb(err); }
        cb(null);
      });
    }, function(err) {
      if (err) { return done(err); }
      done(null, result);
    });
  }

  return dockerAnalyzer;
}

module.exports = build;

