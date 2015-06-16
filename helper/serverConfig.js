var Parse = require('./parse');
var _ = require('lodash');
var Q = require('q');

var app = new Parse({
  app_id:"iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH",
  api_key: "utg0CdEubwtz0m2meWqPRnh1nOnyMBFVMGG3aoNN"
});

var ServerConfig = function() {
  var self = this,
      config = {
        id: 'configObject',
        interval: 60000, // un minuto
        estacion: {
          sensores: {
            temperatura: {
              active: true,
              channel: 0,
              thresholds: {
                max: 50,
                min: 0
              },
              transfer: {
                a: 1,
                b: 20,
                c: 30
              }
            },
            viento: {
              active: true,
              channel: 0,
              thresholds: {
                max: 50,
                min: 0
              },
              transfer: {
                a: 10,
                b: 20,
                c: 30
              }
            },
            humedad: {
              active: true,
              channel: 0,
              thresholds: {
                max: 50,
                min: 0
              },
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
    var defer = Q.defer();
    app.find('Config', { objectId: config.objectId }, function (err, response) {
      if(!err) {
        app.update('Config', response.objectId, config, function (err, response) {
          if(!err) {
            console.log('Objeto de configuración actualizado correctamente', response);
            defer.resolve(response);
          }
        });
      }
    });
    return defer.promise;
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
    /*
    self.setConfig({
      id: 'configObject',
      interval: 60000,
      estacion: {
        sensores: {
          temperatura: {
            id: 'temperatura',
            active: true,
            channel: 0,
            thresholds: {
              max: 50,
              min: 0
            },
            transfer: {
              a: 0,
              b: 51.28,
              c: -20.5128
            }
          },
          viento: {
            id: 'viento',
            active: true,
            channel: 1,
            thresholds: {
              max: 216,
              min: 1.08
            },
            transfer: {
              a: 0,
              b: 17.784,
              c: 0.828
            }
          },
          humedad: {
            id: 'humedad',
            active: true,
            channel: 2,
            thresholds: {
              max: 50,
              min: 0
            },
            transfer: {
              a: 0,
              b: 1,
              c: 0.5
            }
          }
        }
      }
    });
    */
  });

  //this.set('Config', config);
};

module.exports = ServerConfig;
