var BackhubModule = require('../lib/backhub'),
    BackhubCli    = require('../lib/backhub-cli'),
    assert       = require('assert'),
    Q            = require('q'),
    testPort     = "59343",
    defaultPort  = 4363,
    undefined

describe("backhub cli", function(done) {
   it("should use the default port when none is specified", function(done) {
      simulateExec(['./backhub']).then(function(config) {
         assert.deepEqual({port:defaultPort, destination:undefined}, config);
         done();
      }).done();
   });

   it("should use the port specified by the commandline option", function(done) {
      simulateExec(['./backhub', '--port', testPort]).then(function(config) {
         assert.deepEqual({port:testPort, destination:undefined}, config);
         done();
      }).done();
   });

   it("should use the destination specified by the 'destination' argument", function(done) {
      simulateExec(['./backhub', '--destination', 'dir']).then(function(config) {
         assert.deepEqual({port:defaultPort, destination:'dir'}, config);
         done();
      }).done();
   });
});

function simulateExec(args) {
   var deferred = Q.defer()
   BackhubModule.Backhub = function(config) {
      deferred.resolve(config);
   }

   BackhubCli.run(args);
   return deferred.promise;
}
