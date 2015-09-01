var Lemming = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, "lemming_fall");
	game.add.existing(this);

	this.animations.add("fall", [0, 1, 2, 3], 20, true);
	this.animations.play("fall");
};

Lemming.prototype = Object.create(Phaser.Sprite.prototype);
Lemming.prototype.constructor = Lemming;