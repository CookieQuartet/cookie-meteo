angular.module('CookieMeteoServices', [])
  .factory('MeteoConfig', function($socket, $q) {
      $socket.on('server:data', function (data) {
        console.log(data);
      });
      $socket.on('server:set_config', function (data) {
        console.log(data);
        if(typeof data !== 'undefined') {
          config.server = data;
          defer.resolve(true);
        } else  {
          defer.resolve(false);
        }
      });
      $socket.on('server:login', function (data) {
        console.log(data);
        config.user = data;
      });
      var config = {
        user: null,
        server: null
      };
      var defer = $q.defer();
      var started = defer.promise;
      var service =  {
        login: function(login) {
          started.then(function(started){
            if(started) {
              $socket.emit('client:login', login);
            }
          });
        },
        send: function(event, data) {
          return $socket.emit(event, data);
        },
        request: function() {
          $socket.emit('client:request', { command: 'RDAS' });
        }
      };
      $socket.emit('client:get_config');
      return service;
  });