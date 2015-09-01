(function(Phaser) {var Lemming = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, "lemming_fall");
	game.add.existing(this);

	this.animations.add("fall", [0, 1, 2, 3], 20, true);
	this.animations.play("fall");
};

Lemming.prototype = Object.create(Phaser.Sprite.prototype);
Lemming.prototype.constructor = Lemming;
var bootState = {
	preload: function() {
		this.loadAssetList("./assets/asset_list.json");
	},

	loadAssetList: function(assetListFilename) {
		game.load.json("assetList", assetListFilename);

		// List file loaded
		game.load.onFileComplete.addOnce(function(progress, fileKey, success, totalLoadedFiles, totalFiles) {
			if(fileKey === "assetList" && success) {
				this.loadAssets();
			}
		}, this);
	},

	loadAssets: function() {
		var assetList = game.cache.getJSON("assetList");

		// Add callback for Finish Loading
		game.load.onLoadComplete.addOnce(function() {
			game.state.start("game");
		}, this);


		// Load sprites
		var a, curAsset, curList = assetList.sprites;
		for(a in curList) {
			curAsset = curList[a];
			game.load.spritesheet(curAsset.key, curAsset.url, curAsset.frameWidth, curAsset.frameHeight);
		}
	}
};
var gameState = {
	create: function() {
		console.log("Game State started!");
		var lem = new Lemming(game, 48, 48);
	},

	update: function() {

	}
};
var game = new Phaser.Game(
	800,
	600,
	Phaser.AUTO,
	"content"
);

game.state.add("boot", bootState);
game.state.add("game", gameState);

game.state.start("boot");})(Phaser);