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

Camera.prototype.move = function(hor, ver, relative) {
	if(typeof relative === "undefined") {
		relative = true;
	}
	if(relative) {
		this.gameCamera.x += hor;
		this.gameCamera.y += ver;
	}
	else {
		this.gameCamera.x = (hor * this.state.zoom);
		this.gameCamera.y = (ver * this.state.zoom);
	}
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

	this.addToGame();
};

Alarm.prototype.constructor = Alarm;

Alarm.prototype.addToGame = function() {
	// Add to alarms list
	this.state.alarms.data.push(this);
};

Alarm.prototype.step = function() {
	if(this.state.speedManager.effectiveSpeed > 0 && this.duration > 0) {
		this.duration -= this.state.speedManager.effectiveSpeed;
		if(this.duration <= 0) {
			if(this.callbackContext) {
				this.fire();
			}
			this.state.alarms.remove(this);
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
	this.game = game;

	Object.defineProperty(this, "state", {
		get() {
			return this.game.state.getCurrentState();
		}
	});

	// Load base texture
	this.loadTexture("gui");

	// Initialization
	this.guiType = "button";
	this.subType = "";
	this.action = "";
	this.pressed = false;
	this.inputEnabled = true;
	this.doubleTap = {
		enabled: false,
		time: 0
	}

	// Create label
	this.label = game.add.text(0, 0, "", {
		font: "bold 12px Arial",
		fill: "#ffffff",
		boundsAlignH: "center"
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

	this.label.reposition();

	// Set on press action
	this.events.onInputDown.add(function() {
		if(this.doubleTap.enabled && this.doubleTap.time === 0) {
			this.doubleTap.time = GUI_Button.DOUBLETAP_TIME;
		}
		else if(!this.doubleTap.enabled || this.doubleTap.time > 0) {
			this.select(true);
		}
	}, this);
};

GUI_Button.prototype = Object.create(GUI.prototype);
GUI_Button.prototype.constructor = GUI_Button;

GUI_Button.DOUBLETAP_TIME = 15;

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
	// Reposition label
	this.label.reposition();
	// Update double tap time
	if(this.doubleTap.enabled && this.doubleTap.time > 0) {
		this.doubleTap.time = Math.max(0, this.doubleTap.time - 1);
	}
};

GUI_Button.prototype.select = function(makeSound) {
	this.doubleTap.time = 0;
	makeSound = makeSound || false;

	if (this.subType == "action") {
		this.state.deselectAllActions();

		this.doAction();

		this.pressed = true;
		this.animations.play("down");
	} else {
		this.doAction();
	}

	if (makeSound) {
		game.sound.play("sndUI_Click");
	}
};

GUI_Button.prototype.deselect = function() {
	this.pressed = false;
	this.animations.play("up");
};

GUI_Button.prototype.visualPress = function() {
	this.pressed = true;
	this.animations.play("down");
};

GUI_Button.prototype.visualRelease = function() {
	this.pressed = false;
	this.animations.play("up");
};

GUI_Button.prototype.doAction = function() {
	switch (this.subType) {
		case "action":
			for (var a in this.state.actions.items) {
				var item = this.state.actions.items[a];
				if (item.name == this.action) {
					this.state.actions.select = a;
				}
			}
			break;
		case "misc":
			switch (this.action) {
				case "pause":
					this.state.pauseGame();
					break;
				case "fastForward":
					this.state.fastForward();
					break;
				case "nuke":
					this.enabled = true;
					this.animations.play("down");
					this.state.nuke();
					break;
			}
			break;
	}
};

GUI_Button.prototype.remove = function() {
	this.label.destroy();
	this.destroy();
};
var GUI_MainMenuButton = function(game, x, y, imageKey) {
	GUI.call(this, game, x, y);
	this.game = game;

	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});

	// Load base texture
	this.loadTexture(imageKey);

	// Initialization
	this.guiType = "button";
	this.pressed = false;
	this.inputEnabled = true;
	this.callback = function() {
		return false;
	};
	this.callbackContext = this;

	// Create label
	this.label = game.add.text(0, 0, "", {
		font: "bold 12px Arial", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle", wordWrap: true
	});
	this.label.stroke = "#000000";
	this.label.strokeThickness = 3;
	this.label.owner = this;
	this.label.reposition = function() {
		this.x = this.owner.x;
		this.y = this.owner.y;
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
		get width() {
			return this.right - this.left;
		},
		get height() {
			return this.bottom - this.top;
		},
		owner: null
	};
	this.bbox.owner = this;

	Object.defineProperty(this, "labelText", {get() {
		return this.label.text;
	}, set(val) {
		this.label.text = val;
	}});

	this.label.text = "";
	this.label.reposition();

	// Set on press action
	this.events.onInputDown.add(function() {
		this.select(true);
	}, this);
	this.events.onInputUp.add(function() {
		if(this.pressed) {
			this.callback.call(this.callbackContext);
		}
	}, this);
};

GUI_MainMenuButton.prototype = Object.create(GUI.prototype);
GUI_MainMenuButton.prototype.constructor = GUI_Button;

GUI_MainMenuButton.prototype.mouseOver = function() {
	var cursor = {
		x: this.game.input.activePointer.worldX,
		y: this.game.input.activePointer.worldY
	};
	cursor.x = cursor.x;
	cursor.y = cursor.y;
	return (cursor.x >= this.bbox.left &&
		cursor.x <= this.bbox.right &&
		cursor.y >= this.bbox.top &&
		cursor.y <= this.bbox.bottom);
};

// Set button type and action
GUI_MainMenuButton.prototype.set = function(stateObject, callback, callbackContext) {
	this.callback = callback;
	this.callbackContext = callbackContext;

	this.animations.add("up", [stateObject.released], 15, false);
	this.animations.add("down", [stateObject.pressed], 15, false);
	this.animations.play("up");
};

GUI_MainMenuButton.prototype.resize = function(width, height) {
	this.width = width;
	this.height = height;
	this.label.reposition();
	this.label.setTextBounds(0, 0, this.width, this.height);
};

GUI_MainMenuButton.prototype.update = function() {
	this.label.reposition();
	if(this.pressed && (!this.mouseOver() || !this.game.input.activePointer.isDown)) {
		this.pressed = false;
		this.animations.play("up");
	}
};

GUI_MainMenuButton.prototype.select = function() {
	this.pressed = true;
	this.animations.play("down");
};

GUI_MainMenuButton.prototype.deselect = function() {
	this.pressed = false;
	this.animations.play("up");
};

GUI_MainMenuButton.prototype.remove = function() {
	this.label.destroy();
	this.destroy();
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
	this.x = this.owner.x;
	this.y = this.owner.y - 8;
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
var Background = function(game, imageKey) {
	Phaser.TileSprite.call(this, game, 0, 0, game.stage.width, game.stage.height, imageKey);
	this.game = game;
	this.game.add.existing(this);
	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
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
	this.x = this.game.camera.x;
	this.y = this.game.camera.y;
	this.tilePosition.x = (this.x * this.parallax.x);
	this.tilePosition.y = (this.y * this.parallax.y);
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
	Object.defineProperty(this, "state", {
		get() {
			return this.game.state.getCurrentState();
		}
	});
	this.state.levelGroup.add(this);

	// Set game started state
	this.state.victoryState.gameStarted = true;

	// Set base stats
	this.dead = false;
	this.markedForRemoval = false;
	this.active = true;
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

	// Set up attributes
	this.attributes = {
		floater: false,
		climber: false
	};

	this.gameLabel = null;

	// Set anchor
	this.anchor.setTo(0.5, 0.5);

	this.dir = 1;
	this.velocity = {
		x: 0,
		y: 0
	};
	this.fallDist = 0;
	this.bbox = {
		get spriteLeft() {
			return this.owner.x - Math.abs(this.owner.offsetX);
		},
		get spriteTop() {
			return this.owner.y - Math.abs(this.owner.offsetY);
		},
		get spriteRight() {
			return this.owner.x + (Math.abs(this.owner.width) - Math.abs(this.owner.offsetX));
		},
		get spriteBottom() {
			return this.owner.y + (Math.abs(this.owner.height) - Math.abs(this.owner.offsetY));
		},
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
		owner: this
	};
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
	Object.defineProperty(this, "tileLayer", {
		get: function() {
			return this.state.layers.tileLayer;
		}
	});

	// Set animations
	this.addAnim("fall", "Fall", 4, {
		x: 0,
		y: 0
	});
	this.addAnim("move", "Move", 10, {
		x: 0,
		y: 0
	});
	this.addAnim("mine", "Mine", 24, {
		x: 0,
		y: 8
	});
	this.addAnim("build", "Build", 16, {
		x: 0,
		y: 0
	});
	this.addAnim("build_end", "BuildEnd", 10, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("bash", "Bash", 32, {
		x: 0,
		y: 0
	});
	this.addAnim("dig", "Dig", 8, {
		x: 0,
		y: 4
	});
	this.addAnim("splat", "FallDeath", 16, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("block", "Block", 16, {
		x: 0,
		y: 0
	});
	this.addAnim("explode", "Explode", 16, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("exit", "Exit", 8, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("float", "Float", 4, {
		x: 0,
		y: 0
	});
	this.addAnim("float_start", "Float_Start", 4, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("climb", "Climb", 8, {
		x: 0,
		y: 0
	});
	this.addAnim("climb_end", "Climb_End", 8, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("drown", "Drown", 16, {
		x: 0,
		y: 0
	}, false);
	this.playAnim("fall", 15);
	this.velocity.y = 1;

	// Set animation end callbacks
	// Climb end
	this.animations.getAnimation("climb_end").onComplete.add(function() {
		this.clearAction();
		this.x += (1 * this.dir);
	}, this);

	this.objectType = "lemming";

	this.cursor = {
		selected: false,
		sprite: null
	};
};

Lemming.DEATHTYPE_OUT_OF_ROOM = 0;
Lemming.DEATHTYPE_FALL = 1;
Lemming.DEATHTYPE_DROWN = 2;

Lemming.prototype = Object.create(Phaser.Sprite.prototype);
Lemming.prototype.constructor = Lemming;

Lemming.prototype.mouseOver = function() {
	var cursor = this.state.getWorldCursor();
	return (cursor.x >= this.bbox.spriteLeft &&
		cursor.x <= this.bbox.spriteRight &&
		cursor.y >= this.bbox.spriteTop &&
		cursor.y <= this.bbox.spriteBottom);
};

Lemming.prototype.cursorDeselect = function() {
	if (this.cursor.selected) {
		this.cursor.selected = false;
		this.state.lemmingSelected = null;
		if (this.cursor.sprite != null) {
			this.cursor.sprite.destroy();
			this.cursor.sprite = null;
		}
	}
};

Lemming.prototype.cursorSelect = function() {
	if (!this.cursor.selected) {
		this.cursor.selected = true;
		this.state.lemmingSelected = this;
		if (this.cursor.sprite == null) {
			this.cursor.sprite = new Cursor(game, this.x, this.y, this);
			this.cursor.sprite.reposition();
		}
	}
};

Lemming.prototype.onFloor = function() {
	var checks = [
		this.tile.type(this.tile.x(this.x), this.tile.y(this.y)),
		this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1))
	];
	return (game.tiles.solidTileTypes.indexOf(checks[0]) !== -1 ||
		game.tiles.solidTileTypes.indexOf(checks[1]) !== -1);
};

Lemming.prototype.turnAround = function() {
	this.scale.x = -this.scale.x;
	this.dir = -this.dir;
	this.velocity.x = -this.velocity.x;
	this.x += (this.velocity.x * this.state.speedManager.effectiveSpeed);
};

Lemming.prototype.update = function() {
	if (!this.dead && this.active && this.state.speedManager.effectiveSpeed > 0) {
		this.x += (this.velocity.x * this.state.speedManager.effectiveSpeed);
		this.y += (this.velocity.y * this.state.speedManager.effectiveSpeed);

		// Walk
		if (this.onFloor() && this.action.idle) {
			// Fall death
			if (this.fallDist >= this.state.map.properties.falldist) {
				this.die(Lemming.DEATHTYPE_FALL);
			} else {
				this.fallDist = 0;
				// Adjust velocity
				this.velocity.x = 0.5;
				if (this.dir === -1) {
					this.velocity.x = -this.velocity.x;
				}
				this.velocity.y = 0;
				// Align to floor
				this.y = Math.floor(this.y / this.tile.height) * this.tile.height;
				// Play animation
				this.playAnim("move", 15);
				// Check walk up ramp
				if (game.tiles.solidTileTypes.indexOf(this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1))) !== -1 &&
					game.tiles.solidTileTypes.indexOf(this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1 - this.tile.height))) === -1) {
					this.y -= this.tile.height;
				}
				// Check walk against wall
				else if (game.tiles.solidTileTypes.indexOf(this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1))) !== -1 &&
					game.tiles.solidTileTypes.indexOf(this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1 - this.tile.height))) !== -1) {
					// Turn around
					if (!this.attributes.climber) {
						this.turnAround();
					}
					// Start climbing
					else {
						this.action.name = "climber";
						this.action.active = true;
						this.action.value = 0;
						this.playAnim("climb", 15);
						this.velocity.x = 0;
						this.velocity.y = -0.5;
						// Align to wall
						if (this.dir === 1) {
							this.x = (this.tile.x(this.x) * this.tile.width) - 1;
						} else if (this.dir === -1) {
							this.x = (this.tile.x(this.x) * this.tile.width) + (this.tile.width);
						}
					}
				}
			}
		}
		// Bashing
		else if (this.onFloor() && this.action.name === "basher" && !this.action.idle) {
			// Remove tile in front of lemming
			var alarm = new Alarm(this.game, 30, function() {
				this.setAction("walker");
			}, this);
			var bashResult = this.state.map.removeTile(this.tile.x(this.x + ((this.tile.width * 0.5) * this.dir)), this.tile.y(this.y - 1));
			if (bashResult === 1 ||
				this.state.layers.tileLayer.getTileType(this.tile.x(this.x + ((this.tile.width * 0.5) * this.dir)), this.tile.y(this.y - 1)) == 1 ||
				this.state.layers.tileLayer.getTileType(this.tile.x(this.x + ((this.tile.width * 1.5) * this.dir)), this.tile.y(this.y - 1)) == 1) {
				alarm.cancel();
			} else if (bashResult === 2) {
				alarm.cancel;
				this.game.sound.play("sndChink");
				this.clearAction();
			}
		}
		// Fall
		else if (!this.onFloor() && !(this.action.name === "climber" && !this.action.idle)) {
			this.velocity.x = 0;
			this.clearAction();
			// Float
			if (this.attributes.floater) {
				this.fallDist = 0;
				if (this.animations.currentAnim.name !== "float" && this.animations.currentAnim.name !== "float_start") {
					this.velocity.y = 1.5;
					this.playAnim("float_start", 15);
					this.animations.currentAnim.onComplete.addOnce(function() {
						this.playAnim("float", 15);
					}, this);
				} else if (this.animations.currentAnim.name === "float") {
					this.velocity.y = 0.75;
				}
			}
			// Fall
			else {
				this.velocity.y = 1.5;
				this.playAnim("fall", 15);
				this.fallDist += Math.abs(this.velocity.y) * this.state.speedManager.effectiveSpeed;
			}
		}
		// Climb
		else if (this.action.name === "climber" && !this.action.idle) {
			var wallTileType = this.tile.type(this.tile.x(this.x + (1 * this.dir)), this.tile.y(this.y));
			var ceilCheckDepth = Math.ceil(Math.abs(this.velocity.y) + 1) * this.state.speedManager.effectiveSpeed;
			var ceilTileType = this.tile.type(this.tile.x(this.x), this.tile.y(this.y - ceilCheckDepth));
			// Hit ceiling
			if (game.tiles.solidTileTypes.indexOf(ceilTileType) !== -1) {
				this.velocity.y = 0;
				this.x -= (1 * this.dir);
				this.y = (this.tile.y(this.y + ceilCheckDepth) * this.tile.height) + 1;
				this.clearAction();
				this.turnAround();
			}
			// Reached top of the cliff
			else if (game.tiles.solidTileTypes.indexOf(wallTileType) === -1) {
				this.velocity.y = 0;
				this.playAnim("climb_end", 15);
			}
		}

		// Detect blockers
		if (this.action.name !== "blocker") {
			var distCheck = Math.ceil((Math.abs(this.velocity.x) * this.state.speedManager.effectiveSpeed) + 1);
			var objs = [];
			while (distCheck > 0) {
				var group = this.detectByAction(this.x + (distCheck * this.dir), this.y - 1, "blocker");
				for (var a = 0; a < group.length; a++) {
					if (objs.indexOf(group[a]) === -1) {
						objs.push(group[a]);
					}
				}
				distCheck--;
			}
			var turnedAround = false;
			for (var a = 0; a < objs.length && !turnedAround; a++) {
				var obj = objs[a];
				if ((obj.bbox.left > this.x && this.dir === 1) || (obj.bbox.right < this.x && this.dir === -1)) {
					turnedAround = true;
					this.turnAround();
				}
			}
		}

		// Check for exits
		if (this.onFloor() && this.active) {
			var checkDone = false;
			for (var a = 0; a < this.state.exitsGroup.length && !checkDone; a++) {
				var exitProp = this.state.exitsGroup[a];
				if (exitProp.inPosition(this.x, this.y)) {
					this.checkDone = true;
					this.active = false;
					this.playAnim("exit", 15);
					var sndKey = this.game.cache.getJSON("config").props.exits[exitProp.type].sound.exit;
					if (sndKey) {
						game.sound.play(sndKey);
					}
					this.velocity.x = 0;
					this.velocity.y = 0;
					this.animations.currentAnim.onComplete.addOnce(function() {
						this.state.victoryState.saved++;
						this.markedForRemoval = true;
					}, this);
				}
			}
		}

		// Die outside room
		if (this.isOutsideLevel()) {
			this.die(Lemming.DEATHTYPE_OUT_OF_ROOM);
		}

		// Drown
		if(this.tile.type(this.tile.x(this.x), this.tile.y(this.y)) === 3) {
			this.die(Lemming.DEATHTYPE_DROWN);
		}
	}

	if (this.markedForRemoval) {
		this.remove();
	}
};

Lemming.prototype.addAnim = function(key, animName, numFrames, offsets, loop) {
	if (!offsets) {
		offsets = {
			x: 0,
			y: 0
		};
	}
	if (loop === undefined) {
		loop = true;
	}
	var a, frames = [];
	for (a = 0; a < numFrames; a += 1) {
		var anim = "sprLemming_" + animName + "_" + a.toString() + ".png";
		frames.push(anim);
	}
	this.animations.add(key, frames, 60, loop);
	this.animationProperties[key] = {
		offset: offsets
	};
};

Lemming.prototype.playAnim = function(key, frameRate) {
	this.animations.play(key, frameRate * this.state.speedManager.effectiveSpeed);
	// this.anchor.setTo(
	// 	0.5 - (this.animationProperties[key].offset.x / this.width),
	// 	1 - (this.animationProperties[key].offset.y / this.height)
	// );
	if (this.state.speedManager.effectiveSpeed === 0) {
		this.animations.stop();
	}
};

Lemming.prototype.clearAction = function() {
	// Clear action
	this.action.name = "";
	this.action.value = 0;
	this.action.active = false;
	if (this.action.alarm) {
		this.action.alarm.cancel();
	}
};

Lemming.prototype.setAction = function(actionName) {
	// Normal actions
	if (actionName != this.action.name && (this.action.name !== "blocker" || (this.action.idle && actionName === "blocker")) && !this.dead && this.active) {
		switch (actionName) {
			// SET ACTION: Walk
			case "walker":
				if (this.onFloor()) {
					this.clearAction();
				}
				break;
				// SET ACTION: Build
			case "builder":
				if (this.onFloor()) {
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
					// Set timer
					this.action.alarm = new Alarm(game, 120, function() {
						this.proceedBuild();
					}, this);
				}
				break;
				// SET ACTION: Basher
			case "basher":
				if (this.onFloor()) {
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
				if (this.onFloor()) {
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
				if (this.onFloor()) {
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
				// SET ACTION: Blocker
			case "blocker":
				if (this.onFloor()) {
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
				}
				break;
				// SET ACTION: Floater
			case "floater":
				if (!this.attributes.floater) {
					this.state.expendAction(actionName, 1);
					game.sound.play("sndAction");
					this.attributes.floater = true;
				}
				break;
				// SET ACTION: Climber
			case "climber":
				if (!this.attributes.climber) {
					this.state.expendAction(actionName, 1);
					game.sound.play("sndAction");
					this.attributes.climber = true;
				}
				break;
		}
	}
	// Sub action
	if (this.subaction.name != actionName) {
		switch (actionName) {
			// SET SUBACTION: Exploder
			case "exploder":
				this.state.expendAction(actionName, 1);
				game.sound.play("sndAction");
				this.setExploder();
				break;
		}
	}
};

Lemming.prototype.setExploder = function() {
	this.subaction.clear();
	// Set action
	this.subaction.name = "exploder";
	this.subaction.active = true;
	this.subaction.value = 5;
	// Create label
	this.gameLabel = new GameLabel(this.game, this, this.x, this.y, {
		x: 0,
		y: -((this.bbox.bottom - this.bbox.top) + 8)
	}, "5");
	// Create alarm
	this.subaction.alarm = new Alarm(this.game, 60, function() {
		this.proceedExplode();
	}, this);
};

Lemming.prototype.proceedBuild = function() {
	if (this.action.name == "builder" && !this.action.idle && !this.dead && this.active) {
		this.action.value--;
		if (this.action.value < 2) {
			this.game.sound.play("sndBuildEnding");
		}
		var moveTo = {
			x: this.x + (this.tile.width * this.dir),
			y: (this.y - this.tile.height)
		};
		var locChange = {
			x: this.x + (this.tile.width * this.dir),
			y: this.y - 1
		};
		// See whether we can build a step
		if (this.game.tiles.solidTileTypes.indexOf(this.tile.type(this.tile.x(moveTo.x), this.tile.y(moveTo.y - 1))) === -1 &&
			this.game.tiles.solidTileTypes.indexOf(this.tile.type(this.tile.x(locChange.x), this.tile.y(locChange.y))) === -1) {
			// Build a step
			this.x = moveTo.x;
			this.y = moveTo.y;
			this.state.layers.primitiveLayer.placeTile(this.tile.x(locChange.x), this.tile.y(locChange.y), "tilesetPlaceables", this.state.buildTileRect, 1);
			// Set alarm
			if (this.action.value === 0) {
				// Stop building
				this.playAnim("build_end", 10);
				this.animations.currentAnim.onComplete.addOnce(function() {
					this.clearAction();
				}, this);
			} else {
				this.action.alarm = new Alarm(game, 120, function() {
					this.proceedBuild();
				}, this);
			}
		}
		// Otherwise turn around and stop building
		else {
			this.setAction("walker");
			this.turnAround();
		}
	}
};

Lemming.prototype.proceedDig = function() {
	if (this.action.name == "digger" && !this.action.idle && !this.dead && this.active) {
		var result = this.state.map.removeTile(this.tile.x(this.x), this.tile.y(this.y + 1));
		if (result === 2) {
			this.game.sound.play("sndChink");
			this.clearAction();
		} else {
			this.y += this.tile.height;
			// Set up new alarm
			this.action.alarm = new Alarm(this.game, 120, function() {
				this.proceedDig();
			}, this);
		}
	}
};

Lemming.prototype.proceedMine = function() {
	if (this.action.name == "miner" && !this.action.idle && !this.dead && this.active) {
		var result = this.state.map.removeTile(this.tile.x(this.x), this.tile.y(this.y + 1));
		if (result === 2) {
			game.sound.play("sndChink");
			this.clearAction();
		} else {
			result = this.state.map.removeTile(this.tile.x(this.x + (this.tile.width * this.dir)), this.tile.y(this.y + 1));
			if (result === 2) {
				game.sound.play("sndChink");
				this.clearAction();
			} else {
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
	if (this.subaction.name === "exploder" && !this.subaction.idle && !this.dead && this.active) {
		this.subaction.value--;
		if (this.subaction.value <= 0) {
			this.gameLabel.remove();
			this.gameLabel = null;
			if (this.onFloor()) {
				this.game.sound.play("sndOhNo");
				this.dead = true;
				this.playAnim("explode", 15);
				this.velocity.x = 0;
				this.animations.currentAnim.onComplete.addOnce(function() {
					this.explode();
				}, this);
			} else {
				this.explode();
			}
		} else {
			this.gameLabel.text = this.subaction.value.toString();
			this.subaction.alarm = new Alarm(this.game, 60, function() {
				this.proceedExplode();
			}, this);
		}
	}
};

Lemming.prototype.explode = function() {
	game.sound.play("sndPop");
	// Remove 3x3 tiles
	for (var a = -1; a <= 1; a++) {
		for (var b = -1; b <= 1; b++) {
			var xCheck = this.tile.x(this.x) + a;
			var yCheck = this.tile.y(this.y - (this.tile.height * 0.5)) + b;
			this.state.map.removeTile(xCheck, yCheck);
		}
	}
	// Remove self
	this.markedForRemoval = true;
};

Lemming.prototype.detectByAction = function(xCheck, yCheck, actionName) {
	var group = this.state.lemmingsGroup.all;
	var result = [];
	if (group) {
		for (var a = 0; a < group.length; a++) {
			var obj = group[a];
			if (xCheck >= obj.bbox.left && xCheck <= obj.bbox.right &&
				yCheck >= obj.bbox.top && yCheck <= obj.bbox.bottom &&
				obj.action.name == actionName && !obj.action.idle) {
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
	// Set states
	this.dead = true;
	this.velocity.x = 0;
	this.velocity.y = 0;

	// Clear actions
	this.clearAction();
	this.subaction.name = "";
	this.subaction.active = false;
	this.subaction.value = 0;
	if (this.subaction.alarm) {
		this.subaction.alarm.cancel;
	}

	// Die
	switch (deathType) {
		// DEATH ACTION: Out of room
		case Lemming.DEATHTYPE_OUT_OF_ROOM:
			this.game.sound.play("sndDie");
			this.markedForRemoval = true;
			break;
			// DEATH ACTION: Fall death
		case Lemming.DEATHTYPE_FALL:
			this.game.sound.play("sndSplat");
			this.playAnim("splat", 15);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.markedForRemoval = true;
			}, this);
			break;
		case Lemming.DEATHTYPE_DROWN:
			this.game.sound.play("sndDrown");
			this.playAnim("drown", 15);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.markedForRemoval = true;
			}, this);
			break;
	}
};

Lemming.prototype.remove = function() {
	// Remove label
	if (this.gameLabel) {
		this.gameLabel.remove();
	}
	// Remove from state's group
	var done = false;
	for (var a = 0; a < this.state.lemmingsGroup.all.length && !done; a++) {
		var lem = this.state.lemmingsGroup.all[a];
		if (lem === this) {
			this.state.lemmingsGroup.all.splice(a, 1);
			done = true;
		}
	}
	this.active = false;
	// Kill self
	this.destroy();
};
var Prop = function(game, x, y) {
	Phaser.TileSprite.call(this, game, x, y);
	game.add.existing(this);
	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});
	this.state.levelGroup.add(this);
	this.anchor.setTo(0.5, 0.5);

	this.objectType = "prop";
	this.type = "";
};

Prop.prototype = Object.create(Phaser.Sprite.prototype);
Prop.prototype.constructor = Prop;

Prop.prototype.update = function() {
	// Update traps
	if(this.type === "trap") {
		// Detect lemmings
		var checkGroup = this.state.lemmingsGroup.all;
		for(var a = 0;a < checkGroup;a++) {
			var lem = checkGroup[a];
			if(!lem.dead && lem.active && this.instant) {
				lem.die(Lemming[this.deathType]);
			}
		}
	}
};

Prop.prototype.playAnim = function(key, frameRate) {
	this.animations.play(key, frameRate * this.state.speedManager.effectiveSpeed);
	if(this.state.speedManager.effectiveSpeed === 0) {
		this.animations.stop();
	}
};

Prop.prototype.setAsDoor = function(type, lemmings, rate, lemmingsGroup) {
	// Set primary data
	this.objectType = "door";
	this.state.doorsGroup.push(this);
	this.lemmingsGroup = lemmingsGroup;
	this.type = type;
	
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
	this.lemmings = lemmings;
	this.rate = Math.max(10, rate);

	// Set animation
	this.animations.add("opening", openingFrames, 15, false);
	this.animations.add("idle", idleFrames, 15, false);
	this.animations.add("open", openFrames, 15, false);
	this.playAnim("idle", 15);

	// Set functions
	this.openDoor = function() {
		// Play sound
		if(this.state.doorsGroup[0] === this) {
			game.sound.play(doorConfig.sound.open);
		}
		// Set event
		this.animations.getAnimation("opening").onComplete.addOnce(function() {
			this.playAnim("open", 15);
			var alarm = new Alarm(this.game, 30, function() {
				this.opened();
				this.state.playLevelBGM();
			}, this);
		}, this);
		// Play animation
		this.playAnim("opening", 15);
	};
	this.opened = function() {
		this.spawnLemming(true);
	};
	this.spawnLemming = function(recurring) {
		if(typeof recurring === "undefined") {
			var recurring = true;
		}
		if(this.lemmings > 0) {
			this.lemmings--;
			var lem = new Lemming(this.game, this.x, this.y + 30);
			this.lemmingsGroup.push(lem);
			if(recurring) {
				var alarm = new Alarm(this.game, this.rate, this.spawnLemming, this);
			}
		}
	};
};

Prop.prototype.setAsExit = function(type) {
	this.objectType = "exit";
	this.state.exitsGroup.push(this);
	this.type = type;

	// Set configuration
	var propConfig = game.cache.getJSON("config").props.exits[type];
	this.loadTexture(propConfig.atlas);
	var a, idleFrames = [];
	for(a = 0;a < propConfig.frames;a++) {
		var anim = propConfig.animName + a.toString() + ".png";
		idleFrames.push(anim);
	}

	// Set animation
	this.animations.add("idle", idleFrames, 15, true);
	this.playAnim("idle", 15);

	// Set bounding box
	this.bbox = {
		base: {
			left: propConfig.bbox.left,
			right: propConfig.bbox.right,
			top: propConfig.bbox.top,
			bottom: propConfig.bbox.bottom
		},
		get left() {
			return this.owner.x + this.base.left;
		},
		get right() {
			return this.owner.x + this.base.right;
		},
		get top() {
			return this.owner.y + this.base.top;
		},
		get bottom() {
			return this.owner.y + this.base.bottom;
		},

		owner: this
	};

	// Set functions
	this.inPosition = function(xCheck, yCheck) {
		if(xCheck >= this.bbox.left && xCheck <= this.bbox.right &&
			yCheck >= this.bbox.top && yCheck <= this.bbox.bottom) {
			return true;
		}
		return false;
	};
};

Prop.prototype.setAsTrap = function(type) {
	this.objectType = "trap";
	this.state.trapsGroup.push(this);
	this.type = type;

	// Set configuration
	var propConfig = game.cache.getJSON("config").props.traps[type];
	this.loadTexture(propConfig.atlas);
	var a, idleFrames = [];
	for(a = 0;a < propConfig.animations.idle.frames.length;a++) {
		idleFrames.push(propConfig.animations.idle.frames[a]);
	}

	// Set animation(s)
	this.animations.add("idle", idleFrames, 15, true);
	this.playAnim("idle", 15);

	// Set bounding box
	this.bbox = {
		base: {
			left: propConfig.bbox.left,
			right: propConfig.bbox.right,
			top: propConfig.bbox.top,
			bottom: propConfig.bbox.bottom
		},
		get left() {
			return this.owner.x + this.base.left;
		},
		get right() {
			return this.owner.x + this.base.right;
		},
		get top() {
			return this.owner.y + this.base.top;
		},
		get bottom() {
			return this.owner.y + this.base.bottom;
		},

		owner: this
	};

	// Set anchor
	if(propConfig.anchor) {
		this.anchor.setTo(propConfig.anchor.x, propConfig.anchor.y);
	}

	// Set trap properties
	this.instant = true;
	if(!propConfig.instant) {
		this.instant = false;
	}
	this.deathType = "DEATHTYPE_DROWN";
	if(propConfig.death_type) {
		this.deathType = propConfig.death_type;
	}
};
var bootState = {
	preload: function() {
		game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
		this.loadAssetList("./assets/asset_list.json");
	},

	loadAssetList: function(assetListFilename) {
		// Load asset list
		game.load.json("assetList", assetListFilename);

		// Load game
		this.loadGame();

		// Initialize global game properties
		this.game.tiles = {
			solidTileTypes: [1, 2]
		}

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
			game.state.start("menu");
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
			game.load.atlasJSONArray(curAsset.key, curAsset.url, curAsset.atlasUrl);
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
	}, 

	loadGame: function() {
		var rawSave = localStorage["tilelemmings.profiles.default.progress"];
		if(rawSave) {
			game.saveFile = JSON.parse(rawSave);
		}
		else {
			game.saveFile = {};
		}
	}
};
var menuState = {
	background: null,
	guiGroup: [],

	create: function() {
		this.background = new Background(this.game, "bgMainMenu");

		this.setupMainMenu();
	},

	setupMainMenu: function() {
		this.clearGUIGroup();

		// Add button(s)
		var levelList = this.game.cache.getJSON("levelList").difficulties;
		for(var a = 0;a < levelList.length;a++) {
			var levelFolder = levelList[a];
			var btn = new GUI_MainMenuButton(this.game, 80, 60, "mainmenu");
			btn.set({
				pressed: "btnGray_Down.png",
				released: "btnGray_Up.png"
			}, function() {
				this.state.setupLevelList(this.params.difficulty.index);
			}, btn);
			btn.params = {
				difficulty: {
					resref: levelFolder.resref,
					name: levelFolder.name,
					index: a
				}
			};
			btn.resize(160, 60);
			btn.label.text = btn.params.difficulty.name;
			this.guiGroup.push(btn);
		}
	},

	setupLevelList: function(index) {
		this.clearGUIGroup();

		this.levelList = [];
		var levelFolder = this.game.cache.getJSON("levelList").difficulties[index];
		var btnProps = {
			basePos: {
				x: 40,
				y: 30
			},
			width: 160,
			height: 60,
			spacing: 20
		};
		btnProps.cols = Math.floor((this.game.stage.width - (btnProps.basePos.x * 2)) / (btnProps.width + btnProps.spacing))
		var completedLevels = [];
		if(game.saveFile[levelFolder.resref]) {
			completedLevels = game.saveFile[levelFolder.resref];
		}
		// Create level buttons
		for(var a = 0;a < levelFolder.levels.length;a++) {
			// Don't add not unlocked levels
			if(a === 0 || completedLevels.indexOf(a-1) !== -1) {
				var level = levelFolder.levels[a];
				var xTo = btnProps.basePos.x + ((btnProps.width + btnProps.spacing) * (a % btnProps.cols));
				var yTo = btnProps.basePos.y + ((btnProps.height + btnProps.spacing) * Math.floor(a / btnProps.cols));
				var btn = new GUI_MainMenuButton(this.game, xTo, yTo, "mainmenu");
				btn.resize(btnProps.width, btnProps.height);
				btn.label.text = level.name;
				btn.params = {
					url: levelFolder.baseUrl + level.filename
				};
				btn.set({
					pressed: "btnGray_Down.png",
					released: "btnGray_Up.png"
				}, function() {
					this.game.state.start("intermission", true, false, this.params.levelFolder, this.params.level, false);
				}, btn);
				btn.params = {
					levelFolder: levelFolder,
					level: level
				}
				this.guiGroup.push(btn);
			}
		}

		// Create back button
		var btn = new GUI_MainMenuButton(this.game, 4, 4, "mainmenu");
		btn.resize(40, 24);
		btn.label.text = "Back";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.state.setupMainMenu();
		}, btn);
		this.guiGroup.push(btn);
	},

	clearGUIGroup: function() {
		while(this.guiGroup.length > 0) {
			this.guiGroup.shift().remove();
		}
	}
};
var intermissionState = {
	levelFolder: null,
	levelObj: null,
	background: null,
	labels: [],

	map: null,
	minimap: null,

	init: function(levelFolder, levelObj, retry, mapFiles) {
		// Set default parameters
		if(typeof retry === "undefined") {
			retry = false;
		}
		if(typeof mapFiles === "undefined") {
			mapFiles = [];
		}
		this.clearMapFiles(mapFiles);
		this.levelFolder = levelFolder;
		this.levelObj = levelObj;
	},

	preload: function() {
		game.load.json("level", this.levelFolder.baseUrl + this.levelObj.filename);
	},

	create: function() {
		this.background = new Background(this.game, "bgMainMenu");

		this.initMapPreview();

		this.game.input.onTap.addOnce(function() {
			this.clearState();
			this.game.state.start("game", true, false, this.levelFolder, this.levelObj);
		}, this);
	},

	clearState: function() {
		while(this.minimap.children.length > 0) {
			var gobj = this.minimap.children[0];
			this.minimap.removeChildAt(0);
			if(gobj.remove) {
				gobj.remove();
			}
			else {
				gobj.destroy();
			}
		}
		this.minimap.destroy();
		while(this.labels.length > 0) {
			var gobj = this.labels.shift();
			if(gobj.remove) {
				gobj.remove();
			}
			else {
				gobj.destroy();
			}
		}
	},

	initMapPreview: function() {
		this.minimap = new Phaser.Group(this.game);

		this.map = this.game.cache.getJSON("level");

		var tilesetRefs = [null];
		// Pre-parse tilesets
		for(var a = 0;a < this.map.tilesets.length;a++) {
			var tileset = this.map.tilesets[a];
			for(var b = tileset.firstgid;b < tileset.firstgid + tileset.tilecount;b++) {
				tilesetRefs[b] = tileset;
			}
		}

		// Set up tile layer
		this.map.tileLayer = [];
		var lemmingCount = 0;
		for(var a = 0;a < this.map.layers.length;a++) {
			var layer = this.map.layers[a];
			// Add to tile layer
			if(layer.type === "tilelayer") {
				for(var b = 0;b < layer.data.length;b++) {
					var gid = layer.data[b];
					var tileType = 0;
					if(gid > 0) {
						tileType = 1;
						var tileset = tilesetRefs[gid];
						if(tileset.tileproperties) {
							var basegid = gid - tileset.firstgid;
							if(tileset.tileproperties[basegid]) {
								if(tileset.tileproperties[basegid].tileType) {
									tileType = parseInt(tileset.tileproperties[basegid].tileType);
								}
							}
						}
					}
					this.map.tileLayer.push(tileType);
				}
			}
			// Add to lemming count
			else if(layer.type === "objectgroup") {
				for(var b = 0;b < layer.objects.length;b++) {
					var obj = layer.objects[b];
					if(obj.type === "door") {
						if(obj.properties && obj.properties.value) {
							lemmingCount += parseInt(obj.properties.value);
						}
					}
				}
			}
		}

		// Create preview
		this.map.primitiveLayer = [];
		var gfx = game.add.image(0, 0, "minimap", "bg.png");
		gfx.width = (16 * this.map.width);
		gfx.height = (16 * this.map.height);
		this.minimap.add(gfx);
		for(var a = 0;a < this.map.tileLayer.length;a++) {
			var tileType = this.map.tileLayer[a];
			if(tileType > 0) {
				// Determine position
				var place = {
					xTile: (a % this.map.width),
					yTile: Math.floor(a / this.map.width)
				};
				place.xPos = place.xTile * 16;
				place.yPos = place.yTile * 16;

				var key = "tile";
				if(tileType === 2) {
					key = "steel";
				}
				else if(tileType === 3) {
					key = "water";
				}
				var gfx = game.add.image(place.xPos, place.yPos, "minimap", key + ".png");
				this.map.primitiveLayer.push(gfx);
				this.minimap.add(gfx);
				gfx.bringToTop();
			}
		}
		this.minimap.width = Math.max(240, Math.min(480, this.map.width * 4));
		this.minimap.height = Math.max(180, Math.min(480, this.map.height * 4));
		this.minimap.x = (this.game.stage.width - 30) - this.minimap.width;
		this.minimap.y = 30;

		var txt = this.game.add.text(120, 10, this.levelObj.name, {
			font: "bold 20pt Arial",
			fill: "#FFFFFF",
			boundsAlignH: "center",
			stroke: "#000000",
			strokeThickness: 3
		});
		txt.setTextBounds(0, 0, 240, 40);
		this.labels.push(txt);

		var newStyle = {
			font: "12pt Arial",
			fill: "#FFFFFF",
			stroke: "#000000",
			strokeThickness: 3
		};
		txt = this.game.add.text(120, 70, lemmingCount.toString() + " lemmings\n" + ((this.map.properties.need / lemmingCount) * 100) + "% to be saved", newStyle);
		txt.setTextBounds(0, 0, 240, 80);
		this.labels.push(txt);

		// Free memory
		this.game.cache.removeJSON("level");
	},

	clearMapFiles: function(mapFiles) {
		// Remove map files
		for(var a = 0;a < mapFiles.length;a++) {
			var mapFile = mapFiles[a];
			switch(mapFile.type) {
				case "image":
					this.game.cache.removeImage(mapFile.key, true);
					break;
				case "sound":
					this.game.cache.removeSound(mapFile.key);
					break;
			}
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
					this.state.layers.minimapLayer.placeTile(tileX, tileY, tileType);
					return true;
				}
				return false;
			},
			replaceTile: function(tileX, tileY, newTile) {
				this.removeTile(tileX, tileY);
				this.data[this.getIndex(tileX, tileY)] = newTile;
			}
		},
		minimapLayer: {
			data: [],
			group: null,
			bg: null,
			frame: null,
			scrolling: false,
			offset: {
				x: 0,
				y: 0
			},
			size: {
				width: 120,
				height: 90
			},
			init: function(state) {
				this.state = state;
				this.group = game.add.group();
				Object.defineProperties(this.group, {
					left: {
						get() {
							return (this.x - this.width);
						}
					},
					top: {
						get() {
							return (this.y - this.height);
						}
					}
				});
				this.bg = game.add.image(0, 0, "minimap", "bg.png");
				this.bg.width = this.state.map.width * 16;
				this.bg.height = this.state.map.height * 16;
				this.group.add(this.bg);
				// Fill ALL the data
				while(this.data.length < this.state.map.width * this.state.map.height) {
					this.data.push(null);
				}
			},
			getTile: function(tileX, tileY) {
				return this.data[this.getIndex(tileX, tileY)];
			},
			getIndex: function(tileX, tileY) {
				return Math.floor((tileX % this.state.map.width) + (tileY * this.state.map.width));
			},
			removeTile: function(tileX, tileY) {
				var testTile = this.getTile(tileX, tileY);
				if(testTile != null) {
					this.data[tileX, tileY] = null;
					testTile.destroy();
					return true;
				}
				return false;
			},
			placeTile: function(tileX, tileY, tileType) {
				var key = "tile";
				if(tileType === 2) {
					key = "steel";
				}
				else if(tileType === 3) {
					key = "water";
				}
				var tempTile = game.add.image(tileX * 16, tileY * 16, "minimap", key + ".png");
				this.replaceTile(tileX, tileY, tempTile);
			},
			replaceTile: function(tileX, tileY, newTile) {
				this.removeTile(tileX, tileY);
				this.data[this.getIndex(tileX, tileY)] = newTile;
				this.group.add(newTile);
				if(this.frame) {
					this.group.bringToTop(this.frame);
				}
			},
			finalize: function() {
				this.createFrame();
				this.group.width = this.size.width;
				this.group.height = this.size.height;
				this.offset.x = game.camera.width - this.size.width;
				this.offset.y = game.camera.height - this.size.height;
				this.reposition();
			},
			reposition: function() {
				this.group.x = game.camera.x + this.offset.x;
				this.group.y = game.camera.y + this.offset.y;
				this.updateFrame();
			},
			createFrame: function() {
				if(this.frame) {
					this.frame.destroy();
				}
				this.frame = game.add.image(0, 0, "minimap", "frame.png");
				this.group.add(this.frame);
				this.group.bringToTop(this.frame);
				this.frame.width = this.state.cam.width;
				this.frame.height = this.state.cam.height;
			},
			updateFrame: function() {
				if(this.frame) {
					this.frame.x = this.state.cam.x;
					this.frame.y = this.state.cam.y;
				}
			},
			getCursorInRate: function() {
				var cursor = this.state.getWorldCursor();
				cursor.x *= 2;
				cursor.y *= 2;
				var result = {
					x: ((cursor.x - this.group.x) / this.group.width),
					y: ((cursor.y - this.group.y) / this.group.height)
				}
				return result;
			},
			mouseOver: function() {
				var cursor = this.getCursorInRate();
				if(cursor.x >= 0 && cursor.x <= 1 &&
					cursor.y >= 0 && cursor.y <= 1) {
					return true;
				}
				return false;
			},
			clear: function() {
				this.group.destroy();
				this.data = [];
				this.scrolling = false;
			}
		}
	},
	background: null,
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

	speedManager: {
		owner: null,
		speed: 1,
		paused: false,
		get effectiveSpeed() {
			if(this.paused) {
				return 0;
			}
			return this.speed;
		},
		pauseButton: null,
		fastForwardButton: null,
		pause: function() {
			this.paused = true;
			this.refresh();
		},
		unpause: function() {
			this.paused = false;
			this.refresh();
		},
		refresh: function() {
			// Update objects
			for(var a = 0;a < this.owner.levelGroup.children.length;a++) {
				var obj = this.owner.levelGroup.children[a];
				if(obj) {
					// Update animations
					if(obj.animations) {
						if(obj.animations.currentAnim && this.effectiveSpeed > 0) {
							var prevFrame = obj.animations.currentAnim.frame;
							obj.animations.currentAnim.speed = (15 * this.effectiveSpeed);
						}
						else {
							obj.animations.stop();
						}
					}
				}
			}
		},
		setSpeed: function(multiplier) {
			this.speed = multiplier;
			this.refresh();
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

	init: function(levelFolder, levelObj) {
		this.levelFolder = levelFolder;
		this.levelObj = levelObj;

		this.victoryState = {
			total: 0,
			saved: 0,
			need: 0,
			gameStarted: false,
			gameEnded: false
		};
		this.nukeStarted = false;
	},

	preload: function() {
		// Preload map data
		game.load.json("level", this.levelFolder.baseUrl + this.levelObj.filename);
	},

	create: function() {
		this.enableUserInteraction();
		// Create map
		this.map = game.cache.getJSON("level");
		this.map.owner = this;
		Object.defineProperty(this.map, "totalwidth", {get() {
			return this.width * this.tilewidth;
		}})
		Object.defineProperty(this.map, "totalheight", {get() {
			return this.height * this.tileheight;
		}});

		this.layers.tileLayer.state = this;
		this.layers.primitiveLayer.state = this;
		this.layers.minimapLayer.init(this);
		this.speedManager.owner = this;
		// Create groups
		this.levelGroup = new Phaser.Group(game);
		
		// Create GUI
		this.createLevelGUI();

		// Create camera config
		this.cam = new Camera(this.game, this);
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
			if(force || this.owner.layers.tileLayer.getTileType(tileX, tileY) === 1) {
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
		this.mapFiles = [];
		// Load Background Music
		if(this.map.properties.bgm) {
			this.mapFiles.push({
				url: "assets/audio/bgm/" + this.map.properties.bgm,
				key: "bgm",
				type: "sound"
			});
		}
		// Load Background
		if(this.map.properties.bg) {
			this.mapFiles.push({
				url: "assets/gfx/backgrounds/" + this.map.properties.bg,
				key: "bg",
				type: "image"
			});
		}
		// Load tilesets
		var levelPath = /([\w\/]+[\/])[\w\.]+/g.exec(this.levelFolder.baseUrl + this.levelObj.filename)[1]
		for(var a = 0;a < this.map.tilesets.length;a++) {
			var tileset = this.map.tilesets[a];
			var url = levelPath + tileset.image;
			this.mapFiles.push({
				url: url,
				key: tileset.name,
				type: "image"
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
					var tileType = 0;
					if(gid > 0) {
						tileType = 1;
						var props = tileProps[gid.toString()];
						if(props) {
							if(props.tileType) {
								tileType = parseInt(props.tileType);
							}
						}
						this.layers.minimapLayer.placeTile((b % this.map.width), Math.floor(b / this.map.width), tileType);
					}
					this.layers.tileLayer.data.push(tileType);
				}
			}
			else if(layer.name === "objects") {
				for(var b in layer.objects) {
					this.map.objects.push(layer.objects[b]);
				}
			}
		}

		// Preload map files
		if(this.mapFiles.length > 0) {
			// Set load handler
			game.load.onLoadComplete.addOnce(function() {
				this.startLevel();
			}, this);

			// Load files
			for(var a in this.mapFiles) {
				var file = this.mapFiles[a];
				switch(file.type) {
					case "sound":
					game.load.audio(file.key, file.url);
					break;
					case "image":
					game.load.image(file.key, file.url);
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
					var tile = new Tile(game, placeAt.raw.x, placeAt.raw.y, tileset.name, cutout);
					this.layers.primitiveLayer.data.push(tile);
				}
				else {
					this.layers.primitiveLayer.data.push(null);
				}
			}
		}

		// Set up build tile rectangle
		var tileX = 2;
		var tileY = 1;
		var tileWidth = 16;
		var tileHeight = 16;
		var tileSpacing = 4;
		this.buildTileRect = new Phaser.Rectangle(2 + ((tileWidth + tileSpacing) * tileX), 2 + ((tileHeight + tileSpacing) * tileY), tileWidth, tileHeight);

		// Set up action count
		for(var a in this.actions.items) {
			var action = this.actions.items[a];
			if(this.map.properties[action.name]) {
				this.setActionAmount(action.name, parseInt(this.map.properties[action.name]));
			}
		}

		// Set misc map properties
		// PROPERTY: Save need count
		if(this.map.properties.need) {
			this.victoryState.need = this.map.properties.need;
		}
		// PROPERTY: Fall distance
		if(!this.map.properties.falldist) {
			this.map.properties.falldist = (9 * this.map.tileheight);
		}

		// Create background
		if(game.cache.checkImageKey("bg")) {
			this.background = new Background(this.game, "bg");
		}

		// Set (z-)order of display objects
		// Bring backgrounds objects to top first, ending with foreground objects
		if(this.background) {
			this.world.bringToTop(this.background);
		}
		this.world.bringToTop(this.levelGroup);
		for(var a = 0;a < this.guiGroup.length;a++) {
			var elem = this.guiGroup[a];
			this.world.bringToTop(elem);
			if(elem.label) {
				this.world.bringToTop(elem.label);
			}
		}
		this.world.bringToTop(this.layers.minimapLayer.group);
	},

	enableUserInteraction: function() {
		// Create keys
		this.keyboard = {
			left: this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
			right: this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
			up: this.game.input.keyboard.addKey(Phaser.Keyboard.UP),
			down: this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
			space: this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
			p: this.game.input.keyboard.addKey(Phaser.Keyboard.P),
			f: this.game.input.keyboard.addKey(Phaser.Keyboard.F),
			q: this.game.input.keyboard.addKey(Phaser.Keyboard.Q),
			e: this.game.input.keyboard.addKey(Phaser.Keyboard.E),
			w: this.game.input.keyboard.addKey(Phaser.Keyboard.W),
			s: this.game.input.keyboard.addKey(Phaser.Keyboard.S),
			a: this.game.input.keyboard.addKey(Phaser.Keyboard.A),
			d: this.game.input.keyboard.addKey(Phaser.Keyboard.D)
		};

		// Set pause functionality
		this.keyboard.p.onDown.add(function() {
			this.pauseGame();
		}, this);
		this.keyboard.space.onDown.add(function() {
			this.pauseGame();
		}, this);
		// Set fast-forward functionality
		this.keyboard.f.onDown.add(function() {
			this.fastForward();
		}, this);

		game.input.mouse.capture = true;
		// Add left-mouse button functionality
		game.input.activePointer.leftButton.onDown.add(function() {
			// Assign action to lemming
			if(this.lemmingSelected != null && this.actions.current && this.actions.current.amount > 0) {
				this.lemmingSelected.setAction(this.actions.current.name);
			}
			// Start minimap scrolling
			else if(this.layers.minimapLayer.mouseOver()) {
				this.layers.minimapLayer.scrolling = true;
			}
		}, this);
		game.input.activePointer.leftButton.onUp.add(function() {
			this.layers.minimapLayer.scrolling = false;
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
		this.zoomTo(2);
		// Set level stuff

		// Create objects
		for(var a in this.map.objects) {
			var obj = this.map.objects[a];
			var objProps = obj.properties;
			// Create door
			if(obj.type === "door") {
				var newObj = new Prop(this.game, (obj.x + (obj.width * 0.5)), obj.y);
				var doorValue = 0;
				var doorType = "classic";
				var doorRate = 50;
				if(objProps) {
					if(objProps.value) {
						doorValue = parseInt(objProps.value);
					}
					if(objProps.type) {
						doorType = objProps.type;
					}
					if(objProps.rate) {
						doorRate = parseInt(objProps.rate);
					}
				}
				// Add to total lemming count
				this.victoryState.total += doorValue;
				// Create object
				newObj.setAsDoor(doorType, doorValue, doorRate, this.lemmingsGroup.all);
			}
			// Create exit
			else if(obj.type === "exit") {
				var newObj = new Prop(this.game, obj.x + (obj.width * 0.5), obj.y + obj.height);
				var exitType = "classic";
				if(objProps) {
					if(objProps.type) {
						exitType = objProps.type;
					}
				}
				newObj.setAsExit(exitType);
			}
			// Create trap
			else if(obj.type === "trap") {
				var newObj = new Prop(this.game, obj.x, obj.y);
				var trapType = "water";
				if(objProps && objProps.type) {
					trapType = objProps.type;
				}
				newObj.setAsTrap(trapType);
				if(newObj.repeating) {
					newObj.tileScale.setTo(
						obj.width / 16,
						obj.height / 16
						);
				}
			}
		}

		// Let's go... HRRRRN
		this.layers.minimapLayer.finalize();
		var snd = game.sound.play("sndLetsGo");
		var alarm = new Alarm(this.game, 90, function() {
			this.openDoors();
		}, this);
	},

	pauseGame: function() {
		if(!this.speedManager.paused) {
			this.speedManager.pause();
			// Press pause GUI button
			this.speedManager.pauseButton.visualPress();
		}
		else {
			this.speedManager.unpause();
			// Release pause GUI button
			this.speedManager.pauseButton.visualRelease();
		}
	},

	fastForward: function() {
		if(this.speedManager.speed > 1) {
			this.speedManager.setSpeed(1);
			// Press fast forward GUI button
			this.speedManager.fastForwardButton.visualRelease();
		}
		else {
			this.speedManager.setSpeed(3);
			// Release fast forward GUI button
			this.speedManager.fastForwardButton.visualPress();
		}
	},

	nuke: function() {
		// Start nuke
		if(!this.nukeStarted) {
			this.game.sound.play("sndOhNo");
			this.nukeStarted = true;
			this.nuke();
			// Set lemming count of all doors to 0
			for(var a = 0;a < this.doorsGroup.length;a++) {
				var door = this.doorsGroup[a];
				door.lemmings = 0;
			}
			this.victoryState.gameStarted = true;
		}
		// Proceed nuke
		else {
			var searchComplete = false;
			for(var a = 0;a < this.lemmingsGroup.all.length && !searchComplete;a++) {
				var lem = this.lemmingsGroup.all[a];
				if(lem.subaction.name !== "exploder") {
					lem.setExploder();
					searchComplete = true;
				}
			}
			// Set nuke alarm
			if(searchComplete) {
				var alarm = new Alarm(this.game, 10, function() {
					this.nuke();
				}, this);
			}
		}
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
		// Right-click
		if(this.cam.scrolling) {
			var originRel = this.getScreenCursor();
			var speedFactor = 2;
			var moveRel = {
				x: (this.scrollOrigin.x - originRel.x) * speedFactor,
				y: (this.scrollOrigin.y - originRel.y) * speedFactor
			};
			this.scrollOrigin = this.getScreenCursor();
			this.cam.move(moveRel.x, moveRel.y);
		}
		// Minimap
		else if(this.layers.minimapLayer.scrolling) {
			var rate = this.layers.minimapLayer.getCursorInRate();
			rate.x = Math.max(0, Math.min(1, rate.x));
			rate.y = Math.max(0, Math.min(1, rate.y));
			var moveTo = {
				x: Math.floor((rate.x * this.map.totalwidth) - (this.cam.width * 0.5)),
				y: Math.floor((rate.y * this.map.totalheight) - (this.cam.height * 0.5))
			};
			this.cam.move(moveTo.x, moveTo.y, false);
		}
		// WASD
		if(!this.cam.scrolling) {
			var moveRel = {
				x: 0,
				y: 0
			};
			if(this.keyboard.a.isDown) {
				moveRel.x--;
			}
			if(this.keyboard.d.isDown) {
				moveRel.x++;
			}
			if(this.keyboard.w.isDown) {
				moveRel.y--;
			}
			if(this.keyboard.s.isDown) {
				moveRel.y++;
			}
			var speedFactor = 10;
			moveRel.x *= speedFactor;
			moveRel.y *= speedFactor;
			this.cam.move(moveRel.x, moveRel.y);
		}

		// Update minimap
		this.layers.minimapLayer.reposition();

		// Test for victory/defeat
		if(this.victoryState.gameStarted && !this.victoryState.gameEnded) {
			var allDoorsEmpty = true;
			for(var a = 0;a < this.doorsGroup.length && allDoorsEmpty;a++) {
				var door = this.doorsGroup[a];
				if(door.lemmings > 0) {
					allDoorsEmpty = false;
				}
			}
			if(allDoorsEmpty && this.lemmingsGroup.all.length === 0) {
				this.victoryState.gameEnded = true;
				if(this.victoryState.saved >= this.victoryState.need) {
					// Victory
					this.goToNextLevel();
				}
				else {
					// Defeat
					this.retryLevel();
				}
			}
		}
	},

	clearState: function() {
		// Remove all game objects
		this.levelGroup.removeAll(false, false);
		this.levelGroup.destroy();
		// Determine all groups to have their children destroyed
		var removeGroups = [
			this.lemmingsGroup.all,
			this.doorsGroup,
			this.exitsGroup,
			this.trapsGroup,
			this.guiGroup,
			this.layers.primitiveLayer.data
		];

		// Remove all GUI objects
		for(var a = 0;a < removeGroups.length;a++) {
			var remGrp = removeGroups[a];
			while(remGrp.length > 0) {
				var gobj = remGrp.shift();
				if(gobj) {
					if(typeof gobj.remove !== "undefined") {
						gobj.remove();
					}
					else {
						gobj.destroy();
					}
				}
			}
		}

		// Clear minimap
		this.layers.minimapLayer.clear();

		// Clear tile layer
		this.layers.tileLayer.data = [];

		// Reset speed manager
		this.speedManager.paused = false;
		this.speedManager.speed = 1;

		// Stop the music
		this.stopBGM();

		// Stop the alarms
		while(this.alarms.length > 0) {
			this.alarms[0].cancel();
		}
	},

	goToNextLevel: function() {
		// Clear state
		this.clearState();
		// Get current level
		var levelIndex = this.getLevelIndex();
		this.saveGame(levelIndex);
		if(this.levelFolder.levels.length > levelIndex+1) {
			var newLevel = this.levelFolder.levels[levelIndex+1];
			this.game.state.start("intermission", true, false, this.levelFolder, newLevel, false, this.mapFiles);
		}
		else {
			this.game.state.start("menu");
		}
	},

	retryLevel: function() {
		this.clearState();
		this.game.state.start("intermission", true, false, this.levelFolder, this.levelObj, true, this.mapFiles);
	},

	getLevelIndex: function() {
		for(var a = 0;a < this.levelFolder.levels.length;a++) {
			var level = this.levelFolder.levels[a];
			if(level === this.levelObj) {
				return a;
			}
		}
		return -1;
	},

	saveGame: function(levelIndex) {
		var rawSave = localStorage["tilelemmings.profiles.default.progress"];
		var curSave = {};
		if(rawSave) {
			curSave = JSON.parse(rawSave);
			if(!curSave[this.levelFolder.resref]) {
				curSave[this.levelFolder.resref] = [];
			}
			if(curSave[this.levelFolder.resref].indexOf(levelIndex) === -1) {
				curSave[this.levelFolder.resref].push(levelIndex);
			}
		}
		else {
			curSave[this.levelFolder.resref] = [];
			curSave[this.levelFolder.resref].push(levelIndex);
		}
		game.saveFile = curSave;
		localStorage["tilelemmings.profiles.default.progress"] = JSON.stringify(curSave);
	},

	render: function() {
		
	},

	cursorOverGUI: function() {
		if(this.layers.minimapLayer.mouseOver()) {
			return true;
		}
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
		if((this.state.keyboard.left.isDown || this.state.keyboard.q.isDown) && this.dir != -1) {
			return false;
		}
		if((this.state.keyboard.right.isDown || this.state.keyboard.e.isDown) && this.dir != 1) {
			return false;
		}
		if(this.dead || !this.active) {
			return false;
		}
		if(this.state.actions.select >= 0) {
			if(this.action.name == this.state.actions.current.name ||
			this.subaction.name == this.state.actions.current.name) {
				return false;
			}
			if(typeof this.attributes[this.state.actions.current.name] !== "undefined" && this.attributes[this.state.actions.current.name]) {
				return false;
			}
		}
		return true;
	},

	openDoors: function() {
		for(var a = 0;a < this.doorsGroup.length;a++) {
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

		// Create action buttons
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

		// Create pause button
		var btn = new GUI_Button(game, 0, game.camera.y + game.camera.height);
		this.guiGroup.push(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_Pause_0.png",
			pressed: "Btn_Pause_1.png"
		}, "pause", "misc");
		this.speedManager.pauseButton = btn;

		// Create fast forward button
		var btn = new GUI_Button(game, 0, game.camera.y + game.camera.height);
		this.guiGroup.push(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_FastForward_0.png",
			pressed: "Btn_FastForward_1.png"
		}, "fastForward", "misc");
		this.speedManager.fastForwardButton = btn;

		// Create nuke button
		var btn = new GUI_Button(game, 0, game.camera.y + game.camera.height);
		this.guiGroup.push(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_Nuke_0.png",
			pressed: "Btn_Nuke_1.png"
		}, "nuke", "misc");
		btn.doubleTap.enabled = true;
		this.guiGroup.push(btn);

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
			if(obj.subType === "action") {
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
game.state.add("menu", menuState);
game.state.add("intermission", intermissionState);
game.state.add("game", gameState);

game.state.start("boot");
})(Phaser);