var Backhub      = require('../lib/backhub'),
    path         = require('path'),
    querystring  = require('querystring'),
    net          = require('net'),
    http         = require('http'),
    fs           = require('fs'),
    assert       = require('assert'),
    Q            = require('q'),
    Git          = require('./git'),
    exec         = require('child_process').exec,
    exists       = require('path').existsSync || fs.existsSync,
    testRepoSource   = __dirname + "/../fixtures/repo/"
    testPort     = 59343

// Current branch pointers in our test repo.
var testBranch = "aa6b0aa64229caee1b07500334a64de9e1ffcddd",
    master     = "ff47c0e58eef626f912c7e5d80d67d8796f65003",
    initialCommit = "aac5cd96ddd3173678e3666d677699ea6adce875"

describe("backhub", function() {
   var testRepoPath, repo
   before(function(done) {
      Git.newRepo()
      .then(function (pathToRepo) {
         testRepoPath = pathToRepo
         repo = new Git(testRepoPath)
         done()
      }).done()
   })

   after(function() {
      // scary
      // rm -r testRepoPath
   })

   var backupDest = tempDirName()
   fs.mkdirSync(backupDest)
   var bh = new Backhub({
      destination: backupDest,
      logLevel: 'alert',
      port: testPort
   })

   it("should clone any repos it doesn't know about", function(done) {
      bh.inject(postReceive("repo", "user", testRepoPath))
      .then(function() {
         assert.fs.existsSync(backupDest + "/user/repo")
         return assert.fs.isGitRepo(backupDest + "/user/repo",
           "post-receive notice should have caused a git clone")
      }).then(done).done()
   })

   it("should fetch upon a second hook", function(done) {
      var backup = new Git(backupDest + "/user/repo")
      bh.inject(postReceive("repo", "user", testRepoPath))
      .then(function() {
         assert.fs.existsSync(backupDest + "/user/repo")
         return assert.fs.isGitRepo(backupDest + "/user/repo")
      })
      .then(function() {
         return repo.pointBranchAt('test-branch', initialCommit)
      })
      .then(function() {
         return bh.inject(postReceive("repo", "user", testRepoPath))
      })
      .then(function() {
         return backup.assertBranchPointsAt('origin/test-branch',
          initialCommit,
          "git fetch was not executed upon receiving a hook")
      }).then(function() {
         done()
      }).done()
   })

   it("should listen on the configured port", function(done) {
      var conn = net.connect({host:"localhost", port:testPort},
      function() {
         conn.end()
      })
      conn.on('error', function(hadError) {
         assert.ok(false, "Error connecting to backhub via tcp")
      })
      conn.on('close', function(hadError) {
         assert(!hadError, "Error connecting to backhub via tcp")
         done()
      })
   })

   it("should accept post-receive notices POSTed in the github format and inject them into the queue", function(done) {
      var received = Q.defer()
      bh.inject = function(obj) {
         received.resolve(obj)
      }
      var payload = postReceive('repo', 'user', testRepoPath)
      var requested = sendPostReceive(payload)
      Q.all([requested, received.promise])
      .spread(function(response, injectedObject) {
         assert.deepEqual(payload, injectedObject)
         done()
      }).done()
   })

   it("should NOT accept post-receive notices for invalid formats", function(done) {
      var responses = []
      bh.inject = function(obj) {
         assert.ok(false, "Invalid POST format should *not* trigger fetch")
      }
      var payload = postReceive('repo', 'user', testRepoPath)

      // Bad format #1
      var body = {
         payload: JSON.stringify(payload) + "BAD DATA"
      }
      var response = httpRequest(querystring.stringify(body))
      response.then(assert400Response("Bad JSON")).done()
      responses.push(response)

      // Bad format #2
      body = {
         payloadBAD_DATA: JSON.stringify(payload)
      }
      response = httpRequest(querystring.stringify(body))
      response.then(assert400Response("Bad query string param")).done()
      responses.push(response)

      // Bad format #3
      response = httpRequest("BAD_DATA")
      response.then(assert400Response("Bad query string format")).done()
      responses.push(response)

      function assert400Response(message) {
         return function(response) {
            assert.equal(400, response.statusCode, message)
         }
      }

      Q.all(responses).then(function(responseObjs) {
         responseObjs.forEach(function(response) {
         })
         // I guess if the server hasn't crashed and it did send responses,
         // we're done
         done()
      }).done()
   })
})

describe("Misconfigured backhub", function() {
   it("should throw an error on non-existant dir", function() {
      assert.throws(function() {
         var bh = new Backhub({
            destination: tempDirName(),
            logLevel: 'alert'
         })
      })
   })
})


function cleanUpFixture() {
   fs.unlinkSync(testRepoSource + '.git')
}

/**
 * A Stripped-down version of the the JSON from a post-receive event.
 * These are the only fields that really affect us.
 */
function postReceive(repoName, owner, repoDir) {
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
         "url": repoDir
      }
   }
}

function tempDirName() {
   return "/tmp/backhub-test-" +
            Math.floor(Math.random() * 999999)
}

assert.fs = {
   existsSync: function(path) {
      assert.ok(exists(path), "Should exist: " + path)
   }
}

assert.fs.isGitRepo = function(dir, message) {
   var deferred = Q.defer() 
   exec("git remote -v", {cwd: dir}, function (err, output) {
      if (err) {
         assert(false, message || (dir + " is not a git repo"))
      } else {
         deferred.resolve()
      }
   })
   return deferred.promise
}

function sendPostReceive(payload) {
   var body = {
      payload: (typeof payload == 'string') ? payload : JSON.stringify(payload)
   }
   var response = httpRequest(querystring.stringify(body))
   return response
}

function httpRequest(data) {
   var deferred = Q.defer()
   var request = http.request({
      hostname: 'localhost',
      port: testPort,
      method: 'POST',
      headers: {
         'Content-Type': 'application/x-www-form-urlencoded'
      },
      path: '/post-receive'
   })
   if (data) {
      request.end(data)
   }
   request.on('response', function(response) {
      deferred.resolve(response)
   })
   return deferred.promise
}
