var Parse = require('./parse');
var _ = require('lodash');
var Q = require('q');

var app = new Parse({
  app_id:"iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH",
  api_key: "utg0CdEubwtz0m2meWqPRnh1nOnyMBFVMGG3aoNN"
});

var ServerConfig = function(mailer) {
  var firstTime = true,
      config = {
        id: 'configObject',
        interval: 60, // un minuto
        mailAlarm: 'mmaestri@gmail.com',
        sendAlarms: true,
        port: '/dev/tty.wchusbserial1410',
        estacion: {
          "sensores": {
            "temperatura": {
              "active": true,
              "alarmIncluded": true,
              "channel": 0,
              "id": "temperatura",
              "thresholds": {
                "max": 50,
                "min": 0
              },
              "transfer": {
                "a": 0,
                "b": 51.28,
                "c": -20.51
              },
              "units": "ºC"
            },
            "viento": {
              "active": true,
              "alarmIncluded": true,
              "channel": 1,
              "id": "viento",
              "thresholds": {
                "max": 216,
                "min": 1.08
              },
              "transfer": {
                "a": 0,
                "b": 17.784,
                "c": 0.828
              },
              "units": "km/h"
            },
            "humedad": {
              "active": true,
              "alarmIncluded": true,
              "channel": 2,
              "id": "humedad",
              "thresholds": {
                "max": 50,
                "min": 0
              },
              "transfer": {
                "a": 0,
                "b": 29.411,
                "c": -22.058
              },
              "units": "%"
            }
          },
          "alarmas": {
            "lowBattery": true,
            "openDoor": true
          },
          "luces": {
            "on": true,
            "manual": false,
            "start": "1970-01-01T21:00:00.000Z",
            "stop": "1970-01-01T11:00:00.000Z"
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
            defer.resolve(response);
            config = _.merge(config, response);
            firstTime = false;
          }
        });
      }
    });
    return defer.promise;
  };
  // devuelve la configuracion
  this.config = function() {
    if(firstTime) {
      return result;
    } else {
      var defer = Q.defer();
      defer.resolve(_.clone(config));
      return defer.promise;
    }
  };
  this.sendMail = function(alarms) {
    var destination = config.mailAlarm,
        subject = 'Estación metereológica - Alarmas',
        template = '<h1>Estación metereológica</h1>\n' +
            '<% _.each(alarms, function(item) { %>' +
            '<p><%=item.date%> : <%=item.message%></p><br>' +
            '<% }); %>',
        compiled = _.template(template),

        content = compiled({ alarms: alarms }).replace(/\|/g, '\n');

    // habilitar cuando haya que hacer la demostracion
    mailer.sendEmail(destination, subject, content);
  };
  // inicializacion
  var result = this.init();
  result.then(function() {
    /*
    self.setConfig({
      id: 'configObject',
      interval: 60, // un minuto
      mailAlarm: 'mmaestri@gmail.com',
      sendAlarms: true,
      port: '/dev/tty.wchusbserial1410',
      estacion: {
        "sensores": {
          "temperatura": {
            "active": true,
            "alarmIncluded": true,
            "channel": 0,
            "id": "temperatura",
            "thresholds": {
              "max": 50,
              "min": 0
            },
            "transfer": {
              "a": 0,
              "b": 51.28,
              "c": -20.51
            },
            "units": "ºC"
          },
          "viento": {
            "active": true,
            "alarmIncluded": true,
            "channel": 1,
            "id": "viento",
            "thresholds": {
              "max": 216,
              "min": 1.08
            },
            "transfer": {
              "a": 0,
              "b": 17.784,
              "c": 0.828
            },
            "units": "km/h"
          },
          "humedad": {
            "active": true,
            "alarmIncluded": true,
            "channel": 2,
            "id": "humedad",
            "thresholds": {
              "max": 50,
              "min": 0
            },
            "transfer": {
              "a": 0,
              "b": 29.411,
              "c": -22.058
            },
            "units": "%"
          }
        },
        "alarmas": {
          "lowBattery": true,
          "openDoor": true
        },
        "luces": {
          "on": true,
          "manual": false,
          "start": "1970-01-01T21:00:00.000Z",
          "stop": "1970-01-01T11:00:00.000Z"
        }
      }
    });
    */
  });
  return this;
};

module.exports = ServerConfig;
