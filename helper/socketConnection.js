function SocketConnection(io){
  var serialPort = require('./serialPort');
  var SerialDispatcher = require('./serialDispatcher');
  var ServerConfig = require('./serverConfig');

  var sDispatcher = new SerialDispatcher(serialPort);
  var serverConfig = new ServerConfig();

  io.on('connection', function (socket) {
    sDispatcher.connHandler.addSocket(socket);

    // pedido de datos de un cliente
    socket.on('client:request', function (request) {
      sDispatcher.addRequest(socket, request);
      sDispatcher.wakeUp();
    });

    // pedido de configuracion de un cliente
    socket.on('client:get_config', function (config) {
      socket.emit('server:set_config', {});
    });

    // un cliente quiere modificar la configuracion
    socket.on('client:set_config', function (config) {

    });

    // un cliente quiere iniciar sesion
    socket.on('client:login', function (login) {
      serverConfig.login(login, function(response) {
        socket.emit('server:login', response);
      });
    });

    // un cliente se desconecta
    socket.on('disconnect', function () {
      sDispatcher.connHandler.removeSocket(socket.id);
    });
  });
}

module.exports.socketConn = SocketConnection;