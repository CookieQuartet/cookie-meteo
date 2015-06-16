angular.module('CookieMeteoServices', [])
  .factory('MeteoConfig', function($socket, $q, $rootScope) {
      var config = {
            user: null,
            server: null
          },
          exportConfig = {
            selected: null,
            indicadores: {
              temperatura: {
                id: 'temperatura',
                description: 'Temperatura',
                units: 'ºC',
                value: 0,
                icon: 'img/climacons/svg/Thermometer-50-white.svg',
                icon_black: 'img/climacons/svg/Thermometer-50.svg',
                visible: true,
                selected: false,
                thresholdMin: false,
                thresholdMax: false,
                series: {
                  "name": "Temperatura",
                  "data": []
                }
              },
              viento: {
                id: 'viento',
                description: 'Velocidad del viento',
                units: 'km/h',
                value: 0,
                icon: 'img/climacons/svg/Wind-white.svg',
                icon_black: 'img/climacons/svg/Wind.svg',
                visible: true,
                selected: false,
                thresholdMin: false,
                thresholdMax: false,
                series: {
                  "name": "Velocidad del viento",
                  "data": []
                }
              },
              humedad: {
                id: 'humedad',
                description: 'Humedad',
                units: '%',
                value: 0,
                icon: 'img/climacons/svg/Cloud-Drizzle-Alt-white.svg',
                icon_black: 'img/climacons/svg/Cloud-Drizzle-Alt.svg',
                visible: true,
                selected: false,
                thresholdMin: false,
                thresholdMax: false,
                series: {
                  "name": "Humedad",
                  "data": []
                }
              }
            },
            chart: {
              options: {
                useUTC : true,
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
          },
          defer = $q.defer(),
          loginDefer,
          started = defer.promise,
          service =  {
            config: function() {
              return exportConfig;
            },
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
      // el cliente recibe datos del servidor
      $socket.on('server:data', function (data) {
        //console.log(data);
        $rootScope.$broadcast('server:data', data);
      });
      // el servidor envia la configuracion base
      $socket.on('server:set_config', function (data) {
        if(typeof data !== 'undefined') {
          config.server = data;
          defer.resolve(true);
        } else  {
          defer.resolve(false);
        }
      });
      // el servidor responde si hay una sesion activa
      $socket.on('server:checkLogged', function (data) {
        config.user = data;
        loginDefer.resolve(data);
      });
      // respuesta a una solicitud de login
      $socket.on('server:login', function (data) {
        config.user = data;
        loginDefer.resolve(data);
      });
      // respuesta a una solicitud de logout
      $socket.on('server:logout', function (data) {
        config.user = null;
        localStorage.removeItem('cookie-meteo-username');
        localStorage.removeItem('cookie-meteo-session-token');
        //$rootScope.$broadcast('logout');
      });
      // el servidor informa el estado de la adquisicion
      $socket.on('server:set_acq_status', function(status) {
        $rootScope.$broadcast('acqStatus', { status: status });
      });
      // solicitar la configuracion base
      $socket.emit('client:get_config');
      // solicitar el estado de la adquisicion
      $socket.emit('client:get_acq:status');
      //$socket.emit('client:request', { command: 'RDAS' });
      return service;
  });