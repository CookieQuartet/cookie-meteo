require('datejs');
require('datejs/src/i18n/es-AR.js');

var sPort = require("serialport");
var SerialPort = sPort.SerialPort;

var timeoutId = null;

function reconnectSerialPort(port, onDataCallback, onOpenCallback, _config) {
  console.log('INICIANDO RECONEXION');
  _config.config().then(function(config) {
    timeoutId = setTimeout(function(){
      console.log('RECONECTANDO...');
      connectSerialPort(config.port, onDataCallback, onOpenCallback, _config);
    }, 2000);
  });
}

function connectSerialPort(port, onDataCallback, onOpenCallback, config) {
  var _self = this,
      _config = config,
      serialPort = new SerialPort(port, {
        baudRate: 115200,
        parser: sPort.parsers.readline("\n")
      });
  serialPort.on('open', function() {
    console.log('CONECTADO');
    clearTimeout(timeoutId);
    if(typeof onOpenCallback === 'function') {
      onOpenCallback.call(_self, data);
    }
    serialPort.on('data', function(data) {
      if(typeof onDataCallback === 'function') {
        onDataCallback.call(_self, data.replace(/[\r\n]/g, ''));
        console.log((new Date).toString('yyyy/MM/dd HH:mm:ss') + ' <-- ' + data.replace(/[\r\n]/g, ''));
      }
    });
  });
  serialPort.on('close', function(){
    console.log('PUERTO CERRADO');
    reconnectSerialPort(port, onDataCallback, onOpenCallback, _config);
  });
  serialPort.on('error', function (err) {
    console.error("ERROR", err);
    reconnectSerialPort(port, onDataCallback, onOpenCallback, _config);
  });
  return serialPort;
}

module.exports = connectSerialPort;



