require('datejs');
Date.i18n.setLanguage('es-AR');

var schedule = require('node-schedule');

function LightScheduler(config, dispatcher) {
  // configura el scheduling para el encendido/apagado automatico de las luces
  var _self = this,
      schedules = update(config);
  function update(config) {
    var horaOn = {
          horas: (new Date(config.estacion.luces.start)).getHours(),
          minutos: (new Date(config.estacion.luces.start)).getMinutes()
        },
        horaOff = {
          horas: (new Date(config.estacion.luces.stop)).getHours(),
          minutos: (new Date(config.estacion.luces.stop)).getMinutes()
        };
    return {
      on: schedule.scheduleJob({ hour: horaOn.horas, minute: horaOn.minutos }, function(){
        dispatcher.turnOn();
      }),
      off: schedule.scheduleJob({ hour: horaOff.horas, minute: horaOff.minutos }, function(){
        dispatcher.turnOff();
      })
    };
  }

  this.update = function(config) {
    _self.cancel();
    schedules =  config.estacion.luces.manual ? null : update(config);
    return schedules;
  };
  this.cancel = function() {
    if(schedules) {
      schedules.on.cancel();
      schedules.off.cancel();
    }
  };
}

module.exports = LightScheduler;