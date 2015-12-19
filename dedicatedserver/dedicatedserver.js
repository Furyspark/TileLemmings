var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var fs = require("fs");
var port = 7280;

server.listen(port);

// Get level files
var levels = null;
fs.readFile("levels.json", function(err, data) {
	if(err) {throw err;}
	levels = JSON.parse(data);
});

// Set events
io.on("connection", function(socket) {
	console.log("A user connected");

	socket.on("luckofthedraw", function() {
		var a = Math.floor(Math.random() * levels.levels.length);
		var filename = levels.levels[a];
		console.log("Sending level '" + filename + "'");
		fs.readFile("levels/" + filename, function(err, data) {
			if(err) {
				socket.emit("kick", {reason: "luckofthedrawfail"});
				throw err;
			}
			socket.emit("luckofthedraw", JSON.parse(data));
		});
	});

	socket.on("disconnect", function() {
		console.log("A user disconnected");
	});
});