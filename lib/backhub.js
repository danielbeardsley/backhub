var fs = require('fs'),
http   = require('http'),
querystring = require('querystring'),
mkdirp = require('mkdirp'),
path   = require('path'),
exec   = require('child_process').exec,
Q      = require('q'),
Log    = require('log'),
exists = require('path').existsSync || fs.existsSync,
log


module.exports = function Backhub(config) {
   var backhub = this;
   log = new Log(process.env.LOG_LEVEL || config.logLevel || 'info')
   validateConfig(config);

   var server = http.createServer(function(req, res) {
      readWholeBody(req)
      .then(function(body) {
         res.statusCode = 200;
         res.end('OK');
         return extractPayload(body)
      })
      .then(validatePayload)
      .then(function(payload) {
         backhub.inject(payload);
      }).done();
   })
   server.listen(config.port);

   var destDir = config.destination;

   this.inject = function (pushInfo){
      var repo = pushInfo.repository
        , repoDir = path.join(destDir, safe(repo.owner.name), safe(repo.name))
        , deferred = Q.defer()

      log.info("got notice for repo: %s/%s", repo.owner.name, repo.name)
      log.debug("checking exists: " + repoDir)
      if (exists(repoDir)) {
         return gitFetch(repoDir);
      } else {
         return gitClone(repo, repoDir);
      }
   }
}

function safe(str) {
   return str.replace(/[^a-zA-Z0-9-+_]+/, "_")
}

function validateConfig(config) {
   var dest = config.destination;
   if (exists(dest)) {
      return;
   }

   var stat = fs.statSync(dest);
   if (stat.isDirectory()) {
      return;
   }

   throw new Error(dest + " must be a directory");
}

function gitClone(repo, dir) {
   var source = escape(repo.url),
       cmd = "git clone " + source + " " + dir

   log.info("cloning %s into %s", source, dir)
   return Q.nfcall(exec, cmd + " >&2").fail(
   function(err) {
      log.error("command '%s' failed", cmd);
   })
}

function gitFetch(repoDir) {
   var cmd = "git fetch"

   log.info("fetching in dir: " + repoDir)
   return Q.nfcall(exec, cmd + " >&2", {cwd: repoDir}).fail(
   function(err) {
      log.error("command '%s' failed", cmd);
   })
}

// TODO: implement!
function escape(str) {
   return str;
}

function readWholeBody(req) {
   var deferred = Q.defer();
   var data = '';
   req.on('data', function(chunk) {
      data += chunk;
   });
   req.on('end', function() {
      log.info('whole body read');
      log.info(data);
      deferred.resolve(data);
   });
   return deferred.promise;
}

function extractPayload(body) {
   var fields = querystring.parse(body);
   var payload;
   try {
      payload = JSON.parse(fields.payload)
   } catch (e) {
      throw new Error('Parsing JSON payload failed');
   }
   return Q.when(payload);
}

function validatePayload(payload) {
   log.info('validating');
   if (!payload) {
      throw new Error("Missing payload field");
   }
   var schema = {
      "repository":{
         "name": "Some name",
         "owner":{
            "name": "Some username"
         },
         "private":true,
         "url": "some url"
      }
   }
   checkProperties(payload, schema);
   return Q.when(payload);

   function checkProperties(obj, schema, parent) {
      for(var key in schema) {
         var val = obj[key];
         var valType = typeof val;
         if (typeof val != typeof schema[key]) {
            throw new Error("Payload missing '"+parent+'.'+key+"' field");
         }

         if (typeof val == 'object') {
            checkProperties(val, schema[key]);
         }
      }
   }
}
