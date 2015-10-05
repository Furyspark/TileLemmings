var Background = function(imageKey, initGroup) {
	if(initGroup === undefined) { initGroup = game.world; }
	Phaser.TileSprite.call(this, game, 0, 0, 800, 600, imageKey);
	initGroup.add(this);
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
	// this.x = game.camera.x;
	// this.y = game.camera.y;
	this.tilePosition.x = (game.camera.x * this.parallax.x);
	this.tilePosition.y = (game.camera.y * this.parallax.y);
};
