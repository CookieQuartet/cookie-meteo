require('datejs');
require('datejs/src/i18n/es-AR.js');

function Timer(name, interval, callback, context, socket) {
  var _id = null,
      _running = false,
      _interval = interval || 30,
      _callback = callback || function() {},
      _socket = socket || null,
      _name = name;

  function cb() {
    console.log((new Date).toString('yyyy/MM/dd HH:mm:ss') + ' -- ' + _name + ' tick');
    _callback.call(context, _socket);
  }

  this.start = function() {
    _id = setInterval(cb, (_interval * 1000));
    _running = true;
    return this;
  };
  this.setInterval = function(interval) {
    _interval = interval;
    return this;
  };
  this.setSocket = function(socket) {
    _socket = socket;
    return this;
  };
  this.setCallback = function(callback) {
    _callback = callback;
    return this;
  };
  this.stop = function() {
    clearInterval(_id);
    _running = false;
    return this;
  };
  this.running = function() {
    return _running;
  };

  return this;
}

module.exports = Timer;