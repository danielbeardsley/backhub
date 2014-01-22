var assert = require('assert'),
    util   = require('../lib/util');

describe("util", function() {
   describe("githubHttpsToSsh", function() {

      it("should ignore urls that aren't github.com", function() {
         [
            "http://blah.com",
            "blah blah",
            "https://github.com",
            "https://github.com/User",
            "https://github.com/User/repo/whatsthis?",
            "/path/to/filesystem",
         ].forEach(assertDoesntChange);
      });

      it("should transform urls that are github.com repos", function() {
         var t = assertIsTransformed;
         t("https://github.com/U/R",  "git@github.com:U/R.git");
      });

      function assertDoesntChange(url) {
         assert.equal(util.githubHttpsToSsh(url), url)
      }

      function assertIsTransformed(url, expected) {
         assert.equal(util.githubHttpsToSsh(url), expected)
      }
   });
});
