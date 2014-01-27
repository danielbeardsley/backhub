var fs = require('fs'),
http   = require('http'),
path   = require('path'),
log    = require('./log.js'),
Git    = require('./git.js'),
controller = require('./controller.js'),
exists = fs.existsSync || path.existsSync


exports.Backhub = function Backhub(config) {
   var backhub = this;
   log.setLevel(process.env.LOG_LEVEL || config.logLevel || 'info');
   validateConfig(config);

   var server = http.createServer(function(req, res) {
      controller.readPayload(req)
      .then(function(payload) {
         res.statusCode = 200;
         res.end('OK');
         return backhub.inject(payload)
      }).fail(function (err) {
         res.statusCode = 400
         res.end(err.toString());
         log.error("Error processing payload: %s", err);
      });
   })

   log.info("listening on port %s", config.port)
   server.listen(config.port);

   var destDir = config.destination;

   this.inject = function (pushInfo){
      var repo = pushInfo.repository
        , repoDir = path.join(destDir, safe(repo.owner.name), safe(repo.name))

      log.info("got notice for repo: %s/%s", repo.owner.name, repo.name)
      log.debug("checking exists: " + repoDir)
      if (exists(repoDir)) {
         return Git.fetch(repoDir);
      } else {
         return Git.clone(repo, repoDir);
      }
   }
}

function safe(str) {
   return str.replace(/[^a-zA-Z0-9-+_]+/, "_")
}

function validateConfig(config) {
   var stat = fs.statSync(config.destination);
   if (stat.isDirectory()) {
      return;
   }

   throw new Error(dest + " must be a directory");
}

