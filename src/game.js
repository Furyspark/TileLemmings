var game = new Phaser.Game(
	800,
	600,
	Phaser.AUTO,
	"content",
	false,
	false
);

StateManager.init();

game.state.start("boot");
