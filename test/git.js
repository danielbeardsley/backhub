var fs           = require('fs'),
    assert       = require('assert'),
    Q            = require('q'),
    exec         = require('child_process').exec,
    testRepoSource   = __dirname + "/../fixtures/repo/",
    Log          = require('log'),
    log          = new Log(process.env.LOG_LEVEL || 'info')

function Git (gitDir) {

   this.pointBranchAt =
   function pointBranchAt(branch, commit) {
      var deferred = Q.defer() 
          cmd = "git branch -f " + branch + " " + commit

      exec(cmd, {cwd: gitDir}, function (err, output) {
         if (err) {
            assert(false, gitDir + " is not a git repo")
         } else {
            deferred.resolve(output)
         }
      })
      return deferred.promise
   }

   this.assertBranchPointsAt =
   function assertBranchPointsAt(branch, commit, msg) {
      var deferred = Q.defer() 
          cmd = "git rev-parse " + branch

      exec(cmd, {cwd: gitDir}, function (err, output) {
         output = output.replace(/^\s+|\s+$/g, '')
         if (err) {
            assert(false, gitDir + " is not a git repo")
         } else {
            assert.ok(output === commit, msg);
            deferred.resolve(output)
         }
      })
      return deferred.promise
   }
}

/**
 * Because Git doesn't allow adding any files or dirs named .git
 * we can't add the test repo's .git dir directly to the main repo.
 * We must resort to dynamically creating and destroying a
 * "symlink-like" file that points git to a different folder for
 * the actual repo dir.
 *
 * Actual repo dir:        fixtures/repo/git
 * "symlink" to repo dir:  fixtures/repo/.git
 */
Git.newRepo = function newRepo() {
   var tempDir = tempDirName()
   return Q.nfcall(exec, "cp -r " + testRepoSource + " " + tempDir)
   .fail(function(err) {
      log.error("Preparing git repo failed in %s.", tempDir)
   })
   .then(function() {
      // Add a 'git-style' symlink
      return Q.nfcall(fs.writeFile, tempDir + '/.git', "gitdir: ./git")
      .fail(function() {
         log.error("Preparing git dir symlink failed in %s.", tempDir)
      })
   }).then(function() {
      return tempDir
   })
}

function tempDirName() {
   return "/tmp/backhub-test-" +
            Math.floor(Math.random() * 999999)
}

module.exports = Git;
