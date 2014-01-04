var Q       = require('q'),
log         = require('./log.js'),
querystring = require('querystring')

exports.readPayload = function(req) {
   return readWholeBody(req)
   .then(extractPayload)
   .then(validatePayload)
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
