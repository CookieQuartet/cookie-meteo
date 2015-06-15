/**
 * Created by martin on 15/6/15.
 */
function TransformData(value, transfer, thresholds) {
  var level = value * (5/1023),
      result = transfer.a * Math.pow(level, 2) + transfer.b * level + transfer.c;
  return {
    value: result,
    minThresholdAlarm: result <= thresholds.min,
    maxThresholdAlarm: result >= thresholds.max
  }
}

module.exports = TransformData;