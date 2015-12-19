var luckSock = null;

function startLuckOfTheDraw() {
	luckSock = io.connect("http://furyspark.nl:7280", {
		forceNew: true
	});

	luckSock.on("connect", function() {
		luckSock.emit("luckofthedraw");
	});

	luckSock.on("kick", function(result) {
		endLuckOfTheDraw();
	});

	luckSock.on("luckofthedraw", function(data) {
		endLuckOfTheDraw();
		game.state.start("intermission", true, false, "luckofthedraw", data);
	});

	luckSock.on("disconnect", function() {
		luckSock = null;
	});
}

function endLuckOfTheDraw() {
	luckSock.io.close();
}