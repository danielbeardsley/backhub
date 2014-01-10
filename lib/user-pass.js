var readModule = require('read');
var Q = require('q');

/**
 * Returns a promise for a {username:..., password:...} object
 * after the user has been prompted for them
 */
module.exports = function getUsernameAndPassword() {
   return read({
      prompt: "Github Username (leave blank to use a token):"
   }).then(function(username) {
      return read({
         prompt: "Github password or an access token (not stored):",
         silent: true
      }).then(function(password) {
         var token = null;
         if (!username) {
            token = password;
            password = null;
         }
         return {
            username:username,
            password:password,
            token: token
         }
      });
   })
}


function read(options) {
   var deferred = Q.defer();
   readModule(options, function(err, data) {
      if (err) {
         deferred.reject(err);
      } else {
         deferred.resolve(data);
      }
   });
   return deferred.promise;
}


