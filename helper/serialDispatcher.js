var _ = require('lodash');
var SerialPortFactory = require('./serialPortFactory');
var transformData = require('./transformData');

function SerialDispatcher(serverConfig) {
  var _self = this;
  var _serialPort = new SerialPortFactory();
  function ConnHandler() {
      this.sockets = {};
      this.selectedSocket = null;
      this.addSocket = function(socket) {
          this.sockets[socket.id] = socket;
      };
      this.removeSocket = function(id) {
          delete this.sockets[id];
      };
      this.broadcast = function(event) {
          _.each(this.sockets, function(socket) {
              socket.emit(event.type, event.data);
          });
      };
      this.emit = function(event) {
        if(this.selectedSocket) {
          this.selectedSocket.emit(event.type, event.data);
        }
      }
  }
  function init() {
    // seleccion de puertos, siempre selecciona todos
    _serialPort.open(function (error) {
      _serialPort.write('SCAN02' + "\n");
    });
    /*
    _serialPort.on('data', function(data) {
      var _data;
      if(data.indexOf(';') >= 0) {
        _data = {
          type: 'server:data',
          data: {
            message: 'Datos obtenidos',
            data: _.chain(data.split(';'))
                .remove(function (item) {
                  return item.length !== 0;
                })
                .map(function (item) {
                  return parseInt(item)
                })
                .value()
          }
        };
      } else {
        _data = {
          type: 'server:data',
          data: {
            message: data
          }
        };
      }
      _self.connHandler.emit(_data);
    });
    */
    _serialPort.on('data', function(data) {
      var _data;
      if(data.indexOf(';') >= 0) {
        // son datos para enviar a los clientes
        var values = _.chain(data.split(';'))
              .remove(function (item) { return item.length !== 0; })
              .map(function (item) { return parseInt(item) })
              .value();
        var responseValues = (function() {
              var response = {},
                  sensores = _.filter(serverConfig.config().estacion.sensores, { active: true });
              _.each(sensores, function(sensor) {
                response[sensor.id] = transformData(values[sensor.channel], sensor.transfer, sensor.thresholds)
              });
              return response;
            })();

        _data = {
          type: 'server:data',
          data: {
            message: 'Datos obtenidos',
            data: responseValues
          }
        };
        _self.connHandler.broadcast(_data);
      } else {
        _data = {
          type: 'server:data',
          data: {
            message: data
          }
        };
        _self.connHandler.emit(_data);
      }

    });
  }
  this.connHandler = new ConnHandler();
  this.requests = [];
  this.addRequest = function(socket, request) {
      _self.requests.push({socket: socket, request: request });
  };
  this.wakeUp = function() {
      if(_self.requests.length) {
          _self.processQueue();
      }
  };
  this.processRequest = function(requestItem) {
      _serialPort.open(function (error) {
          var command = requestItem.request.command,
              value = requestItem.request.params ? requestItem.request.params: '';
          if ( error ) {
              console.log('failed to open: '+ error);
          } else {
              _self.connHandler.selectedSocket = requestItem.socket;
              _serialPort.write(command + value + "\n");
          }
      });
  };
  this.processQueue = function() {
      while(_self.requests.length > 0) {
          _self.processRequest(_self.requests.pop())
      }
  };
  this.destroy = function() {
      _serialPort.close();
  };
  init();
}

module.exports = SerialDispatcher;