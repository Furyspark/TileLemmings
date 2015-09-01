var gameState = {
	create: function() {
		console.log("Game State started!");
		var lem = new Lemming(game, 48, 48);

		// Play music
		game.sound.play("bgmCancan");
	},

	update: function() {

	}
};