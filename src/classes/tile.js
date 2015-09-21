var Tile = function(game, x, y, key, animationCrop) {
	Phaser.Image.call(this, game, x, y, key);
	game.add.existing(this);

	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});
	this.tile = {
		get x() {
			return Math.floor(this.owner.x / this.owner.state.map.tilewidth);
		},
		get y() {
			return Math.floor(this.owner.y / this.owner.state.map.tileheight);
		},
		owner: this
	};
	this.markedForRemoval = false;

	// Add animation/cropping
	this.animation = {
		croppings: animationCrop,
		frame: 0,
		fps: 6
	};

	// Add to scale group
	this.state.levelGroup.add(this);

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
	// Animate


	// Remove self
	if(this.markedForRemoval) {
		if(typeof removeCol === "undefined") {
			removeCol = true;
		}

		var layer = this.state.layers.primitiveLayer;
		for(var a in layer.data) {
			var tile = layer.data[a];
			if(tile === this) {
				// Remove collision flag
				if(removeCol) {
					this.state.layers.tileLayer.setType(this.tile.x, this.tile.y, 0);
				}
				// Delete self
				layer.data[a] = null;
			}
		}

		this.pendingDestroy = true;
	}
};

Tile.prototype.animate = function() {
	this.animation.frame = (this.animation.frame + 1) % this.animation.croppings.length;
	this.crop(this.animation.croppings[this.animation.frame], true);
};

Tile.prototype.remove = function(removeCol) {
	this.markedForRemoval = true;
};