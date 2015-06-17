angular.module('CookieMeteo', ['ngMaterial', 'ui.router', 'highcharts-ng', 'ngSocket', 'CookieMeteoServices'])
    .config(["$socketProvider", function ($socketProvider) {
      $socketProvider.setUrl("http://localhost:3001");
      Highcharts.setOptions({
        global: {
          useUTC: false
        }
      });
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
                } else {
                  $scope.isAdmin = true;
                  $scope.config = MeteoConfig.config();
                  $scope.methods = {
                    logout: function() {
                      MeteoConfig.logout();
                      $state.go('client');
                    },
                    updateSampleTime: function() {

                    }
                  }
                }
              });
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
              $scope.config = MeteoConfig.config();
              $scope.filter = {
                desde: new Date(),
                hasta: new Date(),
                data: null
              };
              $scope.$on('server:data', function(event, message) {
                if(message.data.temperatura){
                  $scope.config.indicadores.temperatura.thresholdMin = message.data.temperatura.minThresholdAlarm;
                  $scope.config.indicadores.temperatura.thresholdMax = message.data.temperatura.maxThresholdAlarm;
                  $scope.config.indicadores.temperatura.value = message.data.temperatura.value;
                  $scope.config.indicadores.temperatura.series.data.push({x: (new Date(message.data.createdAt)).getTime(), y: message.data.temperatura.value })
                }
                if(message.data.viento){
                  $scope.config.indicadores.viento.thresholdMin = message.data.viento.minThresholdAlarm;
                  $scope.config.indicadores.viento.thresholdMax = message.data.viento.maxThresholdAlarm;
                  $scope.config.indicadores.viento.value = message.data.viento.value;
                  $scope.config.indicadores.viento.series.data.push({x: (new Date(message.data.createdAt)).getTime(), y: message.data.viento.value })
                }
                if(message.data.humedad){
                  $scope.config.indicadores.humedad.thresholdMin = message.data.humedad.minThresholdAlarm;
                  $scope.config.indicadores.humedad.thresholdMax = message.data.humedad.maxThresholdAlarm;
                  $scope.config.indicadores.humedad.value = message.data.humedad.value;
                  $scope.config.indicadores.humedad.series.data.push({x: (new Date(message.data.createdAt)).getTime(), y: message.data.humedad.value })
                }
              });
              $scope.$watch('config.realtime', function(newValue, oldValue) {
                if(newValue && $scope.config.selected) {
                  $scope.config.chart.series.length = 0;
                  $scope.config.chart.title.text = $scope.config.selected.description;
                  $scope.config.chart.series.push($scope.config.selected.series);
                } else {
                  $scope.methods.searchWithFilter();
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
                  $scope.config.chart.title.text = indicador.description;
                  $scope.config.chart.series.push(indicador.series);
                },
                searchWithFilter: function() {
                  var Sensores = Parse.Object.extend("Sensores");
                  var query = new Parse.Query(Sensores);
                  query.greaterThanOrEqualTo("createdAt", $scope.filter.desde.clearTime());
                  query.lessThanOrEqualTo("createdAt", $scope.filter.hasta.clearTime());
                  query.find({
                    success: function(muestras) {
                      var data = {
                            temperatura: { name: $scope.config.indicadores.temperatura.description, data: [] },
                            viento: { name: $scope.config.indicadores.viento.description, data: [] },
                            humedad: { name: $scope.config.indicadores.humedad.description, data: [] }
                          };
                      _.each(muestras, function(muestra) {
                        data.temperatura.data.push({ x: (new Date(muestra.createdAt)).getTime(), y: muestra.attributes.temperatura });
                        data.viento.data.push({ x: (new Date(muestra.createdAt)).getTime(), y: muestra.attributes.viento });
                        data.humedad.data.push({ x: (new Date(muestra.createdAt)).getTime(), y: muestra.attributes.humedad });
                      });
                      $scope.filter.data = data;

                      $scope.config.chart.series.length = 0;
                      if($scope.config.selected) {
                        $scope.config.chart.title.text = $scope.config.selected.description;
                        $scope.config.chart.series.push(data[$scope.config.selected.id]);
                      }
                    },
                    error: function(error) {
                      alert("Error: " + error.code + " " + error.message);
                    }
                  });
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


