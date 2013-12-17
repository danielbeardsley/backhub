var log = require('./log'),
exec    = require('child_process').exec,
Q       = require('q')

module.exports = {
   clone: function gitClone(repo, dir) {
      var source = escape(repo.url),
          cmd = "git clone " + source + " " + dir

      log.info("cloning %s into %s", source, dir)
      return Q.nfcall(exec, cmd + " >&2").fail(
      function(err) {
         log.error("command '%s' failed", cmd);
      })
   },

   fetch: function gitFetch(repoDir) {
      var cmd = "git fetch"

      log.info("fetching in dir: " + repoDir)
      return Q.nfcall(exec, cmd + " >&2", {cwd: repoDir}).fail(
      function(err) {
         log.error("command '%s' failed", cmd);
      })
   }
};

// TODO: implement!
function escape(str) {
   return str;
}
