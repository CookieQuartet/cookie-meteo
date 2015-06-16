function Timer(interval, callback, context) {
  var _id = null,
      _running = false,
      _interval = interval || 1000,
      _callback = callback || function() { };

  this.start = function() {
    _id = setInterval(function() {
      _callback.call(context);
    }, _interval);
    _running = true;
  };
  this.setInterval = function(interval) {
    _interval = interval;
  };
  this.setCallback = function(callback) {
    _callback = callback;
  };
  this.stop = function() {
    clearInterval(_id);
    _running = false;
  };
  this.running = function() {
    return _running;
  };

  return this;
}

module.exports = Timer;