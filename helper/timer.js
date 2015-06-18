function Timer(interval, callback, context, socket) {
  var _id = null,
      _running = false,
      _interval = interval || 30,
      _callback = callback || function() {},
      _socket = socket || null;

  this.start = function() {
    _id = setInterval(function() {
      _callback.call(context, _socket);
    }, _interval * 1000);
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