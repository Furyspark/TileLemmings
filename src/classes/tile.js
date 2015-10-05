var Tile = function(x, y, key, animationCrop) {
	Phaser.Image.call(this, game, x, y, key);
	game.add.existing(this);

	Object.defineProperties(this, {
		"state": {
			get() {
				return game.state.getCurrentState();
			}
		},
		"tileX": {
			get() {
				return Math.floor(this.owner.x / this.owner.state.map.tilewidth);
			}
		},
		"tileY": {
			get() {
				return Math.floor(this.owner.y / this.owner.state.map.tileheight);
			}
		}
	});

	this.markedForRemoval = false;

	// Add animation/cropping
	this.animation = {
		croppings: animationCrop,
		frame: 0,
		fps: 6
	};

	// Crop
	this.crop(this.animation.croppings[this.animation.frame], true);

	// Set animation timer(s)
	if(this.animation.croppings.length > 1) {
		new Alarm(game, this.animation.fps, function() {
			this.animate();
		}, this, true);
	}
};

Tile.prototype = Object.create(Phaser.Image.prototype);
Tile.prototype.constructor = Tile;

Tile.prototype.update = function() {
	if(this.markedForRemoval) {
		this.pendingDestroy = true;
	}
};

Tile.prototype.animate = function() {
	this.animation.frame = (this.animation.frame + 1) % this.animation.croppings.length;
	this.crop(this.animation.croppings[this.animation.frame], true);
};

Tile.prototype.remove = function() {
	this.markedForRemoval = true;
};
