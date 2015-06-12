var _ = require('lodash');
var command = require('../routes/command');

module.exports = function SerialDispatcher(serialPort) {
    function ConnHandler() {
        this.sockets = {};
        this.selectedSocket = null;
        this.addSocket = function(socket) {
            this.sockets[socket.id] = socket;
        };
        this.removeSocket = function(id) {
            delete this.sockets[id];
        };
        this.broadcast = function(event) {
            _.each(this.sockets, function(socket) {
                socket.emit(event.type, event.data);
            });
        };
        this.emit = function(event) {
            this.selectedSocket.emit(event.type, event.data);
        }
    }
    function init() {
        serialPort.on('data', function(data) {
            var _data;
            if(data.indexOf(';') >= 0) {
                data = {
                    type: 'data',
                    data: {
                        message: 'Datos obtenidos',
                        data: _.chain(data.split(';'))
                            .remove(function (item) {
                                return item.length !== 0;
                            })
                            .map(function (item) {
                                return parseInt(item)
                            })
                            .value()
                    }
                };
                /*sDispatcher.connHandler.emit({
                 type: 'data',
                 data: {
                 message: 'Datos obtenidos',
                 data: _.chain(data.split(';'))
                 .remove(function (item) {
                 return item.length !== 0;
                 })
                 .map(function (item) {
                 return parseInt(item)
                 })
                 .value()
                 }
                 });*/
            } else {
                _data = {
                    type: 'data',
                    data: {
                        message: data
                    }
                };
                /*
                 sDispatcher.connHandler.emit({
                 type: 'data',
                 data: {
                 message: data
                 }
                 });
                 */
            }
            recordObject.save(_data).then(function(object) {
                console.log(_data);
                sDispatcher.connHandler.emit(_data);
            });
        });
    }
    var _self = this;
    this.connHandler = new ConnHandler();
    this.requests = [];
    this.addRequest = function(socket, request) {
        _self.requests.push({socket: socket, request: request });
    };
    this.wakeUp = function() {
        if(_self.requests.length) {
            _self.processQueue();
        }
    };
    this.processRequest = function(requestItem) {
        serialPort.open(function (error) {
            var command = requestItem.request.command,
                value = requestItem.request.params ? requestItem.request.params: '';
            if ( error ) {
                console.log('failed to open: '+ error);
            } else {
                _self.connHandler.selectedSocket = requestItem.socket;
                serialPort.write(command + value + "\n");
            }
        });
    };
    this.processQueue = function() {
        while(_self.requests.length > 0) {
            _self.processRequest(_self.requests.pop())
        }
    };
    this.destroy = function() {
        serialPort.close();
    };
    init();
}