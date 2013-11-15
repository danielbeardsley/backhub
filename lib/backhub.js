var fs = require('fs'),
mkdirp = require('mkdirp'),
path   = require('path'),
exec   = require('child_process').exec,
Q      = require('q')

module.exports = function Backhub(config) {
   validateConfig(config);

   var destDir = config.destination;

   this.inject = function (pushInfo, callback){
      var repo = pushInfo.repository;
      repoDir = path.join(destDir, safe(repo.owner.name), safe(repo.name));

      console.log("Checking: " + repoDir);
      Q.nfcall(fs.exists, repoDir)
      .then(function(exists) {
         if (!exists) {
            console.log("Not Found: " + repoDir)
            return mkdirp(repoDir, callback);
            return gitClone(repo, repoDir).then(callback)
         }
         console.log("Found: " + repoDir)
      }).done()
   }
}

function safe(str) {
   return str.replace(/[^a-zA-Z0-9-+_]+/, "_")
}

function validateConfig(config) {
   var dest = config.destination;
   if (fs.existsSync(dest)) {
      return;
   }

   var stat = fs.statSync(dest);
   if (stat.isDirectory()) {
      return;
   }

   throw new Error(dest + " must be a directory");
}

function gitClone(repo, dir) {
   var source = escape(repo.url)
       cmd = "git clone " + source + " " + dir

   console.log("cloning");
   return Q.nfcall(exec, cmd + " >&2").fail(
   function(err) {
      console.log("Clone fail!!");
      console.error("Error: cmd " + cmd + " failed ");
   })
}

function escape(str) {
   return str;
}
