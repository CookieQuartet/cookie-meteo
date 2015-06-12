var express = require('express');

var path = require('path');
var logger = require('morgan');

var app = express();
var router = require('./routes');

var helperSocketConnection = require('./helper/socketConnection.js');



app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use('/', router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});



var Parse = require('parse').Parse;
Parse.initialize("iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH", "F3oYWOs8MGa6Ct5osHiLleyxUt1WFi6FdKeuaY2k");
var RecordObject = Parse.Object.extend("RecordObject");


var socket_app = require('express')();
var server = require('http').Server(socket_app);
var io = require('socket.io')(server);
server.listen(3001);


app.use(function(req, res, next){
    helperSocketConnection.socketConn(io);
});



module.exports = app;
