var express = require('express');
var path = require('path');
var app = express();

var helperSocketConnection = require('./helper/socketConnection.js');

//app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
}
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});

var socket_app = require('express')();
var server = require('http').Server(socket_app);
var io = require('socket.io')(server);
server.listen(3001);

helperSocketConnection.socketConn(io);

module.exports = app;
