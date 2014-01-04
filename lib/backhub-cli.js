var BackhubModule = require('../lib/backhub'),
    optimist = require('optimist')

exports.run = function(argv) {
   var config = readArguments(argv);
   new BackhubModule.Backhub(config)
}

function readArguments(argv) {
   var args = optimist(argv)
      .default('port', 4363)
      .usage("Usage: $0 --port=[number] --destination=[path]")
      .argv

   return {
      port: args.port,
      destination: args.destination
   }
}
