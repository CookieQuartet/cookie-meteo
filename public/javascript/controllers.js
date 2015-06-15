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

    $scope.config = {
      username: localStorage.getItem('cookie-meteo-username'),
      sessionToken: localStorage.getItem('cookie-meteo-session-token')
    };

  });
