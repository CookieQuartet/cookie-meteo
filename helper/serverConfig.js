//var Parse = require('parse').Parse;
//Parse.initialize("iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH", "F3oYWOs8MGa6Ct5osHiLleyxUt1WFi6FdKeuaY2k");
//var RecordObject = Parse.Object.extend("RecordObject");

var Parse = require('./parse');

var app = new Parse({
  app_id:"iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH",
  master_key:"U1lv9HnU3QCvRaKibxC2GUfC3iaEMbY8eojxf5Z5" // master_key:'...' could be used too
});

var ServerConfig = function() {

  this.login = function(login, cb) {
    var _cb = cb;
    app.loginUser(login.username, login,password, function(err, response) {
      if(typeof err == 'undefined') {
        _cb.call(response);
      }
    });
  };

  this.set = function(key, value) {
    app.insert(key, value, function (err, response) {
      console.log(response);
    });
  };

  this.get = function(key) {
    app.find(key, 'someId', function (err, response) {
      console.log(response);
    });
  };

  /*app.insertUser({
    username: 'guest',
    password: '123456'
  }, function (err, response) {
    console.log(response);
  });*/
};




module.exports = ServerConfig;