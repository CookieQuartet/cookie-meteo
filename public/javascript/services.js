angular.module('CookieMeteoServices', [])
  .factory('MeteoConfig', function($socket, $q, $rootScope) {
      var config = {
            user: null,
            server: null
          },
          exportConfig = {
            selected: null,
            alarmsOn: false,
            indicadores: {
              temperatura: {
                id: 'temperatura',
                description: 'Temperatura',
                longDescription: 'Sensor de temperatura MCP9701A',
                units: 'ºC',
                value: 0,
                icon: 'img/climacons/svg/Thermometer-50-white.svg',
                icon_black: 'img/climacons/svg/Thermometer-50.svg',
                visible: true,
                alarmIncluded: true,
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
                longDescription: 'Sensor de velocidad del viento 107U',
                units: 'km/h',
                value: 0,
                icon: 'img/climacons/svg/Wind-white.svg',
                icon_black: 'img/climacons/svg/Wind.svg',
                visible: true,
                alarmIncluded: true,
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
                longDescription: 'Sensor de humedad HIH4000',
                units: '%',
                value: 0,
                icon: 'img/climacons/svg/Cloud-Drizzle-Alt-white.svg',
                icon_black: 'img/climacons/svg/Cloud-Drizzle-Alt.svg',
                visible: true,
                alarmIncluded: true,
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
                chart: {
                  height: 300,
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
                labels: {
                  //format: '{value}',
                  formatter: function () {
                    return this.value.toFixed(2).toString();
                  }
                },
                plotLines: [{
                  value: 0,
                  width: 1,
                  color: '#808080'
                }]
              }
            },
            realtime: true,
            serverConfig: null
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
              $socket.emit('client:requestData');
            },
            checkLogged: function(token) {
              loginDefer = $q.defer();
              $socket.emit('client:checkLogged', { token: token });
              return loginDefer.promise;
            },
            startAcq: function(status) {
              $socket.emit('client:start_acq');
            },
            stopAcq: function(status) {
              $socket.emit('client:stop_acq');
            }
          };
      // el cliente recibe alarmas del servidor
      $socket.on('server:alarm', function (data) {
        $rootScope.$broadcast('server:alarm', data);
      });
      // el cliente recibe estado de las luces
      $socket.on('server:lights', function(status) {
        $rootScope.$broadcast('server:lights', status);
      });
      // el cliente recibe datos del servidor
      $socket.on('server:data', function (data) {
        $rootScope.$broadcast('server:data', data);
      });
      // el servidor envia la configuracion base
      $socket.on('server:set_config', function (data) {
        if(typeof data !== 'undefined') {
          if(data.estacion.luces.start) {
            data.estacion.luces.start = new Date(data.estacion.luces.start);
          }
          if(data.estacion.luces.stop) {
            data.estacion.luces.stop = new Date(data.estacion.luces.stop);
          }
          exportConfig.serverConfig = data;
          $rootScope.$broadcast('server:set_config', data);
          defer.resolve(exportConfig);
        } else  {
          defer.resolve(false);
        }
      });
      // el servidor informa que la configuracion fue modificada
      $socket.on('server:set_config_done', function() {
        $rootScope.$broadcast('config_changed');
      });
      // el servidor informa que se ha reiniciado el puerto
      $socket.on('server:set_restart_port_done', function(data) {
        $rootScope.$broadcast('restart_port_done', data);
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
        $rootScope.$broadcast('acq_status', { status: status });
      });
      // solicitar la configuracion base
      $socket.emit('client:get_config');
      // solicitar el estado de la adquisicion
      $socket.emit('client:get_acq_status');

      return service;
  });