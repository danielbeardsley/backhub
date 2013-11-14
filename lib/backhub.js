var fs = require('fs'),
mkdirp = require('mkdirp'),
path = require('path')

module.exports = function Backhub(config) {
   validateConfig(config);

   var destDir = config.destination;

   this.inject = function (pushInfo, callback){
      var repo = pushInfo.repository;
      repoDir = path.join(destDir, safe(repo.owner.name), safe(repo.name));

      mkdirp(repoDir, function(err) {
         if (err) throw err;
         callback();
      });
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
