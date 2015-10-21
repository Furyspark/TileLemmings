var Background = function(imageKey) {
	Phaser.TileSprite.call(this, game, 0, 0, 800, 600, imageKey);
	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});

	// Set base properties
	this.parallax = {
		x: 0.2,
		y: 0.2
	};
	this.tileScale.setTo(1);
};

Background.prototype = Object.create(Phaser.TileSprite.prototype);
Background.prototype.constructor = Background;

Background.prototype.update = function() {
	if(this.state.cam) {
		this.x = this.state.cam.x;
		this.y = this.state.cam.y;
	}
	this.tilePosition.x = (game.camera.x * this.parallax.x);
	this.tilePosition.y = (game.camera.y * this.parallax.y);
};
