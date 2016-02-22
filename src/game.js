var game = new Phaser.Game(
	800,
	600,
	Phaser.AUTO,
	"content",
	false,
	false
);

$States.initStates();

game.state.start("boot");
