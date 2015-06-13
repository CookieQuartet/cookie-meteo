/**
 * Created by Julián on 07/06/2015.
 */
var Parse = require('parse').Parse;

function Alarm(email, lowerThreshold, upperThreshold, state)
{
    this.email = email;
    this.lowerThreshold = lowerThreshold;
    this.upperThreshold = upperThreshold;
    this.state = state;
}

Alarm.prototype.getParseClass = function () {
    return "Alarm";
};

Alarm.prototype.getParseObjtect = function () {
    return Parse.Object.extend(Alarm.prototype.getParseClass(), this);
}


module.exports.Alarm = Alarm;
