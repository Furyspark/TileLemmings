const spawn = require("child_process").spawn;

let game = spawn("electron", ["main.js", "--debug"], { cwd: "./app/" });
game.stdout.on("data", function(data) {
  process.stdout.write(data.toString());
});
game.stderr.on("data", function(data) {
  process.stderr.write(data.toString());
});
