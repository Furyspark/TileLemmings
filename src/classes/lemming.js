var Lemming = function(game, group, x, y) {
	Phaser.Sprite.call(this, game, x, y, "lemming");
	game.add.existing(this);
	this.levelGroup = group;
	this.levelGroup.add(this);
	this.state = this.game.state.getCurrentState();

	this.action = {
		name: "",
		value: 0,
		active: false,
		clear: function() {
			this.name = "";
			this.value = 0;
			this.active = false;
		},
		get idle() {
			return (!this.active);
		}
	}

	// Set input
	this.inputEnabled = true;
	this.events.onInputDown.add(function() {
		this.setAction(this.state.actions.current.name);
	}, this);

	// Set anchor
	this.anchor.setTo(0.5, 1);

	// Set physics
	// game.physics.arcade.enable(this);
	// this.body.setSize(16, 20);

	this.dir = 1;
	this.velocity = {
		x: 0,
		y: 0
	};
	this.tile = {
		get width() {
			return this.parent.state.map.tileWidth;
		},
		get height() {
			return this.parent.state.map.tileHeight;
		},
		x: function(checkX) {
			return Math.floor(checkX / this.width);
		},
		y: function(checkY) {
			return Math.floor(checkY / this.height);
		},
		type: function(tileX, tileY) {
			var index = (tileX % this.parent.tileLayer.width) + Math.floor(tileY * this.parent.tileLayer.width);
			return this.parent.tileLayer.data[index];
		}
	};
	this.tile.parent = this;
	Object.defineProperty(this, "tileLayer", {get: function() {
		return this.state.layers.tileLayer;
	}});

	// Set animations
	this.addAnim("fall", "Fall", 4);
	this.addAnim("move", "Move", 10);
	this.addAnim("mine", "Mine", 24);
	this.addAnim("build", "Build", 16);
	this.addAnim("build_end", "BuildEnd", 10, false);
	this.animations.play("fall", 15);
	this.velocity.y = 1;
	// this.body.velocity.y = 100;

	this.objectType = "lemming";
};

Lemming.prototype = Object.create(Phaser.Sprite.prototype);
Lemming.prototype.constructor = Lemming;

Lemming.prototype.onFloor = function() {
	return (this.tile.type(this.tile.x(this.x), this.tile.y(this.y)) === 1 ||
		this.tile.type(this.tile.x(this.x), this.tile.y(this.y) - 1) === 1);
};

Lemming.prototype.turnAround = function() {
	this.scale.x = -this.scale.x;
	this.dir = -this.dir;
	this.velocity.x = -this.velocity.x;
	this.x += this.velocity.x;
};

Lemming.prototype.update = function() {
	this.x += this.velocity.x;
	this.y += this.velocity.y;

	if(this.onFloor() && this.action.idle) {
		this.velocity.x = 0.5;
		if(this.dir === -1) {
			this.velocity.x = -this.velocity.x;
		}
		this.velocity.y = 0;
		// Align to floor
		this.y = Math.floor(this.y / this.tile.height) * this.tile.height;
		// Check walk up ramp
		if(this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1)) === 1 &&
			this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1 - this.tile.height)) === 0) {
			this.y -= this.tile.height;
		}
		// Check walk against wall
		else if(this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1)) === 1 &&
			this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1 - this.tile.height)) === 1) {
			// Turn around
			this.turnAround();
		}
		// Play animation
		this.animations.play("move", 15);
	}
	else if(!this.onFloor()) {
		this.velocity.x = 0;
		this.velocity.y = 1.5;
		this.animations.play("fall", 15);
	}
};

Lemming.prototype.addAnim = function(key, animName, numFrames, loop) {
	if(loop === undefined) {
		loop = true;
	}
	var a, frames = [];
	for(a = 0;a < numFrames;a += 1) {
		var anim = "sprLemming_" + animName + "_" + a.toString() + ".png";
		frames.push(anim);
	}
	console.log(key + ":" + loop);
	this.animations.add(key, frames, 60, loop);
};

Lemming.prototype.updatePhysics = function() {
	if(this.body.onFloor()) {
		if(!this.action.active) {
			this.animations.play("move", 15);
			this.body.velocity.x = 30;
		}
		this.body.velocity.y = 1;
	}
	else {
		this.action.clear();
		this.animations.play("fall", 15);
		this.body.velocity.x = 0;
		this.body.velocity.y = 100;
	}
};

Lemming.prototype.setAction = function(actionName) {
	if(actionName != this.action.name) {
		switch(actionName) {
			// SET ACTION: Walk
			case "walker":
			if(this.onFloor()) {
				this.action.name = "";
				this.action.value = 0;
				this.action.active = false;
			}
			break;
			// SET ACTION: Build
			case "builder":
			// Requires the lemming to be on the floor
			if(this.onFloor()) {
				this.state.expendAction(actionName, 1);
				game.sound.play("sndAction");
				// Set action
				this.action.name = actionName;
				this.action.active = true;
				this.action.value = 5;
				this.animations.play("build", 15);
				// Set timer
				var timer = new Alarm(game, 120, function() {
					this.proceedBuild();
				}, this);
				// Set velocity
				this.velocity.x = 0;
			}
			break;
		}
	}
};

Lemming.prototype.proceedBuild = function() {
	this.action.value--;
	if(this.action.value === 0) {
		// Stop building
		this.animations.play("build_end", 10);
		this.animations.currentAnim.onComplete.addOnce(function() {
			this.setAction("walker");
		}, this);
	}
	else {
		var timer = new Alarm(game, 120, function() {
			this.proceedBuild();
		}, this);
	}
	// Build a step
	this.x += (this.tile.width * this.dir);
	this.y -= this.tile.height;
	this.tileLayer.setType(this.tile.x(this.x), this.tile.y(this.y + (this.tile.height * 0.5)), 1);
};