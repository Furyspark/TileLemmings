var Tile = function(x, y, key, animationCrop) {
	Phaser.Image.call(this, game, x, y, key);

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

	// Set tileMods
	this.tileMods = {};

	// Crop
	this.animAlarm = null;
	this.crop(this.animation.croppings[this.animation.frame], true);

	// Set animation timer(s)
	if(this.animation.croppings.length > 1) {
		this.animAlarm = new Alarm(this.animation.fps, function() {
			this.animate();
		}, this, true);
	}
};
Tile.prototype = Object.create(Phaser.Image.prototype);
Tile.prototype.constructor = Tile;

Tile.MOD_NO_DIG_RIGHT = 1;
Tile.MOD_NO_DIG_LEFT = 2;

/*
	method: update
	Called every frame
*/
Tile.prototype.update = function() {
	var a, mod;
	if(this.markedForRemoval) {
		// Remove mod tiles
		for(a in this.tileMods) {
			mod = this.tileMods[a];
			mod.tileRef.layer.removeTile(mod.tileRef.x, mod.tileRef.y);
		}
		// Remove self
		if(this.animAlarm) {
			this.animAlarm.cancel();
		}
		this.pendingDestroy = true;
	}
};

Tile.prototype.remove = function() {
	this.markedForRemoval = true;
};

/*
	method: animate
	Called by a timer to animate
*/
Tile.prototype.animate = function() {
	this.animation.frame = (this.animation.frame + 1) % this.animation.croppings.length;
	this.crop(this.animation.croppings[this.animation.frame]);
};

/*
	method: addMod(paramsObj)
	Adds a modifier to this tile
	Should only be done for tiles on the level's tileLayer (main tile layer)
	tileRef should be an object containing the following properties:
	 x: the x position in Tile Space for the tileref
	 y: the y position in Tile Space for the tileref
	 layer: the layer object the tileref Tile is in
	paramsObj is only necessary for some modifiers(not yet implemented)
*/
Tile.prototype.addMod = function(modSrc, tileRef) {
	var modObj = {
		tileRef: tileRef,
		mod: modSrc
	};
	this.tileMods[modSrc.type] = modObj;
};
