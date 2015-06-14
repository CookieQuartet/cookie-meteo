var Parse = require('./parse');
var _ = require('lodash');
var Q = require('q');

var app = new Parse({
  app_id:"iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH",
  //master_key:"U1lv9HnU3QCvRaKibxC2GUfC3iaEMbY8eojxf5Z5"
  api_key: "utg0CdEubwtz0m2meWqPRnh1nOnyMBFVMGG3aoNN"
});

var ServerConfig = function() {
  var self = this,
      config = {
        id: 'configObject',
        estacion: {
          sensores: {
            temperatura: {
              thresholdMax: 50,
              thresholdMin: 0,
              active: true,
              channel: 0,
              transfer: {
                a: 10,
                b: 20,
                c: 30
              }
            },
            viento: {
              thresholdMax: 50,
              thresholdMin: 0,
              active: true,
              channel: 1,
              transfer: {
                a: 10,
                b: 20,
                c: 30
              }
            },
            humedad: {
              thresholdMax: 50,
              thresholdMin: 0,
              active: true,
              channel: 2,
              transfer: {
                a: 10,
                b: 20,
                c: 30
              }
            }
          }
        }
      };
  // registro del login en Parse
  this.login = function(login, cb) {
    app.loginUser(login.username, login.password, function(err, response) {
      cb.call(this, response);
    });
  };
  // chequeo de usuario con sesion iniciada
  this.checkLogged = function(token, cb) {
    app.me(token, function (error, response) {
      cb.call(this, response);
    });
  };
  // cierre de sesion en Parse
  this.logout = function(token, cb) {
    app.logout(token, cb);
  };
  // el server obtiene la configuracion inicial
  this.init = function() {
    var defer = Q.defer();
    this.getConfig(defer);
    return defer.promise;
  };
  // obtiene la configuracion de Parse
  this.getConfig = function(defer) {
    var self = this,
        _defer = defer;
    app.find('Config', { where: { id: 'configObject' } }, function (err, response) {
      if(typeof response !== 'undefined') {
        config = _.merge(config, response.results[0]);
        _defer.resolve(config);
      }
    });
  };
  // guarda la configuracion en Parse
  this.setConfig = function(cfg) {
    config = _.merge(config, cfg);
    app.find('Config', { objectId: config.objectId }, function (err, response) {
      if(!err) {
        app.update('Config', response.objectId, config, function (err, response) {
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
  // devuelve la configuracion
  this.config = function() {
    return _.clone(config);
  };
  // inicializacion
  this.init().then(function() {
    //self.setConfig({});
  });
};

module.exports = ServerConfig;