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

var _ = require('lodash');

function build(system) {

  var mapEnvPorts = function(environment, ports) {
    if (environment.SERVICE_PORT) {
      ports.push(environment.SERVICE_PORT);
    }
  };



  var mapArgPorts = function(args, ports) {
    var re = /-p [0-9]+:[0-9]+/g;

    var res = args.match(re);
    _.each(res, function(r) {
      var s = /-p ([0-9]+):[0-9]+/.exec(r);
      ports.push(s[1]);
    });
  };



  var mapDockerPorts = function(dockerPorts, ports) {
    _.each(dockerPorts, function(dp) {
      ports.push(dp.PublicPort);
    });
  };



  var findVms = function(_sys) {
    var vms = [];
    _.each(_sys.topology.containers, function(c) {
      if (c.contains && c.contains.length === 0) {
        if (c.containedBy && _sys.topology.containers[c.containedBy]) {
          vms.push(_sys.topology.containers[c.containedBy]);
        }
      }
    });
    return _.uniq(vms);
  };



  var createCompareList = function(vms, sys) {
    var list = [];
    _.each(vms, function(vm) {
      _.each(vm.contains, function(c) {
        var obj = {id: c,
                   containedBy: sys.topology.containers[c].containedBy,
                   containerDefinitionId: sys.topology.containers[c].containerDefinitionId,
                   ports: []};

        if (sys.topology.containers[c].specific && sys.topology.containers[c].specific.environment) {
          mapEnvPorts(sys.topology.containers[c].specific.environment, obj.ports);
        }

        if (sys.topology.containers[c].specific && sys.topology.containers[c].specific.execute && sys.topology.containers[c].specific.execute.args) {
          mapArgPorts(sys.topology.containers[c].specific.execute.args, obj.ports);
        }

        if (sys.topology.containers[c].specific && sys.topology.containers[c].specific.ports) {
          mapDockerPorts(sys.topology.containers[c].specific.ports, obj.ports);
        }

        list.push(obj);
      });
    });
    return list;
  };



  /**
   * pull matching ids from the system definition into the analyzed system topology
   * only for docker type containers
   */
  var matchTopologyIds = function(analyzed) {
    var svms = findVms(system);
    var avms = findVms(analyzed);
    var sysCompareList = createCompareList(svms, system);
    var anCompareList = createCompareList(avms, analyzed);

    _.each(anCompareList, function(an) {
      var sys = _.find(sysCompareList, function(sys) {
        // we need to check for prefix to support autoscaling groups

        if (an.containedBy.indexOf(sys.containedBy) >= 0 && sys.containerDefinitionId === an.containerDefinitionId) {
          var match = false;
          if (sys.ports.length > 0) {
            _.each(sys.ports, function(sysPort) {
              if (_.find(an.ports, function(anPort) { return '' + sysPort === '' + anPort; })) {
                match = true;
              }
            });
            return match;
          }
          else {
            return true;
          }
        }
        else {
          return false;
        }
      });

      if (sys) {
        if (an.id !== sys.id && analyzed.topology.containers[an.id]) {
          var oldId = analyzed.topology.containers[an.id].id;
          analyzed.topology.containers[an.id].id = sys.id;
          analyzed.topology.containers[sys.id] = analyzed.topology.containers[an.id]; // deep copy ??
          delete analyzed.topology.containers[an.id];
          sysCompareList = _.without(sysCompareList, sys);

          var nc = _.without(analyzed.topology.containers[an.containedBy].contains, oldId);
          nc.push(sys.id);
          analyzed.topology.containers[an.containedBy].contains = nc;
        }
      }
    });
    return analyzed;
  };

  var match = function match(opts, result, cb) {
    result = matchTopologyIds(result);

    if (cb) {
      cb(null, result);
    }

    return result;
  };

  return match;
}

module.exports = build;
