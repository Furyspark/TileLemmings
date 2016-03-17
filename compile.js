var args = process.argv.slice(2);
var concat = require("concat");
var fs = require("fs");

var sources = JSON.parse(fs.readFileSync("sources.json"));
var files = sources.main;

if(args.indexOf("test") !== -1) files.push("src/debug.js");

concat(files, "game.js", function(err) {
  if(err) throw err;
});
