var Parse = require('./parse');
var _ = require('lodash');
var Q = require('q');

var app = new Parse({
  app_id:"iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH",
  master_key:"U1lv9HnU3QCvRaKibxC2GUfC3iaEMbY8eojxf5Z5"
});

var ServerConfig = function() {
  var config = {
    id: 'configObject'
  };

  // registro del login en Parse
  this.login = function(login, cb) {
    var _cb = cb;
    app.loginUser(login.username, login.password, function(err, response) {
      _cb.call(this, response);
    });
  };

  // el server obtiene la configuracion inicial
  this.init = function() {
    this.getConfig();
  };

  // obtiene la configuracion de Parse
  this.getConfig = function() {
    var self = this;
    app.find('Config', { where: { id: 'configObject' } }, function (err, response) {
      //console.log(response);
      if(typeof response !== 'undefined') {
        config = _.extend(config, response.results[0]);
      }
    });
  };

  // guarda la configuracion en Parse
  this.setConfig = function(cfg, insert) {
    config = _.extend(config, cfg);
    app.find('Config', { objectId: config.objectId }, function (err, response) {
      if(!err) {
        app.update('Config', response[0].objectId, config, function (err, response) {
          if(!err) {
            console.log('Objeto de configuración actualizado correctamente', response);
          }
        });
      }
    });
  };

  this.set = function(key, value) {
    app.insert(key, value, function (err, response) {
      console.log(response);
    });
  };

  this.get = function(type, key) {
    var defer = Q.defer();
    app.find(type, {objectId: key}, function (err, response) {
      defer.resolve(response);
    });
    return defer.promise;
  };

  this.init();
};

module.exports = ServerConfig;