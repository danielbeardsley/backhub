var Log = require('log');

module.exports = new Log(process.env.LOG_LEVEL || 'info')
module.exports.setLevel = function(levelString) {
   this.level = Log[levelString.toUpperCase()];
}
