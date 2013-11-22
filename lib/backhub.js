var fs = require('fs'),
net    = require('net'),
mkdirp = require('mkdirp'),
path   = require('path'),
exec   = require('child_process').exec,
Q      = require('q'),
Log    = require('log'),
exists = require('path').existsSync || fs.existsSync,
log


module.exports = function Backhub(config) {
   log = new Log(process.env.LOG_LEVEL || config.logLevel || 'info')
   validateConfig(config);

   var server = net.createServer(function(connection) {

   })
   server.listen(config.port);

   var destDir = config.destination;

   this.inject = function (pushInfo){
      var repo = pushInfo.repository
        , repoDir = path.join(destDir, safe(repo.owner.name), safe(repo.name))
        , deferred = Q.defer()

      log.info("got notice for repo: %s/%s", repo.owner.name, repo.name)
      log.debug("checking exists: " + repoDir)
      if (exists(repoDir)) {
         return gitFetch(repoDir);
      } else {
         return gitClone(repo, repoDir);
      }
   }
}

function safe(str) {
   return str.replace(/[^a-zA-Z0-9-+_]+/, "_")
}

function validateConfig(config) {
   var dest = config.destination;
   if (exists(dest)) {
      return;
   }

   var stat = fs.statSync(dest);
   if (stat.isDirectory()) {
      return;
   }

   throw new Error(dest + " must be a directory");
}

function gitClone(repo, dir) {
   var source = escape(repo.url),
       cmd = "git clone " + source + " " + dir

   log.info("cloning %s into %s", source, dir)
   return Q.nfcall(exec, cmd + " >&2").fail(
   function(err) {
      log.error("command '%s' failed", cmd);
   })
}

function gitFetch(repoDir) {
   var cmd = "git fetch"

   log.info("fetching in dir: " + repoDir)
   return Q.nfcall(exec, cmd + " >&2", {cwd: repoDir}).fail(
   function(err) {
      log.error("command '%s' failed", cmd);
   })
}

function escape(str) {
   return str;
}
