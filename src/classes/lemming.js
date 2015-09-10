var Lemming = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, "lemming");
	game.add.existing(this);
	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});
	this.state.levelGroup.add(this);

	this.animationProperties = {};

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
		},
		alarm: null
	}

	// Set input
	// this.inputEnabled = true;
	// this.events.onInputDown.add(function() {
	// 	this.setAction(this.state.actions.current.name);
	// }, this);

	// Set anchor
	this.anchor.setTo(0.5, 1);

	this.dir = 1;
	this.velocity = {
		x: 0,
		y: 0
	};
	this.bbox = {
		get left() {
			return this.owner.x - Math.abs(this.owner.offsetX);
		},
		get top() {
			return this.owner.y - Math.abs(this.owner.offsetY);
		},
		get right() {
			return this.owner.x + (Math.abs(this.owner.width) - Math.abs(this.owner.offsetX));
		},
		get bottom() {
			return this.owner.y + (Math.abs(this.owner.height) - Math.abs(this.owner.offsetY));
		},
		owner: null
	};
	this.bbox.owner = this;
	this.tile = {
		get width() {
			return this.parent.state.map.tilewidth;
		},
		get height() {
			return this.parent.state.map.tileheight;
		},
		x: function(checkX) {
			return Math.floor(checkX / this.width);
		},
		y: function(checkY) {
			return Math.floor(checkY / this.height);
		},
		type: function(tileX, tileY) {
			return this.parent.state.layers.tileLayer.getTileType(tileX, tileY);
		}
	};
	this.tile.parent = this;
	Object.defineProperty(this, "tileLayer", {get: function() {
		return this.state.layers.tileLayer;
	}});

	// Set animations
	this.addAnim("fall", "Fall", 4, {x: 0, y: 0});
	this.addAnim("move", "Move", 10, {x: 0, y: 0});
	this.addAnim("mine", "Mine", 24, {x: 0, y: 8});
	this.addAnim("build", "Build", 16, {x: 0, y: 0});
	this.addAnim("build_end", "BuildEnd", 10, {x: 0, y: 0}, false);
	this.addAnim("bash", "Bash", 32, {x: 0, y: 0});
	this.addAnim("dig", "Dig", 8, {x: 0, y: 4});
	this.playAnim("fall", 15);
	this.velocity.y = 1;

	this.objectType = "lemming";

	this.cursor = {
		selected: false,
		sprite: null
	};
};

Lemming.prototype = Object.create(Phaser.Sprite.prototype);
Lemming.prototype.constructor = Lemming;

Lemming.prototype.mouseOver = function() {
	var cursor = this.state.getWorldCursor();
	return (cursor.x >= this.bbox.left &&
		cursor.x <= this.bbox.right &&
		cursor.y >= this.bbox.top &&
		cursor.y <= this.bbox.bottom);
};

Lemming.prototype.cursorDeselect = function() {
	if(this.cursor.selected) {
		this.cursor.selected = false;
		this.state.lemmingSelected = null;
		if(this.cursor.sprite != null) {
			this.cursor.sprite.destroy();
			this.cursor.sprite = null;
		}
	}
};

Lemming.prototype.cursorSelect = function() {
	if(!this.cursor.selected) {
		this.cursor.selected = true;
		this.state.lemmingSelected = this;
		if(this.cursor.sprite == null) {
			this.cursor.sprite = new Cursor(game, this.x, this.y, this);
			this.cursor.sprite.reposition();
		}
	}
};

Lemming.prototype.onFloor = function() {
	return (this.tile.type(this.tile.x(this.x), this.tile.y(this.y)) > 0 ||
		this.tile.type(this.tile.x(this.x), this.tile.y(this.y) - 1) > 0);
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
		if(this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1)) > 0 &&
			this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1 - this.tile.height)) === 0) {
			this.y -= this.tile.height;
		}
		// Check walk against wall
		else if(this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1)) > 0 &&
			this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1 - this.tile.height)) > 0) {
			// Turn around
			this.turnAround();
		}
		// Play animation
		this.playAnim("move", 15);
	}
	// Bashing
	else if(this.onFloor() && this.action.name === "basher" && !this.action.idle) {
		// Remove tile in front of lemming
		var alarm = new Alarm(this.game, 30, function() {
			this.setAction("walker");
		}, this);
		if(this.state.layers.primitiveLayer.removeTile(this.tile.x(this.x + ((this.tile.width * 0.5) * this.dir)), this.tile.y(this.y - 1)) ||
			this.state.layers.tileLayer.getTileType(this.tile.x(this.x + ((this.tile.width * 0.5) * this.dir)), this.tile.y(this.y - 1)) == 1 ||
			this.state.layers.tileLayer.getTileType(this.tile.x(this.x + ((this.tile.width * 1.5) * this.dir)), this.tile.y(this.y - 1)) == 1) {
			alarm.cancel();
		}
	}
	else if(!this.onFloor()) {
		this.velocity.x = 0;
		this.velocity.y = 1.5;
		this.playAnim("fall", 15);
		this.clearAction();
	}
};

Lemming.prototype.addAnim = function(key, animName, numFrames, offsets, loop) {
	if(!offsets) {
		offsets = {x: 0, y: 0};
	}
	if(loop === undefined) {
		loop = true;
	}
	var a, frames = [];
	for(a = 0;a < numFrames;a += 1) {
		var anim = "sprLemming_" + animName + "_" + a.toString() + ".png";
		frames.push(anim);
	}
	this.animations.add(key, frames, 60, loop);
	this.animationProperties[key] = {
		offset: offsets
	};
};

Lemming.prototype.playAnim = function(key, frameRate) {
	this.animations.play(key, frameRate);
	this.anchor.setTo(
		0.5 - (this.animationProperties[key].offset.x / this.width),
		1 - (this.animationProperties[key].offset.y / this.height)
	);
};

Lemming.prototype.clearAction = function() {
	this.action.name = "";
	this.action.value = 0;
	this.action.active = false;
	if(this.action.alarm) {
		this.action.alarm.cancel();
	}
};

Lemming.prototype.setAction = function(actionName) {
	if(actionName != this.action.name) {
		switch(actionName) {
			// SET ACTION: Walk
			case "walker":
			if(this.onFloor()) {
				this.clearAction();
			}
			break;
			// SET ACTION: Build
			case "builder":
			if(this.onFloor()) {
				this.clearAction();
				this.state.expendAction(actionName, 1);
				game.sound.play("sndAction");
				// Set action
				this.action.name = actionName;
				this.action.active = true;
				this.action.value = 5;
				this.playAnim("build", 15);
				// Set timer
				this.action.alarm = new Alarm(game, 120, function() {
					this.proceedBuild();
				}, this);
				// Set velocity
				this.velocity.x = 0;
			}
			break;
			// SET ACTION: Basher
			case "basher":
			if(this.onFloor()) {
				this.clearAction();
				this.state.expendAction(actionName, 1);
				game.sound.play("sndAction");
				// Set action
				this.action.name = actionName;
				this.action.active = true;
				this.action.value = 0;
				this.playAnim("bash", 15);
				// Set velocity
				this.velocity.x = 0.2 * this.dir;
			}
			break;
			// SET ACTION: Digger
			case "digger":
			if(this.onFloor()) {
				this.clearAction();
				this.state.expendAction(actionName, 1);
				game.sound.play("sndAction");
				// Set action
				this.action.name = actionName;
				this.action.active = true;
				this.action.value = 0;
				this.playAnim("dig", 15);
				// Set velocity
				this.velocity.x = 0;
				// Set alarm
				this.action.alarm = new Alarm(this.game, 120, function() {
					this.proceedDig();
				}, this);
			}
			break;
			// SET ACTION: Miner
			case "miner":
			if(this.onFloor()) {
				this.clearAction();
				this.state.expendAction(actionName, 1);
				game.sound.play("sndAction");
				// Set action
				this.action.name = actionName;
				this.action.active = true;
				this.action.value = 0;
				this.playAnim("mine", 15);
				// Set velocity
				this.velocity.x = 0;
				// Set alarm
				this.action.alarm = new Alarm(this.game, 150, function() {
					this.proceedMine();
				}, this);
			}
			break;
		}
	}
};

Lemming.prototype.proceedBuild = function() {
	if(this.action.name == "builder" && !this.action.idle) {
		this.action.value--;
		if(this.action.value === 0) {
			// Stop building
			this.playAnim("build_end", 10);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.setAction("walker");
			}, this);
		}
		else {
			this.action.alarm = new Alarm(game, 120, function() {
				this.proceedBuild();
			}, this);
		}
		// Build a step
		this.x += (this.tile.width * this.dir);
		this.y -= this.tile.height;
		var locChange = {
			x: this.tile.x(this.x),
			y: this.tile.y(this.y + (this.tile.height * 0.5))
		};
		this.state.layers.primitiveLayer.placeTile(locChange.x, locChange.y, "tilesetPlaceables", new Phaser.Rectangle(32, 16, this.tile.width, this.tile.height), 1);
	}
};

Lemming.prototype.proceedDig = function() {
	if(this.action.name == "digger" && !this.action.idle) {
		this.state.layers.primitiveLayer.removeTile(this.tile.x(this.x), this.tile.y(this.y + 1));
		this.y += this.tile.height;
		// Set up new alarm
		this.action.alarm = new Alarm(this.game, 120, function() {
			this.proceedDig();
		}, this);
	}
};

Lemming.prototype.proceedMine = function() {
	if(this.action.name == "miner" && !this.action.idle) {
		this.state.layers.primitiveLayer.removeTile(this.tile.x(this.x), this.tile.y(this.y + 1));
		this.state.layers.primitiveLayer.removeTile(this.tile.x(this.x + (this.tile.width * this.dir)), this.tile.y(this.y + 1));
		this.x += (this.tile.width * this.dir);
		this.y += this.tile.height;
		// Set up new alarm
		this.action.alarm = new Alarm(this.game, 150, function() {
			this.proceedMine();
		}, this);
	}
};