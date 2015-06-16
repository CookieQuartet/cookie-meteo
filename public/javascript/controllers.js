angular.module('CookieMeteo')
  .controller('MainController', function($scope, $state, $rootScope, $timeout, MeteoConfig) {
    $scope.$state = $state;

    $rootScope.$on('login', function(event) {
      $scope.config = {
        username: localStorage.getItem('cookie-meteo-username'),
        sessionToken: localStorage.getItem('cookie-meteo-session-token')
      };
    });

    $rootScope.$on('logout', function(event) {
      MeteoConfig.logout();
      $scope.config = {
        username: null,
        sessionToken: null
      };
      $state.go('client');
    });

    $rootScope.$on('acqStatus', function(event, data) {
      $scope.config.acquiring = data.status;
    });

    $rootScope.$on('startAcq', function(event, data) {
      MeteoConfig.startAcq();
    });

    $rootScope.$on('stopAcq', function(event, data) {
      MeteoConfig.stopAcq();
    });

    $scope.config = {
      username: localStorage.getItem('cookie-meteo-username'),
      sessionToken: localStorage.getItem('cookie-meteo-session-token'),
      acquiring: false
    };

  });
