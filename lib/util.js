exports.githubHttpsToSsh = 
function githubHttpsToSsh(url) {
   var matches = /^https:\/\/github.com\/([^\/]+)\/([^\/]+)$/.exec(url)
   if (matches) {
      return "git@github.com:" + matches[1] + "/" + matches[2] + ".git";
   }
   return url;
}
