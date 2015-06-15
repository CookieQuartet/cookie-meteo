var _ = require('lodash');
var sPort = require("serialport");
var SerialPort = sPort.SerialPort;

function SerialPortFactory(params) {
  var _instance,
      _address = (params && params.address) || '/dev/tty.wchusbserial14550',
      _start = (params && params.start) || false,
      _options = _.extend({
        baudrate: 115200,
        parser: sPort.parsers.readline("\n")
      }, (params && params.options) || {});
  try {
    _instance = new SerialPort(_address, _options, _start);
    return _instance;
  } catch(e) {
    return false;
  }
}

module.exports = SerialPortFactory;