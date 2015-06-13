angular.module('CookieMeteo')
    .controller('MainController', function($scope, $timeout, $mdSidenav, $mdUtil, $log, MeteoConfig) {
      MeteoConfig.init();
    });
