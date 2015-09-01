var requirejs = require("./lib/r.js");

requirejs.config({
	nodeRequire: require
});

requirejs(["./lib/game_data.js"], function() {
	requirejs(["./lib/classes/lemming.js"], function() {
		requirejs(["./lib/game.js"], function() {

		});
	});
});