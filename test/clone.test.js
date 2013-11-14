var Backhub      = require('../lib/backhub'),
    fs           = require('fs'),
    assert       = require('assert')
    // childProcess = require('child_process'),
    testRepoSource   = __dirname + "/../fixtures/repo/"

// Current branch pointers in our test repo.
var testBranch = "aa6b0aa64229caee1b07500334a64de9e1ffcddd",
    master     = "ff47c0e58eef626f912c7e5d80d67d8796f65003"

describe("backhub", function() {
   var backupDest = tempDir()
   fs.mkdir(backupDest);
   var bh = new Backhub({
      destination: backupDest
   })

   it("should clone any repos it doesn't know about", function(done) {
      bh.inject(postReceive("repo", "user"), function() {
         assert.fs.exists(backupDest + "/user/repo")
         done()
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
