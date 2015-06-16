function SocketConnection(io){
  //var serialPort = require('./serialPort');
  var SerialDispatcher = require('./serialDispatcher');
  var ServerConfig = require('./serverConfig');
  var Timer = require('./timer');

  var serverConfig = new ServerConfig();
  var sDispatcher = new SerialDispatcher(serverConfig);
  var timer = new Timer(1000, function() {
    sDispatcher.addRequest(null, { command: 'RDAS' });
    sDispatcher.wakeUp();
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
    socket.on('client:set_config', function (event) {

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
    // un cliente se desconecta
    socket.on('disconnect', function () {
      sDispatcher.connHandler.removeSocket(socket.id);
    });
  });
}

module.exports.socketConn = SocketConnection;