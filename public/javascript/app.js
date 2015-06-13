angular.module('CookieMeteo', ['ngMaterial', 'ui.router', 'highcharts-ng', 'ngSocket'])
    .config(["$socketProvider", function ($socketProvider) {
      $socketProvider.setUrl("http://localhost:3001");
      Parse.initialize("iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH", "F3oYWOs8MGa6Ct5osHiLleyxUt1WFi6FdKeuaY2k");
    }])
    .config(function($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.otherwise("/");
      $stateProvider
          .state('admin', {
            url: "/admin",
            templateUrl: "partials/admin.html"
          })
          .state('login', {
            url: "/login",
            templateUrl: "partials/login.html",
            controller: function($scope) {
              $scope.config = {
                user: {
                  name: 'admin',
                  password: ''
                }
              }
            }
          })
          .state('client', {
            url: "/",
            templateUrl: "partials/client.html",
            controller: function($scope) {
              $scope.data = {
                series: [
                  {"name": "Some data", "data": [1, 2, 4, 7, 3]}
                ]
              };

              $scope.config = {
                selected: null,
                indicadores: {
                  temperatura: {
                    id: 'temperatura',
                    description: 'Temperatura',
                    units: 'ºC',
                    value: 0,
                    icon: 'img/climacons/svg/Thermometer-50.svg',
                    visible: true,
                    selected: false,
                    series: {
                      "name": "Temperatura",
                      "data": [
                        {x: (new Date()).getTime(), y: 10 },
                        {x: (new Date()).getTime() + 1000, y: 5 },
                        {x: (new Date()).getTime() + 2000, y: 22 },
                        {x: (new Date()).getTime() + 3000, y: 13 },
                        {x: (new Date()).getTime() + 4000, y: 18 }
                      ]
                    }
                  },
                  viento: {
                    id: 'viento',
                    description: 'Velocidad del viento',
                    units: 'km/h',
                    value: 0,
                    icon: 'img/climacons/svg/Wind.svg',
                    visible: true,
                    selected: false,
                    series: {
                      "name": "Velocidad del viento",
                      "data": [
                        {x: (new Date()).getTime(), y: 10 },
                        {x: (new Date()).getTime() + 1000, y: 5 },
                        {x: (new Date()).getTime() + 2000, y: 22 },
                        {x: (new Date()).getTime() + 3000, y: 13 },
                        {x: (new Date()).getTime() + 4000, y: 18 }
                      ]
                    }
                  },
                  humedad: {
                    id: 'humedad',
                    description: 'Humedad',
                    units: '%',
                    value: 0,
                    icon: 'img/climacons/svg/Cloud-Drizzle-Alt.svg',
                    visible: true,
                    selected: false,
                    series: {
                      "name": "Humedad",
                      "data": [
                        {x: (new Date()).getTime(), y: 10 },
                        {x: (new Date()).getTime() + 1000, y: 5 },
                        {x: (new Date()).getTime() + 2000, y: 22 },
                        {x: (new Date()).getTime() + 3000, y: 13 },
                        {x: (new Date()).getTime() + 4000, y: 18 }
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
                  series: $scope.data.series,
                  title: {
                    text: 'Datos históricos'
                  },
                  /*credits: {
                    enabled: false
                  },*/
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
                getData: function(indicador) {

                }
              }
            }
          });
    });


