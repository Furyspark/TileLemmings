(function(Phaser) {
var Camera = function(game, state) {
	this.game = game;
	this.state = state;

	this.scrolling = false;
	Object.defineProperty(this, "gameCamera", {get() {
		return this.game.camera;
	}});

	Object.defineProperties(this, {
		"width": {
			get() {
				return this.gameCamera.width / this.state.zoom;
			}
		},
		"height": {
			get() {
				return this.gameCamera.height / this.state.zoom;
			}
		},
		"x": {
			get() {
				return this.gameCamera.x / this.state.zoom;
			}
		},
		"y": {
			get() {
				return this.gameCamera.y / this.state.zoom;
			}
		}
	});
};

Camera.prototype.constructor = Camera;

Camera.prototype.move = function(hor, ver) {
	this.gameCamera.x += hor;
	this.gameCamera.y += ver;
	// Move UI
	for(var a = 0;a < this.state.guiGroup.length;a++) {
		var uiNode = this.state.guiGroup[a];
		uiNode.x = this.gameCamera.x + uiNode.guiAlign.x;
		uiNode.y = this.gameCamera.y + uiNode.guiAlign.y;
	}
};
var Alarm = function(game, duration, callback, callbackContext) {
	this.game = game;
	this.duration = duration;
	this.callback = callback;
	this.callbackContext = callbackContext;

	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});
	Object.defineProperty(this, "paused", {get() {
		if(this.state.paused) {
			return this.state.paused;
		}
		return false;
	}});

	this.addToGame();
};

Alarm.prototype.constructor = Alarm;

Alarm.prototype.addToGame = function() {
	// Add to alarms list
	this.state.alarms.data.push(this);
};

Alarm.prototype.step = function() {
	if(!this.paused) {
		if(this.duration > 0) {
			this.duration--;
			if(this.duration <= 0) {
				if(this.callbackContext) {
					this.fire();
				}
				this.state.alarms.remove(this);
			}
		}
	}
};

Alarm.prototype.cancel = function() {
	this.state.alarms.remove(this);
};

Alarm.prototype.fire = function() {
	this.callback.call(this.callbackContext);
};
var GUI = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);

	// Set references
	this.guiType = "undefined";
	this.subType = "";
	this.state = this.game.state.getCurrentState();
};

GUI.prototype = Object.create(Phaser.Sprite.prototype);
GUI.prototype.constructor = GUI;
var GUI_Button = function(game, x, y) {
	GUI.call(this, game, x, y);

	// Load base texture
	this.loadTexture("gui");

	// Initialization
	this.guiType = "button";
	this.subType = "";
	this.action = "";
	this.pressed = false;
	this.inputEnabled = true;

	// Create label
	this.label = game.add.text(0, 0, "", {
		font: "bold 12px Arial", fill: "#ffffff", boundsAlignH: "center"
	});
	this.label.stroke = "#000000";
	this.label.strokeThickness = 3;
	this.label.owner = this;
	this.label.anchor.set(0.5);
	this.label.reposition = function() {
		this.x = this.owner.x + (this.owner.width / 2);
		this.y = this.owner.y + 10;
	};

	// Create bounding box(for cursor position checking)
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

	this.label.text = "";
	this.label.reposition();

	// Set on press action
	this.events.onInputDown.add(function() {
		this.select(true);
	}, this);
};

GUI_Button.prototype = Object.create(GUI.prototype);
GUI_Button.prototype.constructor = GUI_Button;

GUI_Button.prototype.mouseOver = function() {
	var cursor = this.state.getWorldCursor();
	cursor.x = cursor.x * this.state.zoom;
	cursor.y = cursor.y * this.state.zoom;
	return (cursor.x >= this.bbox.left &&
		cursor.x <= this.bbox.right &&
		cursor.y >= this.bbox.top &&
		cursor.y <= this.bbox.bottom);
};

// Set button type and action
GUI_Button.prototype.set = function(stateObject, action, subType) {
	this.action = action;
	this.subType = subType;

	this.animations.add("up", [stateObject.released], 15, false);
	this.animations.add("down", [stateObject.pressed], 15, false);
	this.animations.play("up");
};

GUI_Button.prototype.update = function() {
	this.label.reposition();
};

GUI_Button.prototype.select = function(makeSound) {
	makeSound = makeSound || false;

	if(this.subType == "action") {
		this.state.deselectAllActions();
	}

	this.doAction();

	this.pressed = true;
	this.animations.play("down");
	if(makeSound) {
		game.sound.play("sndUI_Click");
	}
};

GUI_Button.prototype.deselect = function() {
	this.pressed = false;
	this.animations.play("up");
};

GUI_Button.prototype.doAction = function() {
	switch(this.subType) {
		case "action":
		for(var a in this.state.actions.items) {
			var item = this.state.actions.items[a];
			if(item.name == this.action) {
				this.state.actions.select = a;
			}
		}
		break;
	}
};
var Cursor = function(game, x, y, owner) {
	Phaser.Sprite.call(this, game, x, y, "misc");
	this.game.add.existing(this);
	this.owner = owner;
	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}})
	this.state.levelGroup.add(this);

	this.anchor.setTo(0.5, 0.5);
	this.animations.add("hover", ["sprCursor_Open.png"]);
	this.animations.play("hover");
};

Cursor.prototype = Object.create(Phaser.Sprite.prototype);
Cursor.prototype.constructor = Cursor;

Cursor.prototype.reposition = function() {
	this.x = this.owner.left + ((this.owner.right - this.owner.left) * 0.5);
	this.y = this.owner.top + ((this.owner.bottom - this.owner.top) * 0.5);
};

Cursor.prototype.destroy = function() {
	for(var a in this.state.levelGroup.children) {
		var obj = this.state.levelGroup.children[a];
		if(obj === this) {
			this.state.levelGroup.removeChild(this);
		}
	}
	this.kill();
};
var GameLabel = function(game, owner, x, y, offsetObj, defaultText) {
	defaultText = defaultText || "";
	this.owner = owner;
	this.offset = offsetObj;
	this.defaultStyle = {
		font: "bold 12pt Arial",
		fill: "#FFFFFF",
		boundsAlignH: "center",
		stroke: "#000000",
		strokeThickness: 3
	};
	Phaser.Text.call(this, game, x, y, defaultText, this.defaultStyle);
	this.game = game;

	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});

	this.state.levelGroup.add(this);

	this.reposition();
};

GameLabel.prototype = Object.create(Phaser.Text.prototype);
GameLabel.prototype.constructor = GameLabel;

GameLabel.prototype.remove = function() {
	this.state.levelGroup.removeChild(this);
};

GameLabel.prototype.update = function() {
	this.reposition();
};

GameLabel.prototype.reposition = function() {
	this.x = this.owner.x + this.offset.x;
	this.y = this.owner.y + this.offset.y;
	this.setTextBounds(-(this.width * 0.5), -(this.height), this.width, this.height);
};
var Tile = function(game, x, y, key, cropping) {
	Phaser.Image.call(this, game, x, y, key);
	this.game = game;
	this.game.add.existing(this);

	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});
	this.tile = {
		get x() {
			return Math.floor(this.owner.x / this.owner.state.map.tilewidth);
		},
		get y() {
			return Math.floor(this.owner.y / this.owner.state.map.tileheight);
		}
	};
	this.tile.owner = this;
	// Add to scale group
	this.state.levelGroup.add(this);

	// Crop
	this.crop(cropping, false);
};

Tile.prototype = Object.create(Phaser.Image.prototype);
Tile.prototype.constructor = Tile;

Tile.prototype.destroy = function(removeCol) {
	if(removeCol == undefined) {
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
			this.kill();
		}
	}
};
var Lemming = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, "lemming");
	game.add.existing(this);
	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});
	this.state.levelGroup.add(this);

	this.dead = false;
	this.animationProperties = {};

	// Set up action
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

	// Set up sub action
	this.subaction = {
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
	},

	this.gameLabel = null;

	// Set anchor
	this.anchor.setTo(0.5, 1);

	this.dir = 1;
	this.velocity = {
		x: 0,
		y: 0
	};
	this.fallDist = 0;
	this.bbox = {
		// get left() {
		// 	return this.owner.x - Math.abs(this.owner.offsetX);
		// },
		// get top() {
		// 	return this.owner.y - Math.abs(this.owner.offsetY);
		// },
		// get right() {
		// 	return this.owner.x + (Math.abs(this.owner.width) - Math.abs(this.owner.offsetX));
		// },
		// get bottom() {
		// 	return this.owner.y + (Math.abs(this.owner.height) - Math.abs(this.owner.offsetY));
		// },
		get left() {
			return this.owner.x - 4;
		},
		get top() {
			return this.owner.y - 16;
		},
		get right() {
			return this.owner.x + 4;
		},
		get bottom() {
			return this.owner.y;
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
	this.addAnim("splat", "FallDeath", 16, {x: 0, y: 0}, false);
	this.addAnim("block", "Block", 16, {x: 0, y: 0});
	this.addAnim("explode", "Explode", 16, {x: 0, y: 0}, false);
	this.playAnim("fall", 15);
	this.velocity.y = 1;

	this.objectType = "lemming";

	this.cursor = {
		selected: false,
		sprite: null
	};
};

Lemming.DEATHTYPE_OUT_OF_ROOM = 0;
Lemming.DEATHTYPE_FALL = 1;

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

	if(!this.dead) {
		if(this.onFloor() && this.action.idle) {
			// Fall death
			if(this.fallDist >= this.state.map.properties.falldist) {
				this.die(Lemming.DEATHTYPE_FALL);
			}
			else {
				this.fallDist = 0;
				// Adjust velocity
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
		}
		// Bashing
		else if(this.onFloor() && this.action.name === "basher" && !this.action.idle) {
			// Remove tile in front of lemming
			var alarm = new Alarm(this.game, 30, function() {
				this.setAction("walker");
			}, this);
			var bashResult = this.state.map.removeTile(this.tile.x(this.x + ((this.tile.width * 0.5) * this.dir)), this.tile.y(this.y - 1));
			if(bashResult === 0 ||
				this.state.layers.tileLayer.getTileType(this.tile.x(this.x + ((this.tile.width * 0.5) * this.dir)), this.tile.y(this.y - 1)) == 1 ||
				this.state.layers.tileLayer.getTileType(this.tile.x(this.x + ((this.tile.width * 1.5) * this.dir)), this.tile.y(this.y - 1)) == 1) {
				alarm.cancel();
			}
			else if(bashResult === 2) {
				alarm.cancel;
				this.game.sound.play("sndChink");
				this.clearAction();
			}
		}
		else if(!this.onFloor()) {
			this.velocity.x = 0;
			this.velocity.y = 1.5;
			this.playAnim("fall", 15);
			this.clearAction();
			this.fallDist += Math.abs(this.velocity.y);
		}

		// Detect blockers
		if(this.action.name !== "blocker") {
			var objs = this.detectByAction(this.x + this.velocity.x, this.y - 1, "blocker");
			for(var a = 0;a < objs.length;a++) {
				var obj = objs[a];
				if((obj.bbox.left > this.x && this.dir == 1) || (obj.bbox.right < this.x && this.dir == -1)) {
					this.turnAround();
				}
			}
		}

		// Die outside room
		if(this.isOutsideLevel()) {
			this.die(Lemming.DEATHTYPE_OUT_OF_ROOM);
		}
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
	// Remove lemming from action group
	var group = this.state.lemmingsGroup[this.action.name];
	if(group) {
		var done = false;
		for(var a = 0;a < group.length && !done;a++) {
			var obj = group[a];
			if(obj === this) {
				group.splice(a, 1);
				done = true;
			}
		}
	}
	// Clear action
	this.action.name = "";
	this.action.value = 0;
	this.action.active = false;
	if(this.action.alarm) {
		this.action.alarm.cancel();
	}
};

Lemming.prototype.setAction = function(actionName) {
	// Normal actions
	if(actionName != this.action.name && (this.action.name !== "blocker" || (this.action.idle && actionName === "blocker"))) {
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
				// Set velocity
				this.velocity.x = 0;
				// Add to list of builders
				this.state.lemmingsGroup[actionName].push(this);
				// Set timer
				this.action.alarm = new Alarm(game, 120, function() {
					this.proceedBuild();
				}, this);
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
				// Add to list of bashers
				this.state.lemmingsGroup[actionName].push(this);
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
				// Add to list of diggers
				this.state.lemmingsGroup[actionName].push(this);
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
				// Add to list of miners
				this.state.lemmingsGroup[actionName].push(this);
				// Set alarm
				this.action.alarm = new Alarm(this.game, 150, function() {
					this.proceedMine();
				}, this);
			}
			break;
			// SET ACTION: Blocker
			case "blocker":
			if(this.onFloor()) {
				this.clearAction();
				this.state.expendAction(actionName, 1);
				game.sound.play("sndAction");
				// Set action
				this.action.name = actionName;
				this.action.active = true;
				this.action.value = 0;
				this.playAnim("block", 15);
				// Set velocity
				this.velocity.x = 0;
				// Add to list of blockers
				this.state.lemmingsGroup[actionName].push(this);
			}
			break;
		}
	}
	// Sub action
	if(this.subaction.name != actionName) {
		switch(actionName) {
			// SET SUBACTION: Exploder
			case "exploder":
			this.subaction.clear();
			this.state.expendAction(actionName, 1);
			game.sound.play("sndAction");
			// Set action
			this.subaction.name = actionName;
			this.subaction.active = true;
			this.subaction.value = 5;
			// Create label
			this.gameLabel = new GameLabel(this.game, this, this.x, this.y, {x: 0, y: -((this.bbox.bottom - this.bbox.top) + 8)}, "5");
			// Create alarm
			this.subaction.alarm = new Alarm(this.game, 60, function() {
				this.proceedExplode();
			}, this);
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
			var moveTo = {
				x: this.x + (this.tile.width * this.dir),
				y: (this.y - this.tile.height)
			};
			var locChange = {
				x: this.x + (this.tile.width * this.dir),
				y: this.y - 1
			};
			// See whether we can build a step
			if(this.tile.type(this.tile.x(moveTo.x), this.tile.y(moveTo.y - 1)) == 0 &&
				this.tile.type(this.tile.x(locChange.x), this.tile.y(locChange.y)) == 0) {
				// Build a step
				this.x = moveTo.x;
				this.y = moveTo.y;
				this.state.layers.primitiveLayer.placeTile(this.tile.x(locChange.x), this.tile.y(locChange.y), "tilesetPlaceables", new Phaser.Rectangle(32, 16, this.tile.width, this.tile.height), 1);
				// Set alarm
				this.action.alarm = new Alarm(game, 120, function() {
					this.proceedBuild();
				}, this);
			}
			// Otherwise turn around and stop building
			else {
				this.setAction("walker");
				this.turnAround();
			}
		}
	}
};

Lemming.prototype.proceedDig = function() {
	if(this.action.name == "digger" && !this.action.idle) {
		var result = this.state.map.removeTile(this.tile.x(this.x), this.tile.y(this.y + 1));
		if(result === 2) {
			this.game.sound.play("sndChink");
			this.clearAction();
		}
		else {
			this.y += this.tile.height;
			// Set up new alarm
			this.action.alarm = new Alarm(this.game, 120, function() {
				this.proceedDig();
			}, this);
		}
	}
};

Lemming.prototype.proceedMine = function() {
	if(this.action.name == "miner" && !this.action.idle) {
		var result = this.state.map.removeTile(this.tile.x(this.x), this.tile.y(this.y + 1));
		if(result === 2) {
			game.sound.play("sndChink");
			this.clearAction();
		}
		else {
			result = this.state.map.removeTile(this.tile.x(this.x + (this.tile.width * this.dir)), this.tile.y(this.y + 1));
			if(result === 2) {
				game.sound.play("sndChink");
				this.clearAction();
			}
			else {
				this.x += (this.tile.width * this.dir);
				this.y += this.tile.height;
				// Set up new alarm
				this.action.alarm = new Alarm(this.game, 150, function() {
					this.proceedMine();
				}, this);
			}
		}
	}
};

Lemming.prototype.proceedExplode = function() {
	if(this.subaction.name === "exploder" && !this.subaction.idle) {
		this.subaction.value--;
		if(this.subaction.value <= 0) {
			this.gameLabel.remove();
			this.gameLabel = null;
			if(this.onFloor()) {
				this.game.sound.play("sndOhNo");
				this.dead = true;
				this.playAnim("explode", 15);
				this.velocity.x = 0;
				this.animations.currentAnim.onComplete.addOnce(function() {
					this.explode();
				}, this);
			}
			else {
				this.explode();
			}
		}
		else {
			this.gameLabel.text = this.subaction.value.toString();
			this.subaction.alarm = new Alarm(this.game, 60, function() {
				this.proceedExplode();
			}, this);
		}
	}
};

Lemming.prototype.explode = function() {
	game.sound.play("sndPop");
	// Get radius
	// var tilesInRadius = [];
	// var d = 3 - (2 * radius);
	// var a = 0;
	// var b = radius;

	// if(d < 0) {
	// 	d = d + (4 * a) + 6;
	// }
	// else {
	// 	while(b > a) {
	// 		d = d + 4 * (a - b) + 10;
	// 		b--;
	// 	}
	// }
	// Remove 3x3 tiles
	for(var a = -1;a <= 1;a++) {
		for(var b = -1;b <= 1;b++) {
			var xCheck = this.tile.x(this.x) + a;
			var yCheck = this.tile.y(this.y - (this.tile.height * 0.5)) + b;
			this.state.map.removeTile(xCheck, yCheck);
		}
	}
	// Remove self
	this.remove();
};

Lemming.prototype.detectByAction = function(xCheck, yCheck, actionName) {
	var group = this.state.lemmingsGroup[actionName];
	var result = [];
	if(group) {
		for(var a = 0;a < group.length;a++) {
			var obj = group[a];
			if(xCheck >= obj.bbox.left && xCheck <= obj.bbox.right &&
				yCheck >= obj.bbox.top && yCheck <= obj.bbox.bottom) {
				result.push(obj);
			}
		}
	}
	return result;
};

Lemming.prototype.isOutsideLevel = function() {
	return (this.x < 0 || this.x > this.state.map.totalwidth ||
		this.y < 0 || this.y > this.state.map.totalheight);
};

Lemming.prototype.die = function(deathType) {
	this.dead = true;
	this.velocity.x = 0;
	this.velocity.y = 0;
	switch(deathType) {
		// DEATH ACTION: Out of room
		case Lemming.DEATHTYPE_OUT_OF_ROOM:
		this.game.sound.play("sndDie");
		this.remove();
		break;
		// DEATH ACTION: Fall death
		case Lemming.DEATHTYPE_FALL:
		this.game.sound.play("sndSplat");
		this.playAnim("splat", 15);
		this.animations.currentAnim.onComplete.addOnce(function() {
			this.remove();
		}, this);
		break;
	}
};

Lemming.prototype.remove = function() {
	// Remove label
	if(this.gameLabel) {
		this.gameLabel.remove();
	}
	// Remove from state's group
	var done = false;
	for(var a = 0;a < this.state.lemmingsGroup.all.length && !done;a++) {
		var lem = this.state.lemmingsGroup.all[a];
		if(lem === this) {
			this.state.lemmingsGroup.all.splice(a, 1);
			done = true;
		}
	}
	// Kill self
	this.destroy();
};
var Prop = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);
	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});
	this.state.levelGroup.add(this);

	this.objectType = "prop";
};

Prop.prototype = Object.create(Phaser.Sprite.prototype);
Prop.prototype.constructor = Prop;

Prop.prototype.setAsDoor = function(type, lemmings, rate, lemmingsGroup) {
	// Set primary data
	this.objectType = "door";
	this.lemmingsGroup = lemmingsGroup;
	
	// Set configuration
	var doorConfig = game.cache.getJSON("config").props.doors[type];
	this.loadTexture(doorConfig.atlas);
	var a, openingFrames = [], idleFrames = [], openFrames = [];
	for(a = 0;a < doorConfig.frames;a++) {
		var anim = doorConfig.animName + a.toString() + ".png";
		if(a == 0) {
			idleFrames.push(anim);
		}
		if(a == doorConfig.frames - 1) {
			openFrames.push(anim);
		}
		openingFrames.push(anim);
	}

	// Set class variables
	this.spawnTimer = game.time.create(false);
	this.lemmings = lemmings;
	this.rate = Math.max(10, rate);

	// Set animation
	this.animations.add("opening", openingFrames, 15, false);
	this.animations.add("idle", idleFrames, 15, false);
	this.animations.add("open", openFrames, 15, false);
	this.animations.play("idle", 15);

	// Set functions
	this.openDoor = function() {
		this.animations.getAnimation("opening").onComplete.addOnce(function() {
			this.animations.play("open", 15);
			// Create additional timer
			var timer = game.time.create(true);
			timer.add(500, function() {
				this.opened();
				this.state.playLevelBGM();
			}, this);
			timer.start();
		}, this);
		this.animations.play("opening", 15);
	};
	this.opened = function() {
		this.spawnTimer.loop(this.rate, function() {
			if(this.lemmings > 0) {
				this.lemmings--;
				var lem = new Lemming(this.game, this.x, this.y + 30);
				this.lemmingsGroup.push(lem);
			}
		}, this)
		this.spawnTimer.start();
	};

	// Set anchor
	this.anchor.setTo(0.5, 0);
};
var bootState = {
	preload: function() {
		this.loadAssetList("./assets/asset_list.json");
	},

	loadAssetList: function(assetListFilename) {
		game.load.json("assetList", assetListFilename);

		// List file loaded
		game.load.onFileComplete.addOnce(function(progress, fileKey, success, totalLoadedFiles, totalFiles) {
			if(fileKey === "assetList" && success) {
				this.loadAssets();
			}
		}, this);
	},

	loadAssets: function() {
		var assetList = game.cache.getJSON("assetList");

		// Add callback for Finish Loading
		game.load.onLoadComplete.addOnce(function() {
			game.state.start("game");
		}, this);


		// Load sprites
		var a, curAsset, curList = assetList.sprites;
		for(a in curList) {
			curAsset = curList[a];
			game.load.spritesheet(curAsset.key, curAsset.url, curAsset.frameWidth, curAsset.frameHeight);
		}

		// Load sprite atlases
		curList = assetList.sprite_atlases;
		for(a in curList) {
			curAsset = curList[a];
			game.load.atlasJSONHash(curAsset.key, curAsset.url, curAsset.atlasUrl);
		}

		// Load images
		curList = assetList.images;
		for(a in curList) {
			curAsset = curList[a];
			game.load.image(curAsset.key, curAsset.url);
		}

		// Load sounds
		curList = assetList.sounds;
		for(a in curList) {
			curAsset = curList[a];
			game.load.audio(curAsset.key, curAsset.url);
		}

		// Load tilemaps
		curList = assetList.tilemaps;
		for(a in curList) {
			curAsset = curList[a];
			game.load.tilemap(curAsset.key, curAsset.url, null, Phaser.Tilemap.TILED_JSON);
		}

		// Load JSON
		curList = assetList.json;
		for(a in curList) {
			curAsset = curList[a];
			game.load.json(curAsset.key, curAsset.url);
		}
	}
};
var gameState = {
	map: null,
	zoom: 1,
	layers: {
		tileLayer: {
			data: [],
			state: null,
			setType: function(tileX, tileY, type) {
				if(tileX < 0 || tileX > this.state.map.width ||
					tileY < 0 || tileY > this.state.map.height) {
					return false;
				}
				this.data[this.getIndex(tileX, tileY)] = type;
				return true;
			},
			logTiles: function() {
				var str = "";
				for(var a in this.data) {
					str += this.data[a];
					if(a % this.state.map.width == this.state.map.width-1) {
						str += "\n";
					}
				}
				console.log(str);
			},
			getIndex: function(tileX, tileY) {
				return Math.floor((tileX % this.state.map.width) + (tileY * this.state.map.width));
			},
			getTileType: function(tileX, tileY) {
				if(tileX < 0 || tileX > this.state.map.width ||
					tileY < 0 || tileY > this.state.map.height) {
					return 0;
				}
				return this.data[this.getIndex(tileX, tileY)];
			}
		},
		primitiveLayer: {
			data: [],
			state: null,
			getTile: function(tileX, tileY) {
				return this.data[this.getIndex(tileX, tileY)];
			},
			getIndex: function(tileX, tileY) {
				return Math.floor((tileX % this.state.map.width) + (tileY * this.state.map.width));
			},
			removeTile: function(tileX, tileY) {
				var testTile = this.getTile(tileX, tileY);
				if(testTile != null) {
					testTile.destroy();
					return true;
				}
				return false;
			},
			placeTile: function(tileX, tileY, imageKey, cutout, tileType) {
				var tempTile = new Tile(game,
					(tileX * this.state.map.tilewidth),
					(tileY * this.state.map.tileheight),
					imageKey,
					cutout);
				this.replaceTile(tileX, tileY, tempTile);
				if(tileType != undefined) {
					this.state.layers.tileLayer.setType(tileX, tileY, tileType);
					return true;
				}
				return false;
			},
			replaceTile: function(tileX, tileY, newTile) {
				this.removeTile(tileX, tileY);
				this.data[this.getIndex(tileX, tileY)] = newTile;
			}
		}
	},
	bgm: null,
	lemmingSelected: null,

	scrollOrigin: {
		x: 0,
		y: 0
	},

	tileLayer: null,
	levelGroup: null,
	lemmingsGroup: {
		all: []
	},
	doorsGroup: [],
	exitsGroup: [],
	trapsGroup: [],
	guiGroup: [],
	alarms: {
		data: [],
		remove: function(alarm) {
			var found = false;
			for(var a = 0;a < this.data.length && !found;a++) {
				var curAlarm = this.data[a];
				if(curAlarm == alarm) {
					found = true;
					this.data.splice(a, 1);
				}
			}
			delete alarm;
		}
	},

	actions: {
		items: [
			{
				name: "climber",
				amount: 0,
				button: null
			},
			{
				name: "floater",
				amount: 0,
				button: null
			},
			{
				name: "exploder",
				amount: 0,
				button: null
			},
			{
				name: "blocker",
				amount: 0,
				button: null
			},
			{
				name: "builder",
				amount: 0,
				button: null
			},
			{
				name: "basher",
				amount: 0,
				button: null
			},
			{
				name: "miner",
				amount: 0,
				button: null
			},
			{
				name: "digger",
				amount: 0,
				button: null
			}
		],
		select: -1,
		get current() {
			return this.items[this.select];
		}
	},

	preload: function() {
		// Preload map data
		game.load.json("level", "assets/levels/level1.json");
	},

	create: function() {
		this.layers.tileLayer.state = this;
		this.layers.primitiveLayer.state = this;
		// Create groups
		this.levelGroup = new Phaser.Group(game);
		for(var a = 0;a < this.actions.items.length;a++) {
			var act = this.actions.items[a];
			this.lemmingsGroup[act.name] = [];
		}
		
		// Create GUI
		this.createLevelGUI();

		// Create camera config
		this.cam = new Camera(this.game, this);

		// Create map
		this.map = game.cache.getJSON("level");
		this.map.owner = this;
		Object.defineProperty(this.map, "totalwidth", {get() {
			return this.width * this.tilewidth;
		}})
		Object.defineProperty(this.map, "totalheight", {get() {
			return this.height * this.tileheight;
		}});
		// Add tile functions to map
		this.map.removeTile = function(tileX, tileY, force) {
			// This function attempts to remove a tile
			// Return values:    0 if success
			//                   1 if no tile exists there
			//                   2 if hit steel
			if(typeof force === "undefined") {
				force = false;
			}
			// Don't break steel, unless forced
			if(force || this.owner.layers.tileLayer.getTileType(tileX, tileY) !== 2) {
				this.owner.layers.primitiveLayer.removeTile(tileX, tileY);
				var test = this.owner.layers.tileLayer.setType(tileX, tileY, 0);
				if(!test) {
					return 1;
				}
			}
			else if(this.owner.layers.tileLayer.getTileType(tileX, tileY) === 2) {
				return 2;
			}
			return 0;
		};
		// Set map size
		this.layers.tileLayer.width = this.map.width;
		this.layers.tileLayer.height = this.map.height;

		// Predetermine map files
		var mapFiles = [];
		if(this.map.properties.bgm) {
			mapFiles.push({
				url: "assets/audio/bgm/" + this.map.properties.bgm,
				key: "bgm",
				type: "sound"
			});
		}

		// Determine tile properties
		tileProps = {};
		for(var a = 0;a < this.map.tilesets.length;a++) {
			var tileset = this.map.tilesets[a];
			var testTileProps = tileset.tileproperties;
			if(testTileProps) {
				for(var b = tileset.firstgid;b < tileset.firstgid + tileset.tilecount;b++) {
					var baseGID = b - tileset.firstgid;
					var testProp = testTileProps[baseGID.toString()];
					if(testProp) {
						tileProps[b.toString()] = testProp;
					}
				}
			}
		}

		// Set tile layers
		this.map.objects = [];
		for(var a = 0;a < this.map.layers.length;a++) {
			var layer = this.map.layers[a];
			if(layer.name === "tiles") {
				for(var b = 0;b < layer.data.length;b++) {
					var gid = layer.data[b];
					if(gid === 0) {
						this.layers.tileLayer.data.push(0);
					}
					else {
						var props = tileProps[gid.toString()];
						if(props) {
							var tileType = 1;
							if(props.tileType) {
								tileType = parseInt(props.tileType);
							}
							this.layers.tileLayer.data.push(tileType);
						}
						else {
							this.layers.tileLayer.data.push(1);
						}
					}
				}
			}
			else if(layer.name === "objects") {
				for(var b in layer.objects) {
					this.map.objects.push(layer.objects[b]);
				}
			}
		}

		// Preload map files
		if(mapFiles.length > 0) {
			// Set load handler
			game.load.onLoadComplete.addOnce(function() {
				this.startLevel();
			}, this);

			// Load files
			for(var a in mapFiles) {
				var file = mapFiles[a];
				switch(file.type) {
					case "sound":
					game.load.audio(file.key, file.url);
					break;
				}
			}

			// Start loading
			game.load.start();
		}
		else {
			// No files needed to be loaded: start level
			this.startLevel();
		}
	},

	initMap: function() {
		// Resize map
		this.game.world.width = this.map.totalwidth;
		this.game.world.height = this.map.totalheight;

		// Describe function(s)
		this.map.getTileset = function(gid) {
			for(var a in this.tilesets) {
				var tileset = this.tilesets[a];
				if(gid >= tileset.firstgid && gid < tileset.firstgid + tileset.tilecount) {
					return tileset;
				}
			}
			return null;
		};
		// Place images
		this.map.tilesetRefs = {
			pink: "tilesetPink",
			pillar: "tilesetPillar"
		};

		// Create tiles
		for(var a in this.map.layers) {
			var layer = this.map.layers[a];
			for(var b in layer.data) {
				var gid = layer.data[b];
				if(gid > 0) {
					var tileset = this.map.getTileset(gid);
					var baseGid = gid - tileset.firstgid;
					var placeAt = {
						tile: {
							x: (b % this.map.width),
							y: Math.floor(b / this.map.width)
						},
						raw: {
							x: (b % this.map.width) * this.map.tilewidth,
							y: Math.floor(b / this.map.width) * this.map.tileheight
						}
					};
					tileset.cols = Math.floor(tileset.imagewidth / (tileset.tilewidth + tileset.spacing));
					tileset.rows = Math.floor(tileset.imageheight / (tileset.tileheight + tileset.spacing));
					var cutout = new Phaser.Rectangle(
						tileset.margin + ((tileset.tilewidth + tileset.spacing) * (baseGid % tileset.cols)),
						tileset.margin + ((tileset.tileheight + tileset.spacing) * Math.floor(baseGid / tileset.cols)),
						tileset.tilewidth,
						tileset.tileheight
					);
					var tile = new Tile(game, placeAt.raw.x, placeAt.raw.y, this.map.tilesetRefs[tileset.name], cutout);
					this.layers.primitiveLayer.data.push(tile);
				}
				else {
					this.layers.primitiveLayer.data.push(null);
				}
			}
		}

		// Set up action count
		for(var a in this.actions.items) {
			var action = this.actions.items[a];
			if(this.map.properties[action.name]) {
				this.setActionAmount(action.name, parseInt(this.map.properties[action.name]));
			}
		}

		// Set misc map properties
		if(!this.map.properties.falldist) {
			this.map.properties.falldist = (9 * this.map.tileheight);
		}
	},

	enableUserInteraction: function() {
		// Create keys
		this.keyboard = {
			left: this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
			right: this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
			up: this.game.input.keyboard.addKey(Phaser.Keyboard.UP),
			down: this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
		};


		game.input.mouse.capture = true;
		// Add action assignment possibility
		game.input.activePointer.leftButton.onDown.add(function() {
			if(this.lemmingSelected != null && this.actions.current && this.actions.current.amount > 0) {
				this.lemmingSelected.setAction(this.actions.current.name);
			}
		}, this);
		// Add right-mouse scrolling possibility
		game.input.activePointer.rightButton.onDown.add(function() {
			this.cam.scrolling = true;
			this.scrollOrigin = this.getScreenCursor();
		}, this);
		game.input.activePointer.rightButton.onUp.add(function() {
			this.cam.scrolling = false;
		}, this);
	},

	startLevel: function() {
		this.initMap();
		this.enableUserInteraction();
		this.zoomTo(2);
		// Set level stuff
		// Create groups

		// Create map layers

		// Create objects
		for(var a in this.map.objects) {
			var obj = this.map.objects[a];
			// Create door
			if(obj.type == "door") {
				var newObj = new Prop(game, (obj.x + (obj.width * 0.5)), obj.y);
				newObj.setAsDoor("classic", 50, 500, this.lemmingsGroup.all);
				this.doorsGroup.push(newObj);
			}
		}

		// Let's go... HRRRRN
		var snd = game.sound.play("sndLetsGo");
		snd.onStop.addOnce(function() {
			var timer = game.time.create(true);
			timer.add(500, function() {
				this.openDoors();
			}, this);
			timer.start();
		}, this);
	},

	getWorldCursor: function() {
		return {
			x: this.game.input.activePointer.worldX / this.zoom,
			y: this.game.input.activePointer.worldY / this.zoom
		};
	},

	getScreenCursor: function() {
		var worldCursor = this.getWorldCursor();
		return {
			x: worldCursor.x - this.cam.x,
			y: worldCursor.y - this.cam.y
		};
	},

	zoomTo: function(factor) {
		this.zoom = factor;
		this.levelGroup.scale.setTo(factor);
		this.game.camera.bounds.setTo(0, 0, Math.floor(this.map.totalwidth * this.zoom), Math.floor(this.map.totalheight * this.zoom));
	},

	update: function() {
		// Determine lemmings under mouse cursor
		var lemmingSelect = {
			data: [],
			removeBy: function(callback) {
				for(var a = this.data.length-1;a >= 0;a--) {
					var lem = this.data[a];
					if(!callback.call(lem)) {
						this.data.splice(a, 1);
					}
				}
			}
		};
		for(var a = 0;a < this.lemmingsGroup.all.length;a++) {
			var obj = this.lemmingsGroup.all[a];
			obj.cursorDeselect();
			if(obj.mouseOver()) {
				lemmingSelect.data.push(obj);
			}
		}
		// Callback for checking the right lemming
		lemmingSelect.removeBy(this.lemmingSelectableCallback);
		if(!this.cursorOverGUI() && lemmingSelect.data.length > 0) {
			lemmingSelect.data[0].cursorSelect();
		}
		delete lemmingSelect;

		// Handle alarms
		for(var a = 0;a < this.alarms.data.length;a++) {
			var alarm = this.alarms.data[a];
			alarm.step();
		}

		// Scroll
		if(this.cam.scrolling) {
			// var worldCursor = this.getWorldCursor();
			// var camPos = {
			// 	x: this.cam.x + (this.cam.width * 0.5),
			// 	y: this.cam.y + (this.cam.height * 0.5)
			// };
			// worldCursor.x = (worldCursor.x - this.cam.x) - (this.cam.width * 0.5);
			// worldCursor.y = (worldCursor.y - this.cam.y) - (this.cam.height * 0.5);
			// var moveRel = {
			// 	x: (worldCursor.x) / 10,
			// 	y: (worldCursor.y) / 10
			// };
			// this.cam.move(moveRel.x, moveRel.y);

			var originRel = this.getScreenCursor();
			var moveRel = {
				x: (this.scrollOrigin.x - originRel.x),
				y: (this.scrollOrigin.y - originRel.y)
			};
			this.scrollOrigin = this.getScreenCursor();
			this.cam.move(moveRel.x, moveRel.y);
		}
	},

	render: function() {
		
	},

	cursorOverGUI: function() {
		for(var a = 0;a < this.guiGroup.length;a++) {
			var uiNode = this.guiGroup[a];
			if(uiNode.mouseOver()) {
				return true;
			}
		}
		return false;
	},

	lemmingSelectableCallback: function() {
		// Cursors left and right
		if(this.state.keyboard.left.isDown && this.dir != -1) {
			return false;
		}
		if(this.state.keyboard.right.isDown && this.dir != 1) {
			return false;
		}
		if(this.dead ||
			this.action.name == this.state.actions.current.name ||
			this.subaction.name == this.state.actions.current.name) {
			return false;
		}
		return true;
	},

	openDoors: function() {
		var snd = game.sound.play("sndDoor");
		for(var a in this.doorsGroup) {
			var obj = this.doorsGroup[a];
			obj.openDoor();
		}
	},

	playLevelBGM: function() {
		this.playBGM("bgm");
	},

	playBGM: function(bgm) {
		this.bgm = game.sound.play(bgm, 1, true);
	},

	stopBGM: function() {
		if(this.bgm !== null) {
			this.bgm.stop();
		}
	},

	createLevelGUI: function() {
		var buttons = [];

		// Create buttons
		for(var a in this.actions.items) {
			var action = this.actions.items[a];
			var animPrefix = "Btn_" + action.name.substr(0, 1).toUpperCase() + action.name.substr(1) + "_";
			var btn = new GUI_Button(game, 0, game.camera.y + game.camera.height);
			this.guiGroup.push(btn);
			buttons.push(btn);
			btn.set({
				released: animPrefix + "0.png",
				pressed: animPrefix + "1.png"
			}, action.name, "action");

			// Assign buttons
			action.btn = btn;
		}

		// Align buttons
		var alignX = 0;
		for(var a in buttons) {
			var btn = buttons[a];
			btn.x = alignX;
			alignX += btn.width;
			btn.y -= btn.height;
			btn.guiAlign = {
				x: btn.x - game.camera.x,
				y: btn.y - game.camera.y
			};
		}
	},

	deselectAllActions: function() {
		for(var a = 0;a < this.guiGroup.length;a++) {
			var obj = this.guiGroup[a];
			if(obj.subType == "action") {
				obj.deselect();
			}
		}
	},

	expendAction: function(action, amount) {
		amount = amount || 1;

		this.setActionAmount(action, this.getActionAmount(action) - amount);
	},

	getActionAmount: function(actionName) {
		for(var a in this.actions.items) {
			var action = this.actions.items[a];
			if(action.name == actionName) {
				return action.amount;
			}
		}
		return -1;
	},

	setActionAmount: function(actionName, amount) {
		amount = amount || 0;

		for(var a in this.actions.items) {
			var action = this.actions.items[a];
			if(action.name == actionName) {
				action.amount = Math.max(0, amount);
				action.btn.label.text = action.amount.toString();
				if(action.amount === 0) {
					action.btn.label.text = "";
				}
			}
		}
	},

	instancePosition: function(xCheck, yCheck, instanceTypeCheck) {
		var arrayCheck = [];
		switch(instanceTypeCheck) {
			case "lemming":
			arrayCheck = this.lemmingsGroup.all;
			break;
			case "door":
			arrayCheck = this.doorsGroup;
			break;
			case "exit":
			arrayCheck = this.exitsGroup;
			break;
			case "trap":
			arrayCheck = this.trapsGroup;
			break;
		}
		var result = [];
		for(var a = 0;a < arrayCheck.length;a++) {
			var obj = arrayCheck[a];
			if(xCheck >= obj.bbox.left && xCheck <= obj.bbox.right &&
				yCheck >= obj.bbox.top && yCheck <= obj.bbox.bottom) {
				result.push(obj);
			}
		}
		return result;
	}
};
var game = new Phaser.Game(
	800,
	600,
	Phaser.AUTO,
	"content"
);

game.state.add("boot", bootState);
game.state.add("game", gameState);

game.state.start("boot");
})(Phaser);