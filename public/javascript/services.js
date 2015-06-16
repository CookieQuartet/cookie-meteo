angular.module('CookieMeteoServices', [])
  .factory('MeteoConfig', function($socket, $q, $rootScope) {
      var config = {
            user: null,
            server: null
          };
      var defer = $q.defer(),
          loginDefer;
      var started = defer.promise;

      $socket.on('server:data', function (data) {
        console.log(data);
        $rootScope.$broadcast('server:data', data);
      });
      $socket.on('server:set_config', function (data) {
        if(typeof data !== 'undefined') {
          config.server = data;
          defer.resolve(true);
        } else  {
          defer.resolve(false);
        }
      });
      $socket.on('server:checkLogged', function (data) {
        config.user = data;
        loginDefer.resolve(data);
      });
      $socket.on('server:login', function (data) {
        config.user = data;
        loginDefer.resolve(data);
      });
      $socket.on('server:logout', function (data) {
        config.user = null;
        localStorage.removeItem('cookie-meteo-username');
        localStorage.removeItem('cookie-meteo-session-token');
        //$rootScope.$broadcast('logout');
      });
      $socket.on('server:set_acq_status', function(status) {
        $rootScope.$broadcast('acqStatus', { status: status });
      });
      var service =  {
        login: function(login) {
          loginDefer = $q.defer();
          started.then(function(started){
            if(started) {
              $socket.emit('client:login', login);
            }
          });
          return loginDefer.promise;
        },
        logout: function() {
          $socket.emit('client:logout', { token: localStorage.getItem('cookie-meteo-session-token') });
        },
        send: function(event, data) {
          $socket.emit(event, data);
        },
        request: function() {
          //$socket.emit('client:request', { command: 'RDAS' });
          $socket.emit('client:requestData');
        },
        checkLogged: function(token) {
          loginDefer = $q.defer();
          $socket.emit('client:checkLogged', { token: token });
          return loginDefer.promise;
        },
        startAcq: function(status) {
          $socket.emit('client:startAcq');
        },
        stopAcq: function(status) {
          $socket.emit('client:stopAcq');
        }
      };
      $socket.emit('client:get_config');
      $socket.emit('client:get_acq:status');
      $socket.emit('client:request', { command: 'RDAS' });
      return service;
  });