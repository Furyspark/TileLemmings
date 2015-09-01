var game = new Phaser.Game(
	800,
	600,
	Phaser.AUTO,
	"content"
);

game.state.add("boot", bootState);
game.state.add("game", gameState);

game.state.start("boot");