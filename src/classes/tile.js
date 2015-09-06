var Tile = function(game, x, y) {
	Phaser.Image.call(this, game, x, y);
};

Tile.prototype = Object.create(Phaser.Image.prototype);
Tile.prototype.constructor = Tile;