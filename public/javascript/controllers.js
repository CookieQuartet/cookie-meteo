angular.module('CookieMeteo')
  .controller('MainController', function($scope, $state, $rootScope, $timeout, MeteoConfig) {
    $scope.$state = $state;
    $scope.config = {
      username: localStorage.getItem('cookie-meteo-username'),
      sessionToken: localStorage.getItem('cookie-meteo-session-token'),
      acquiring: false
    };

    // usuario hace login
    $rootScope.$on('login', function(event) {
      $scope.config = {
        username: localStorage.getItem('cookie-meteo-username'),
        sessionToken: localStorage.getItem('cookie-meteo-session-token')
      };
    });
    // usuario hace logout
    $rootScope.$on('logout', function(event) {
      MeteoConfig.logout();
      $scope.config = {
        username: null,
        sessionToken: null
      };
      $state.go('client');
    });
    // verificacion del estado de la adquisicion
    $rootScope.$on('acqStatus', function(event, data) {
      $scope.config.acquiring = data.status;
    });
    // iniciar adquisicion
    $rootScope.$on('startAcq', function(event, data) {
      MeteoConfig.startAcq();
    });
    // detener adquisicion
    $rootScope.$on('stopAcq', function(event, data) {
      MeteoConfig.stopAcq();
    });
  });
