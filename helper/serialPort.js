var sPort = require("serialport");
var SerialPort = sPort.SerialPort;

var portAddress = process.platform === 'darwin' ? "/dev/tty.wchusbserial1410" : "COM3";

var serialPort = new SerialPort(portAddress, {
    baudrate: 115200,
    parser: sPort.parsers.readline("\n")
}, false);

module.exports = serialPort;