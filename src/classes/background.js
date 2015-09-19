var Background = function(game, imageKey) {
	Phaser.TileSprite.call(this, game, 0, 0, game.stage.width, game.stage.height, imageKey);
	game.add.existing(this);
	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});

	// Set base properties
	this.parallax = {
		x: 0.2,
		y: 0.2
	};
	this.tileScale.setTo(2);
};

Background.prototype = Object.create(Phaser.TileSprite.prototype);
Background.prototype.constructor = Background;

Background.prototype.update = function() {
	this.x = game.camera.x;
	this.y = game.camera.y;
	this.tilePosition.x = (this.x * this.parallax.x);
	this.tilePosition.y = (this.y * this.parallax.y);
};