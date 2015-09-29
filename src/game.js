var game = new Phaser.Game(
	800,
	600,
	Phaser.AUTO,
	"content",
	false,
	false
);

// window.resizeGame = function(ratio) {
// 	// width = window.innerWidth;
// 	// height = window.innerHeight;
// 	game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
// 	// game.scale.setUserScale(width / 800, height / 600);
// };

game.state.add("boot", bootState);
game.state.add("menu", menuState);
game.state.add("intermission", intermissionState);
game.state.add("game", gameState);

game.state.start("boot");
