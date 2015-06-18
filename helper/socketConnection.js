var Parse = require('./parse');
var _ = require('lodash');
var Q = require('q');

var app = new Parse({
  app_id:"iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH",
  api_key: "utg0CdEubwtz0m2meWqPRnh1nOnyMBFVMGG3aoNN"
});

function SocketConnection(io){
  //var serialPort = require('./serialPort');
  var SerialDispatcher = require('./serialDispatcher');
  var ServerConfig = require('./serverConfig');
  var Timer = require('./timer');

  // polling para el subsistema de alarmas
  var polling = 30;
  // manager de configuracion
  var serverConfig = new ServerConfig();
  // manager de acceso al puerto serie
  var sDispatcher = new SerialDispatcher(serverConfig);
  // adquisidor de datos
  var timer = new Timer(serverConfig.config().interval, function() {
    sDispatcher.addRequest(null, { command: 'RDAS' });
    sDispatcher.wakeUp();
  });
  // heartbeat de administracion
  var idenManager = new Timer(polling, function(socket) {
    sDispatcher.addRequest(socket, { command: 'IDEN' });
    sDispatcher.wakeUp();
  });
  // callback/promesa para guardar en Parse la adquisicion de datos
  sDispatcher.setCallback(function(data) {
    var defer = Q.defer();
    app.insert('Sensores', data, function(err, response) {
      defer.resolve(response);
    });
    return defer.promise;
  });

  io.on('connection', function (socket) {
    // se agrega el socket al dispatcher para que lo tenga en cuenta al momento de enviar datos
    sDispatcher.connHandler.addSocket(socket);

    // start de adquisicion de datos
    socket.on('client:startAcq', function(){
      timer.start();
      socket.emit('server:set_acq_status', timer.running());
    });
    // stop de adquisicion de datos
    socket.on('client:stopAcq', function(){
      timer.stop();
      socket.emit('server:set_acq_status', timer.running());
    });
    // estado de la adquisicion
    socket.on('client:get_acq_status', function(){
      socket.emit('server:set_acq_status', timer.running());
    });
    // configurar intervalo de adquisicion
    socket.on('client:set_acq_interval', function(config){
      serverConfig.setConfig(config).then(function(config) {
        timer
          .setInterval(config.interval)
          .stop()
          .start();
        socket.emit('server:set_config', config);
        socket.emit('server:set_config_done');
      });
    });
    // un cliente quiere ejecutar un comando sobre la placa
    socket.on('client:request', function (request) {
      sDispatcher.addRequest(socket, request);
      sDispatcher.wakeUp();
    });
    // un cliente pide datos
    socket.on('client:requestData', function (request) {
      sDispatcher.addRequest(socket, { command: 'RDAS' });
      sDispatcher.wakeUp();
    });
    // pedido de configuracion de un cliente
    socket.on('client:get_config', function (config) {
      socket.emit('server:set_config', serverConfig.config());
    });
    // un cliente quiere modificar la configuracion
    socket.on('client:set_config', function (config) {
      serverConfig.setConfig(config).then(function(config) {
        socket.emit('server:set_config', config);
        socket.emit('server:set_config_done');
      });
    });
    // un cliente chequea si esta logueado
    socket.on('client:checkLogged', function(event) {
      serverConfig.checkLogged(event.token, function(response) {
        socket.emit('server:checkLogged', response);
      });
    });
    // un cliente quiere iniciar sesion
    socket.on('client:login', function (login) {
      serverConfig.login(login, function(response) {
        socket.emit('server:login', response);
      });
    });
    // un cliente cierra sesion
    socket.on('client:logout', function (logout) {
      serverConfig.logout(logout.token, function(response) {
        socket.emit('server:logout', response);
      });
    });
    // un admin entra a settings
    socket.on('client:admin_in', function() {
      idenManager.setSocket(socket).start();
    });
    // un admin sale de settings
    socket.on('client:admin_out', function() {
      idenManager.stop().setSocket(null);
    });
    // un cliente se desconecta
    socket.on('disconnect', function () {
      sDispatcher.connHandler.removeSocket(socket.id);
    });
  });
}

module.exports.socketConn = SocketConnection;