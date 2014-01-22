var log = require('./log'),
exec    = require('child_process').exec,
Q       = require('q'),
shellwords  = require('shellwords'),
util        = require('./util')

module.exports = {
   clone: function gitClone(repo, dir) {
      var url = util.githubHttpsToSsh(repo.url),
          source = escape(repo.url),
          cmd = "git clone " + source + " " + dir

      log.info("cloning %s into %s", repo.url, dir)
      return Q.nfcall(exec, cmd + " >&2").fail(
      function(err) {
         log.error("command '%s' failed", cmd);
      }).then(function() {
         log.info("git clone completed successfully.");
         return true
      })
   },

   fetch: function gitFetch(repoDir) {
      var cmd = "git fetch"

      log.info("fetching in dir: " + repoDir)
      return Q.nfcall(exec, cmd + " >&2", {cwd: repoDir}).fail(
      function(err) {
         log.error("command '%s' failed", cmd);
      }).then(function() {
         log.info("git fetch completed successfully.");
         return true
      })
   }
};

function escape(str) {
   return shellwords.escape(str);
}
