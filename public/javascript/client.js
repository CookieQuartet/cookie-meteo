/**
 * Created by martin on 22/5/15.
 */

Parse.initialize("iHBoW7NiugHfz1TBYimBbCuVgaNLiu2ojq8uqIBH", "F3oYWOs8MGa6Ct5osHiLleyxUt1WFi6FdKeuaY2k");

/*var TestObject = Parse.Object.extend("TestObject");
var testObject = new TestObject();
testObject.save({foo: "bar"}).then(function(object) {
 // alert("yay! it worked");
});*/

var RecordObject = Parse.Object.extend("RecordObject");
//var recordObject = new RecordObject();


var socket = io.connect('http://localhost:3001');

socket.on('data', function (data) {
  console.log(data);
  /*var recordObject = new RecordObject();
  recordObject.save(data).then(function(object) {
    console.log(data);
  });*/

});


var enabled = true;

var timer = {
  id: null,
  start: function() {
    timer.id = setInterval(function() {
      socket.emit('request', { command: 'RDAS' });
    }, 1000);
  },
  stop: function() {
    clearInterval(timer.id);
  }
}
