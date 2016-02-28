var concat = require("concat");
var fs = require("fs");
var spawn = require("child_process").spawn;

var sources = JSON.parse(fs.readFileSync("sources.json"));

concat(sources, "game.js", function(err) {
  spawn("electron", ["."]);
});
