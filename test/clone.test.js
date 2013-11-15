var Backhub      = require('../lib/backhub'),
    fs           = require('fs'),
    assert       = require('assert'),
    Q            = require('q'),
    exec         = require('child_process').exec,
    testRepoSource   = __dirname + "/../fixtures/repo/"

// Current branch pointers in our test repo.
var testBranch = "aa6b0aa64229caee1b07500334a64de9e1ffcddd",
    master     = "ff47c0e58eef626f912c7e5d80d67d8796f65003"

describe("backhub", function() {
   before(setupFixture);

   var backupDest = tempDir()
   fs.mkdirSync(backupDest);
   var bh = new Backhub({
      destination: backupDest
   })

   it("should clone any repos it doesn't know about", function(done) {
      this.timeout(5000);
      bh.inject(postReceive("repo", "user"), function() {
         assert.fs.exists(backupDest + "/user/repo")
         assert.fs.isGitRepo(backupDest + "/user/repo").then(function() {
            done()
         }).done();
      })
   })
})

describe("Misconfigured backhub", function() {
   it("should throw an error on non-existant dir", function() {
      assert.throws(function() {
         var backupDest = tempDir()
         var bh = new Backhub({
            destination: backupDest
         })
      });
   })
})


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
function setupFixture() {
   // Add a 'git-style' symlink
   fs.writeFileSync(testRepoSource + '.git', "gitdir: ./git");
};

/**
 * A Stripped-down version of the the JSON from a post-receive event.
 * These are the only fields that really affect us.
 */
function postReceive(repoName, owner) {
   return {
      "created":false,
      "deleted":false,
      "forced":false,
      "pusher":{
         "email":"test@test.com",
         "name":"Testy Testerson"
      },
      "repository":{
         "name": repoName || "testRepo",
         "owner":{
            "name": owner || "testuser"
         },
         "private":false,
         "url": testRepoSource
      }
   }
}

function tempDir() {
   return "/tmp/backhub-test-" +
            Math.floor(Math.random() * 999999)
}

assert.fs = {
   exists: function(path) {
      assert.ok(fs.existsSync(path), "Should exist: " + path)
   }
}

assert.fs.isGitRepo = function(dir) {
   var deferred = Q.defer(); 
   exec("git remote -v", {cwd: dir}, function (err, output) {
      if (err) {
         assert(false, dir + " is not a git repo")
      } else {
         deferred.resolve(output);
      }
   });
   return deferred.promise;
}
