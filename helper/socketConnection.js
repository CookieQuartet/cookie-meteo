require('datejs');
Date.i18n.setLanguage('es-AR');

var Parse = require('./parse');
var _ = require('lodash');
var Q = require('q');

var SerialDispatcher = require('./serialDispatcher');
var ServerConfig = require('./serverConfig');
var LightScheduler = require('./lightScheduler');

//-----------------------------------------------------------------------------------------
// mailer
var mailer = require('./emailService');
//-----------------------------------------------------------------------------------------
// manager de configuracion
var serverConfig = new ServerConfig(mailer);
//-----------------------------------------------------------------------------------------
// manager de acceso al puerto serie
var sDispatcher = new SerialDispatcher(serverConfig);
//-----------------------------------------------------------------------------------------
var app = new Parse({
  app_id:"iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH",
  api_key: "utg0CdEubwtz0m2meWqPRnh1nOnyMBFVMGG3aoNN"
});
//-----------------------------------------------------------------------------------------
function SocketConnection(io) {
  serverConfig.config().then(function(config) {
    //-----------------------------------------------------------------------------------------
    // callback/promesa para guardar en Parse la adquisicion de datos
    sDispatcher.setCallback(function(data) {
      var defer = Q.defer();
      app.insert('Sensores', data, function(err, response) {
        defer.resolve(response);
      });
      return defer.promise;
    });
    //-----------------------------------------------------------------------------------------
    // inicializar el dispatcher
    sDispatcher.init();
    //-----------------------------------------------------------------------------------------
    // scheduler de luces
    var scheduler = new LightScheduler(config, sDispatcher);
    //-----------------------------------------------------------------------------------------
    io.on('connection', function (socket) {
      //-----------------------------------------------------------------------------------------
      // se agrega el socket al dispatcher para que lo tenga en cuenta al momento de enviar datos
      sDispatcher.addSocket(socket);
      //-----------------------------------------------------------------------------------------
      // estado de la adquisicion
      socket.emit('server:set_acq_status', sDispatcher.running());
      //-----------------------------------------------------------------------------------------
      // start de adquisicion de datos
      socket.on('client:start_acq', function(){
        sDispatcher.startAdq();
      });
      //-----------------------------------------------------------------------------------------
      // stop de adquisicion de datos
      socket.on('client:stop_acq', function(){
        sDispatcher.stopAdq();
      });
      //-----------------------------------------------------------------------------------------
      // estado de la adquisicion
      socket.on('client:get_acq_status', function(){
        socket.emit('server:set_acq_status', sDispatcher.running());
      });
      //-----------------------------------------------------------------------------------------
      // configurar intervalo de adquisicion
      socket.on('client:set_acq_interval', function(config){
        var running = sDispatcher.running();
        if(running) {
          sDispatcher.stopAdq();
        }
        serverConfig.setConfig(config).then(function(config) {
          if(running) {
            sDispatcher.startAdq();
          }
          console.info((new Date).toString('yyyy/MM/dd HH:mm:ss') + ' --- El período de muestreo fue cambiado a ', config.interval);
          socket.emit('server:set_config', config);
          socket.emit('server:set_config_done');
        });
      });
      //-----------------------------------------------------------------------------------------
      // un cliente pide identificacion
      socket.on('client:iden', function () {
        sDispatcher.iden(socket);
      });
      //-----------------------------------------------------------------------------------------
      // pedido de configuracion de un cliente
      socket.on('client:get_config', function () {
        socket.emit('server:set_config', config);
      });
      //-----------------------------------------------------------------------------------------
      // un cliente quiere modificar la configuracion
      socket.on('client:set_config', function (config) {
        serverConfig.setConfig(config).then(function(_config) {
          // se modificaron parametros de las luces?
          if(config.estacion && config.estacion.luces) {
            scheduler.update(_config);
          }
          // comunico los cambios a todas las instancias
          sDispatcher.broadcast({ type: 'server:set_config', data: _config });
          // aviso al cliente que se hizo la modificacion
          socket.emit('server:set_config_done');
        });
      });
      //-----------------------------------------------------------------------------------------
      // un cliente quiere modificar la configuracion sin hacer mucho ruido
      socket.on('client:set_config_silent', function (config) {
        serverConfig.setConfig(config).then(function(_config) {
          // se modificaron parametros de las luces ?
          if(config.estacion && config.estacion.luces) {
            scheduler.update(_config);
          }
          sDispatcher.broadcast({ type: 'server:set_config', data: _config });
        });
      });
      //-----------------------------------------------------------------------------------------
      // un cliente chequea si esta logueado
      socket.on('client:checkLogged', function(event) {
        serverConfig.checkLogged(event.token, function(response) {
          socket.emit('server:checkLogged', response);
        });
      });
      //-----------------------------------------------------------------------------------------
      // un cliente quiere iniciar sesion
      socket.on('client:login', function (login) {
        serverConfig.login(login, function(response) {
          socket.emit('server:login', response);
        });
      });
      //-----------------------------------------------------------------------------------------
      // un cliente cierra sesion
      socket.on('client:logout', function (logout) {
        serverConfig.logout(logout.token, function(response) {
          socket.emit('server:logout', response);
        });
      });
      //-----------------------------------------------------------------------------------------
      // un cliente solicita el reinicio del puerto serie
      socket.on('client:restart_port', function () {
        sDispatcher.restart();
        socket.emit('server:set_restart_port_done');
      });
      //-----------------------------------------------------------------------------------------
      // encendido de luces
      socket.on('client:lights', function(status) {
        if(status) {
          sDispatcher.turnOn();
        } else  {
          sDispatcher.turnOff();
        }
      });
      //-----------------------------------------------------------------------------------------
      // un cliente se desconecta
      socket.on('disconnect', function () {
        sDispatcher.removeSocket(socket.id);
      });
      //-----------------------------------------------------------------------------------------
    });
  });
}

module.exports.socketConn = SocketConnection;