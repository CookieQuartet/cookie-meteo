var _ = require('lodash');
var SerialPortFactory = require('./serialPortFactory');
var transformData = require('./transformData');

function SerialDispatcher(serverConfig) {
  var _self = this,
      _callback = function() {};
  this._serialPort = null;
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
  function processData(data) {
    var values = _.chain(data.split(';'))
        .remove(function (item) { return item.length !== 0; })
        .map(function (item) { return parseInt(item) })
        .value();
    return (function() {
      var response = {},
          sensores = _.filter(serverConfig.config().estacion.sensores, { active: true });
      _.each(sensores, function(sensor) {
        response[sensor.id] = transformData(values[sensor.channel], sensor.transfer, sensor.thresholds)
      });
      return response;
    })();
  }
  function init() {
    // seleccion de puertos, siempre selecciona todos
    _self._serialPort = new SerialPortFactory();
    _self._serialPort.open(function (error) {
        if(!error) {
            _self._serialPort.write('SCAN02' + "\n");
        }
    });
    _self._serialPort.on('data', function(data) {

      if(data.indexOf(';') >= 0) {
        // son datos para enviar a los clientes
        var _data = processData(data);
        // exportar la respuesta
        _callback({
          humedad: _data.humedad.value,
          viento: _data.viento.value,
          temperatura: _data.temperatura.value
        }).then(function(response) {
          _self.connHandler.broadcast({
            type: 'server:data',
            data: {
              message: 'Datos obtenidos',
              data: _.extend(_data, response)
            }
          });
        });
      } else {
        // son la respuesta de un comando
        _self.connHandler.emit({
          type: 'server:data',
          data: {
            message: data
          }
        });
      }
    });
  }
  this.connHandler = new ConnHandler();
  this.requests = [];
  this.setCallback = function(callback) {
    if(typeof callback === 'function') {
      _callback = callback;
    } else {
      console.log(callback, ' no es una funcion valida');
      _callback = function() {};
    }
  };
  this.addRequest = function(socket, request) {
    _self.requests.push({socket: socket, request: request });
  };
  this.wakeUp = function() {
    if(_self.requests.length) {
      _self.processQueue();
    }
  };
  this.processRequest = function(requestItem) {
    this._serialPort.open(function (error) {
          var command = requestItem.request.command,
              value = requestItem.request.params ? requestItem.request.params: '';
          if ( error ) {
              console.log('failed to open: '+ error);
          } else {
              _self.connHandler.selectedSocket = requestItem.socket;
            _self._serialPort.write(command + value + "\n");
          }
      });
  };
  this.processQueue = function() {
      while(_self.requests.length > 0) {
          _self.processRequest(_self.requests.pop())
      }
  };
  this.destroy = function() {
    _self._serialPort.close();
  };
  this.restart = function() {
    this.destroy();
    init();
  };
  init();
}

module.exports = SerialDispatcher;