exports.socketConn = function(io){
    var serialPort = require('./serialPort');
    var SerialDispatcher = require('./serialDispatcher');

    var sDispatcher = new SerialDispatcher(serialPort);


    io.on('connection', function (socket) {
        sDispatcher.connHandler.addSocket(socket);

        socket.on('request', function (request) {
            sDispatcher.addRequest(socket, request);
            sDispatcher.wakeUp();
        });

        socket.on('disconnect', function () {
            sDispatcher.connHandler.removeSocket(socket.id);
        });
    });
}