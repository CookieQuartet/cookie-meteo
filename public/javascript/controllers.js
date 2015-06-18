angular.module('CookieMeteo')
  .controller('MainController', function($scope, $state, $rootScope, $timeout, MeteoConfig, $mdToast) {
    $scope.$state = $state;
    $scope.config = {
      username: localStorage.getItem('cookie-meteo-username'),
      sessionToken: localStorage.getItem('cookie-meteo-session-token'),
      acquiring: false
    };
    $scope.methods = {
      toast: function(text) {
        $mdToast.show(
          $mdToast.simple()
            .content(text)
            .position('left top')
            .hideDelay(2000)
        );
      }
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
    // aviso de configuracion modificada
    $rootScope.$on('config_changed', function(event) {
      $scope.methods.toast('La configuración se guardó con éxito!')
    })
  });
