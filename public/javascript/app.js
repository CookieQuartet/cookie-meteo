angular.module('CookieMeteo', ['ngMaterial', 'ui.router', 'highcharts-ng', 'ngSocket', 'CookieMeteoServices'])
    .config(["$socketProvider", function ($socketProvider) {
      $socketProvider.setUrl("http://localhost:3001");
      Parse.initialize("iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH", "F3oYWOs8MGa6Ct5osHiLleyxUt1WFi6FdKeuaY2k");
    }])
    .config(function($stateProvider, $urlRouterProvider) {
      function checkLogged(scope, MeteoConfig, callback) {
        var username = localStorage.getItem('cookie-meteo-username') || null,
            token = localStorage.getItem('cookie-meteo-session-token') || null;
        MeteoConfig.checkLogged(token).then(function(userData) {
          callback.call(null, userData);
        });
      }

      $urlRouterProvider.otherwise("/");
      $stateProvider
          .state('admin', {
            url: "/admin",
            templateUrl: "partials/admin.html",
            controller: function($scope, MeteoConfig, $state) {
              checkLogged($scope, MeteoConfig, function(userData) {
                if(!userData || userData.username !== 'admin') {
                  $state.go('client');
                }
              });
              $scope.methods = {
                logout: function() {
                  MeteoConfig.logout();
                  $state.go('client');
                }
              }
            }
          })
          .state('login', {
            url: "/login",
            templateUrl: "partials/login.html",
            controller: function($scope, $state, MeteoConfig, $mdToast, $animate) {
              $scope.config = {
                user: {
                  login: {
                    username: '',
                    password: ''
                  },
                  data: null
                }
              };
              $scope.$state = $state;
              $scope.methods = {
                checkLogged: function() {
                  checkLogged($scope, MeteoConfig, function(userData) {
                    if(userData) {
                      $scope.config.user.data = userData;
                      switch(userData.username) {
                        case 'admin':
                          $state.go('admin');
                          break;
                        case 'guest':
                          $state.go('client');
                          break;
                      }
                    }
                  });
                },
                login: function() {
                  MeteoConfig.login($scope.config.user.login).then(function(userData) {
                    if(userData) {
                      // usuario reconocido
                      localStorage.setItem('cookie-meteo-username', userData.username);
                      localStorage.setItem('cookie-meteo-session-token', userData.sessionToken);
                      $scope.$emit('login');
                      $scope.config.user.data = userData;
                      switch(userData.username) {
                        case 'admin':
                          $state.go('admin');
                          break;
                        case 'guest':
                        default:
                          $state.go('client');
                          break;
                      }
                    } else {
                      $scope.methods.loginError();
                    }
                  });
                },
                loginError: function() {
                  $mdToast.show(
                    $mdToast.simple()
                      .content('Error de validación de usuario!')
                      .position('top left')
                      .hideDelay(3000)
                  );
                }
              };

              $scope.methods.checkLogged();
            }
          })
          .state('client', {
            url: "/",
            templateUrl: "partials/client.html",
            controller: function($scope, MeteoConfig) {
              $scope.config = {
                selected: null,
                indicadores: {
                  temperatura: {
                    id: 'temperatura',
                    description: 'Temperatura',
                    units: 'ºC',
                    value: 0,
                    icon: 'img/climacons/svg/Thermometer-50-white.svg',
                    visible: true,
                    selected: false,
                    thresholdMin: false,
                    thresholdMax: false,
                    series: {
                      "name": "Temperatura",
                      "data": [
                        /*{x: (new Date()).getTime(), y: 10 },
                        {x: (new Date()).getTime() + 1000, y: 5 },
                        {x: (new Date()).getTime() + 2000, y: 22 },
                        {x: (new Date()).getTime() + 3000, y: 13 },
                        {x: (new Date()).getTime() + 4000, y: 18 }*/
                      ]
                    }
                  },
                  viento: {
                    id: 'viento',
                    description: 'Velocidad del viento',
                    units: 'km/h',
                    value: 0,
                    icon: 'img/climacons/svg/Wind-white.svg',
                    visible: true,
                    selected: false,
                    thresholdMin: false,
                    thresholdMax: false,
                    series: {
                      "name": "Velocidad del viento",
                      "data": [
                        /*{x: (new Date()).getTime(), y: 10 },
                        {x: (new Date()).getTime() + 1000, y: 5 },
                        {x: (new Date()).getTime() + 2000, y: 22 },
                        {x: (new Date()).getTime() + 3000, y: 13 },
                        {x: (new Date()).getTime() + 4000, y: 18 }*/
                      ]
                    }
                  },
                  humedad: {
                    id: 'humedad',
                    description: 'Humedad',
                    units: '%',
                    value: 0,
                    icon: 'img/climacons/svg/Cloud-Drizzle-Alt-white.svg',
                    visible: true,
                    selected: false,
                    thresholdMin: false,
                    thresholdMax: false,
                    series: {
                      "name": "Humedad",
                      "data": [
                        /*{x: (new Date()).getTime(), y: 10 },
                        {x: (new Date()).getTime() + 1000, y: 5 },
                        {x: (new Date()).getTime() + 2000, y: 22 },
                        {x: (new Date()).getTime() + 3000, y: 13 },
                        {x: (new Date()).getTime() + 4000, y: 18 }*/
                      ]
                    }
                  }
                },
                chart: {
                  options: {
                    chart: {
                      type: 'spline'
                    },
                    animation: Highcharts.svg,
                    plotOptions: {
                      series: {
                        stacking: ''
                      }
                    },
                    tooltip: {
                      formatter: function () {
                        return '<b>' + this.series.name + '</b><br/>' +
                            Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                            Highcharts.numberFormat(this.y, 2);
                      }
                    },
                    events: {
                      load: function () {
                        var series = this.series[0];
                        setInterval(function () {
                          var x = (new Date()).getTime(), // current time
                              y = Math.random();
                          series.addPoint([x, y], true, true);
                        }, 1000);
                      }
                    }
                  },
                  series: [],
                  title: {
                    text: 'Datos históricos'
                  },
                  loading: false,
                  size: {},
                  xAxis: {
                    type: 'datetime',
                    tickPixelInterval: 150
                  },
                  yAxis: {
                    title: {
                      text: 'Valor'
                    },
                    plotLines: [{
                      value: 0,
                      width: 1,
                      color: '#808080'
                    }]
                  }
                },
                showLastRecords: true
              };

              $scope.$on('server:data', function(event, message) {
                if(message.data.temperatura){
                  $scope.config.indicadores.temperatura.thresholdMin = message.data.temperatura.minThresholdAlarm;
                  $scope.config.indicadores.temperatura.thresholdMax = message.data.temperatura.maxThresholdAlarm;
                  $scope.config.indicadores.temperatura.value = message.data.temperatura.value;
                  $scope.config.indicadores.temperatura.series.data.push({x: (new Date()).getTime(), y: message.data.temperatura.value })
                }
                if(message.data.viento){
                  $scope.config.indicadores.viento.thresholdMin = message.data.viento.minThresholdAlarm;
                  $scope.config.indicadores.viento.thresholdMax = message.data.viento.maxThresholdAlarm;
                  $scope.config.indicadores.viento.value = message.data.viento.value;
                  $scope.config.indicadores.viento.series.data.push({x: (new Date()).getTime(), y: message.data.viento.value })
                }
                if(message.data.humedad){
                  $scope.config.indicadores.humedad.thresholdMin = message.data.humedad.minThresholdAlarm;
                  $scope.config.indicadores.humedad.thresholdMax = message.data.humedad.maxThresholdAlarm;
                  $scope.config.indicadores.humedad.value = message.data.humedad.value;
                  $scope.config.indicadores.humedad.series.data.push({x: (new Date()).getTime(), y: message.data.humedad.value })
                }
              });

              $scope.methods = {
                select: function(indicador) {
                  _.each($scope.config.indicadores, function(item) {
                    item.selected = false;
                  });
                  indicador.selected = true;
                  $scope.config.selected = indicador;
                  $scope.config.chart.series.length = 0;
                  $scope.config.chart.series.push(indicador.series);
                },
                getData: function() {
                  MeteoConfig.request();
                },
                logout: function() {
                  MeteoConfig.logout();
                  $state.go('client');
                }
              }
            }
          });
    });


