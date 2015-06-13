angular.module('CookieMeteo')
    .controller('MainController', function($scope, $timeout, $mdSidenav, $mdUtil, $log, $socket) {
      $socket.on('data', function (data) {
        console.log(data);
      });
    });
