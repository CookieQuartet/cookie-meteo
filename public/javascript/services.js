angular.module('CookieMeteoServices', [])
  .factory('MeteoConfig', function($socket) {
      $socket.on('data', function (data) {
        console.log(data);
      });
      $socket.on('server:config', function (data) {
        console.log(data);
      });
      $socket.emit('client:config');

      return {
        send: function(event, data) {
          return $socket.emit(event, data);
        },
        init: function() {
          $socket.emit('client:config');
        }
      }
  });