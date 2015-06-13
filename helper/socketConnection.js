function SocketConnection(io){
  var serialPort = require('./serialPort');
  var SerialDispatcher = require('./serialDispatcher');
  var ServerConfig = require('./serverConfig');

  var sDispatcher = new SerialDispatcher(serialPort);
  var serverConfig = new ServerConfig();

  io.on('connection', function (socket) {
    sDispatcher.connHandler.addSocket(socket);

    socket.on('request', function (request) {
      sDispatcher.addRequest(socket, request);
      sDispatcher.wakeUp();
    });

    socket.on('client:get_config', function (config) {
      socket.emit('server:set_config', {});
    });

    socket.on('client:set_config', function (config) {

    });

    socket.on('client:login', function (login) {
      serverConfig.login(login, function(response) {
        socket.emit('server:login', response);
      });
    });

    socket.on('disconnect', function () {
      sDispatcher.connHandler.removeSocket(socket.id);
    });
  });
}

module.exports.socketConn = SocketConnection;