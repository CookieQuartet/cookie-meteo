require('datejs');
Date.i18n.setLanguage('es-AR');

var _ = require('lodash');
var Q = require('q');

var SerialPortFactory = require('./serialPortFactory');
var transformData = require('./transformData');

function SerialDispatcher(serverConfig) {
  var _self = this,
      _callback = function() {},
      _running = false,
      _samplesMaxErrorCount = 5,
      _samplesTimeoutId;

  function ConnHandler() {
    this.sockets = {};
    this.selectedSocket = null;
    //this.actual = null;
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
  function processRawData(data) {
    var defer = Q.defer();
    serverConfig.config().then(function(sConfig) {
      var values = _.chain(data.replace(/\r/g, '').split(';'))
            .remove(function (item) { return item.length !== 0; })
            .map(function (item) { return parseInt(item) })
            .value(),
          response = {},
          sensores = sConfig.estacion.sensores;
      _.each(sensores, function(sensor) {
        response[sensor.id] = transformData(values[sensor.channel], sensor.transfer, sensor.thresholds)
      });
      processAlarms(values[3]);
      defer.resolve(response);
    });
    return defer.promise;
  }
  function convertInterval(interval) {
        // segun esta expresado en los comandos, 1 seg = 100 unidades
    var _interval = interval * 100,
        // obtengo la representacion en string
        __interval = String(_interval),
        // cuento la cantidad de caracteres
        count = __interval.length,
        // me fijo cuantos ceros me faltan
        missing = 5 - count;
    // agrego los ceros que faltan
    for(var i = 0; i < missing; i++) {
      __interval = '0' + __interval;
    }
    return __interval;
  }
  function samplingError() {
    var date = (new Date).toString('yyyy/MM/dd HH:mm:ss');
    console.log(date + ' --- Error de muestreo');
    serverConfig.sendMail([{
      type: 'SAMPLING_ERROR',
      message: 'Error de muestreo',
      date: date
    }]);
    // envio las alarmas a los clientes conectados
    _self.connHandler.broadcast({
      type: 'server:alarm',
      data: {
        type: 'SAMPLING_ERROR',
        message: 'Error de muestreo'
      }
    });
    _self.stopAdq();
  }
  function startTimeout() {
    serverConfig.config().then(function(config) {
      _samplesTimeoutId = setTimeout(samplingError, config.interval * 1000 * _samplesMaxErrorCount)
    });
  }
  function stopTimeout() {
    clearTimeout(_samplesTimeoutId);
  }
  function processData(data) {
    stopTimeout();
    // si se desconecto por mucho tiempo, queda desfasado. si estaba adquiriendo datos, lo detengo
    if(!_running) {
      _self.stopAdq();
    }
    processRawData(data).then(function(_data) {
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
      startTimeout();
    });
  }
  function processAlarms(code) {
    serverConfig.config().then(function(sConfig) {
      var alarms = [];
      if(code > 0) {
        // es una alarma
        var _general = sConfig.sendAlarms,
            _alarmas = sConfig.estacion.alarmas,
            _date = (new Date).toString('yyyy/MM/dd HH:mm:ss');
        if (code === 3) {
          if (_general && _alarmas.openDoor) {
            alarms.push({type: 'OPEN_DOOR', message: 'Puerta abierta', date: _date})
          }
          if (_general && _alarmas.lowBattery) {
            alarms.push({type: 'LOW_BATTERY', message: 'Celda solar desconectada', date: _date})
          }
        } else if (code == 2 && _general && _alarmas.openDoor) {
          alarms.push({type: 'OPEN_DOOR', message: 'Puerta abierta', date: _date})
        } else if (code == 1 && _general && _alarmas.lowBattery) {
          alarms.push({type: 'LOW_BATTERY', message: 'Celda solar desconectada', date: _date})
        }
        if(_general) {
          // envio mail
          serverConfig.sendMail(alarms);
          // envio las alarmas a los clientes conectados
          _self.connHandler.broadcast({
            type: 'server:alarm',
            data: {
              message: alarms
            }
          });
        }
      }
    });
  }
  function processCommands(data) {
    _self.connHandler.emit({
      type: 'server:data',
      data: {
        message: data
      }
    });
  }
  function write(message) {
    var defer = Q.defer();
    _self._serialPort.write(message, function(err, results) {
      _self._serialPort.drain(function() {
        defer.resolve({ err: err, results: results });
      });
    });
    return defer.promise;
  }
  function init() {
    var defer = Q.defer();
    serverConfig.config().then(function(config) {
      _self._serialPort = SerialPortFactory(config.port, onDataCallback);
      _self._serialPort.on('open', function(){
        // detener adquisicion si la placa estaba en eso
        _self.addGlobalRequest({ command: 'DETA' });
        // incluir todos los canales analogicos
        _self.addGlobalRequest({ command: 'SCAN', params: '02'});
        // incluir canales digitales
        _self.addGlobalRequest({ command: 'CLDIS', dont_wait: true });
        // procesar los comandos
        _self.processQueue();
      });
    });
    return defer.promise;
  }
  function onDataCallback(data) {
    if(data.indexOf(';') >= 0) {
      // son datos para enviar a los clientes
      processData(data);
    } else if(data.replace(/\r/g, '').length === 1) {
      // lectura de entradas digitales
      processAlarms(parseInt(data.replace(/\r/g, '')));
    } else {
      // respuesta de un comando
      processCommands(data);
    }
    _self.processQueue();
  }

  this._serialPort = null;
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
  this.addGlobalRequest = function(request) {
    _self.requests.push({ request: request });
  };
  this.processRequest = function(requestItem) {
    if(_self._serialPort && requestItem) {
      var command = requestItem.request.command,
          value = requestItem.request.params ? requestItem.request.params: '';
      // si el origen es un socket, la respuesta debe ir a ese socket
      _self.connHandler.selectedSocket = requestItem.socket ? requestItem.socket : null;
      // enviar el comando a la interface serie
      write(command + value + "\n").then(function(response) {
        console.log((new Date).toString('yyyy/MM/dd HH:mm:ss') + ' --> Comando enviado: ' + command + value + ' (' + response.results + ' caracteres)');
        // algunos comandos no tienen respuesta, por lo tanto no hay que esperarlos para continuar
        if(requestItem.request.dont_wait) {
          _self.processQueue();
        }
      });
    }
  };
  this.processQueue = function() {
    console.log((new Date).toString('yyyy/MM/dd HH:mm:ss') + ' --- pending ' + _self.requests.length + ' requests');
    if(_self.requests.length > 0) {
      _self.processRequest(_self.requests.shift());
    }
  };
  this.iden = function(socket) {
    _self.addRequest(socket, { command: 'IDEN' });
    _self.processQueue();
  };
  this.startAdq = function() {
    serverConfig.config().then(function(config) {
      // incluir todos los canales analogicos
      _self.addGlobalRequest({ command: 'SCAN', params: '02'});
      // incluir entradas digitales
      _self.addGlobalRequest({ command: 'CLDIS', dont_wait: true });
      // iniciar adquisicion
      _self.addGlobalRequest({ command: 'INIL', params: convertInterval(config.interval) });
      // procesar los comandos
      _self.processQueue();
      // avisar a todos
      _self.connHandler.broadcast({ type:'server:set_acq_status', data:true });
      _running = true;
    });
  };
  this.stopAdq = function() {
    clearTimeout(_samplesTimeoutId);
    _self.addGlobalRequest({ command: 'DETA' });
    _self.processQueue();
    _self.connHandler.broadcast({ type:'server:set_acq_status', data:false });
    _running = false;
  };
  this.restart = function() {
    _self._serialPort.close();
  };
  this.init = function() {
    init();
  };
  this.running = function() {
    return _running;
  };
  this.turnOn = function() {
    _self.addGlobalRequest({ command: 'WRDO', params: '0' });
    _self.processQueue();
    _self.connHandler.broadcast({ type: 'server:lights', data: true });
  };
  this.turnOff = function() {
    _self.addGlobalRequest({ command: 'WRDO', params: '3' });
    _self.processQueue();
    _self.connHandler.broadcast({ type: 'server:lights', data: false });
  }
}

module.exports = SerialDispatcher;