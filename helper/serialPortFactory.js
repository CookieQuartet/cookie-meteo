require('datejs');
require('datejs/src/i18n/es-AR.js');

var sPort = require("serialport");
var SerialPort = sPort.SerialPort;

var timeoutId = null;

function reconnectSerialPort(port, onDataCallback) {
  console.log('INICIANDO RECONEXION');
  timeoutId = setTimeout(function(){
    console.log('RECONECTANDO...');
    connectSerialPort(port, onDataCallback);
  }, 2000);
}

function connectSerialPort(port, onDataCallback, onOpenCallback) {
  var _self = this,
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
    reconnectSerialPort(port, onDataCallback);
  });
  serialPort.on('error', function (err) {
    console.error("ERROR", err);
    reconnectSerialPort(port, onDataCallback);
  });
  return serialPort;
}

module.exports = connectSerialPort;



