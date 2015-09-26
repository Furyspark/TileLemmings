var Lemming = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y, "lemming");
	game.add.existing(this);
	Object.defineProperty(this, "state", {
		get() {
			return game.state.getCurrentState();
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
			return this.parent.state.layers.tileLayer.getTileType(tileX, tileY, this.parent);
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
	this.addAnim("burn", "Burn", 13, {
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
Lemming.DEATHTYPE_BURN = 3;
Lemming.DEATHTYPE_INSTANT = 4;

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
		// Remove cursor
		this.cursor.selected = false;
		this.state.lemmingSelected = null;
		if (this.cursor.sprite != null) {
			this.cursor.sprite.destroy();
			this.cursor.sprite = null;
		}
		// Remove action preview
		this.removeActionPreview();
	}
};

Lemming.prototype.cursorSelect = function() {
	if (!this.cursor.selected) {
		// Create cursor
		this.cursor.selected = true;
		this.state.lemmingSelected = this;
		if (this.cursor.sprite == null) {
			this.cursor.sprite = new Cursor(game, this.x, this.y, this);
			this.cursor.sprite.reposition();
		}
		// Create action preview
		this.createActionPreview();
	}
};

Lemming.prototype.createActionPreview = function() {
	switch (this.state.actions.current.name) {
		case "builder":
			if (this.onFloor()) {
				this.placeActionPreviewTile(this.tile.x(this.x + (this.tile.width * this.dir)), this.tile.y(this.y - 1));
			}
			break;
		case "miner":
			if (this.onFloor()) {
				this.placeActionPreviewTile(this.tile.x(this.x + (this.tile.width * this.dir)), this.tile.y(this.y + 1));
				this.placeActionPreviewTile(this.tile.x(this.x + (this.tile.width * this.dir)), this.tile.y(this.y - (this.tile.height - 1)));
			}
			break;
		case "digger":
			if (this.onFloor()) {
				this.placeActionPreviewTile(this.tile.x(this.x), this.tile.y(this.y + 1));
			}
			break;
		case "blocker":
			if (this.onFloor()) {
				this.placeActionPreviewTile(this.tile.x(this.x), this.tile.y(this.y - 1));
			}
			break;
	}
};

Lemming.prototype.placeActionPreviewTile = function(tileX, tileY) {
	var gfx = game.add.image(tileX * this.tile.width, tileY * this.tile.height, "misc", "previewTile.png");
	this.state.levelGroup.add(gfx);
	this.state.actions.previewGroup.push(gfx);
};

Lemming.prototype.removeActionPreview = function() {
	var grp = this.state.actions.previewGroup;
	while (grp.length > 0) {
		var gobj = grp.shift();
		if (gobj.remove) {
			gobj.remove();
		} else {
			gobj.destroy();
		}
	}
};

Lemming.prototype.onFloor = function() {
	var checks = [
		this.tile.type(this.tile.x(this.x), this.tile.y(this.y), this),
		this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1), this)
	];
	return (GameData.tile.floorTiles.indexOf(checks[0]) !== -1 ||
		GameData.tile.floorTiles.indexOf(checks[1]) !== -1);
};

Lemming.prototype.turnAround = function() {
	this.scale.x = -this.scale.x;
	this.dir = -this.dir;
	this.velocity.x = -this.velocity.x;
	this.x += (this.velocity.x * this.state.speedManager.effectiveSpeed);
};

Lemming.prototype.update = function() {
	var checks = [],
		walkedUpRamp = false;

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
				checks[0] = this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1));
				checks[1] = this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1 - this.tile.height));
				checks[2] = this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1));
				if (GameData.tile.floorTiles.indexOf(checks[0]) !== -1 &&
					GameData.tile.floorTiles.indexOf(checks[1]) === -1) {
					this.y -= this.tile.height;
					checks[0] = this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1));
					checks[1] = this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1 - this.tile.height));
					walkedUpRamp = true;
				}
				// Check walk against wall
				if ((GameData.tile.wallTiles.indexOf(checks[0]) !== -1 && GameData.tile.wallTiles.indexOf(checks[1]) !== -1) || checks[2] == GameData.tile.type.BLOCKER) {
					// Turn around
					if (!this.attributes.climber ||
						(walkedUpRamp && ((GameData.tile.climbableWallTiles.indexOf(checks[0]) === -1 || GameData.tile.climbableWallTiles.indexOf(checks[1]) === -1) ||
							checks[2] == GameData.tile.type.BLOCKER))) {
						this.turnAround();
					}
					// Start climbing
					else if (this.attributes.climber && GameData.tile.climbableWallTiles.indexOf(checks[0]) !== -1 && GameData.tile.climbableWallTiles.indexOf(checks[1]) !== -1) {
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
			var alarm = new Alarm(game, 30, function() {
				if (this.action.name === "basher" && !this.action.idle) {
					this.clearAction();
				}
			}, this);
			var bashResult = this.state.map.removeTile(this.tile.x(this.x + ((this.tile.width * 0.5) * this.dir)), this.tile.y(this.y - 1));
			if (bashResult === 1 ||
				this.state.layers.tileLayer.getTileType(this.tile.x(this.x + ((this.tile.width * 0.5) * this.dir)), this.tile.y(this.y - 1)) == GameData.tile.type.TILE ||
				this.state.layers.tileLayer.getTileType(this.tile.x(this.x + ((this.tile.width * 1.5) * this.dir)), this.tile.y(this.y - 1)) == GameData.tile.type.TILE) {
				alarm.cancel();
			} else if (bashResult === 2) {
				alarm.cancel;
				GameManager.audio.play("sndChink");
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
					if (objs.indexOf(group[a]) === -1 && group[a] !== this) {
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
					var sndKey = game.cache.getJSON("config").props.exits[exitProp.type].sound.exit;
					if (sndKey) {
						GameManager.audio.play(sndKey);
					}
					this.velocity.x = 0;
					this.velocity.y = 0;
					this.animations.currentAnim.onComplete.addOnce(function() {
						this.state.victoryState.saved++;
						this.remove();
					}, this);
				}
			}
		}

		// Die outside room
		if (this.isOutsideLevel()) {
			this.die(Lemming.DEATHTYPE_OUT_OF_ROOM);
		}

		// Drown
		if (this.tile.type(this.tile.x(this.x), this.tile.y(this.y)) == GameData.tile.type.WATER) {
			this.die(Lemming.DEATHTYPE_DROWN);
		}
	}

	if (this.markedForRemoval) {
		// Remove label
		if (this.gameLabel) {
			this.gameLabel.remove();
		}
		this.removeActionPreview();
		// Remove from state's group
		this.active = false;
		// Kill self
		this.pendingDestroy = true;
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
	this.animations.play(key, frameRate * Math.max(1, this.state.speedManager.effectiveSpeed));
	// this.anchor.setTo(
	// 	0.5 - (this.animationProperties[key].offset.x / this.width),
	// 	1 - (this.animationProperties[key].offset.y / this.height)
	// );
	if (this.state.speedManager.effectiveSpeed === 0) {
		this.animations.paused = true;
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
	var actionSuccess = false;
	if ((actionName != this.action.name || (actionName === "builder" && this.animations.currentAnim.name === "build_end")) &&
		(this.action.name !== "blocker" || (this.action.idle && actionName === "blocker")) &&
		!this.dead && this.active) {
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
					actionSuccess = true;
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
					actionSuccess = true;
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
					actionSuccess = true;
					// Set action
					this.action.name = actionName;
					this.action.active = true;
					this.action.value = 0;
					this.playAnim("dig", 15);
					// Set velocity
					this.velocity.x = 0;
					// Set alarm
					this.action.alarm = new Alarm(game, 120, function() {
						this.proceedDig();
					}, this);
				}
				break;
				// SET ACTION: Miner
			case "miner":
				if (this.onFloor()) {
					this.clearAction();
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
					// Set action
					this.action.name = actionName;
					this.action.active = true;
					this.action.value = 0;
					this.playAnim("mine", 15);
					// Set velocity
					this.velocity.x = 0;
					// Set alarm
					this.action.alarm = new Alarm(game, 150, function() {
						this.proceedMine();
					}, this);
				}
				break;
				// SET ACTION: Blocker
			case "blocker":
				if (this.onFloor()) {
					this.clearAction();
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
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
					actionSuccess = true;
					this.attributes.floater = true;
				}
				break;
				// SET ACTION: Climber
			case "climber":
				if (!this.attributes.climber) {
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
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
				actionSuccess = true;
				this.setExploder();
				break;
		}
	}
	// Play sound
	if (actionSuccess) {
		GameManager.audio.play("sndAction");
	}
};

Lemming.prototype.setExploder = function() {
	this.subaction.clear();
	// Set action
	this.subaction.name = "exploder";
	this.subaction.active = true;
	this.subaction.value = 5;
	// Create label
	this.gameLabel = new GameLabel(game, this, this.x, this.y, {
		x: 0,
		y: -((this.bbox.bottom - this.bbox.top) + 8)
	}, "5");
	// Create alarm
	this.subaction.alarm = new Alarm(game, 60, function() {
		this.proceedExplode();
	}, this);
};

Lemming.prototype.proceedBuild = function() {
	if (this.action.name == "builder" && !this.action.idle && !this.dead && this.active) {
		this.action.value--;
		if (this.action.value < 2) {
			GameManager.audio.play("sndBuildEnding");
		}
		var moveTo = {
			x: this.x + (this.tile.width * this.dir),
			y: (this.y - this.tile.height)
		};
		var locChange = {
			x: this.x + (this.tile.width * this.dir),
			y: this.y - 1
		};
		var checks = [
			this.tile.type(this.tile.x(moveTo.x), this.tile.y(moveTo.y - 1)), // <- Tile the builder is about to move to (+1 horizontally in Lemming's direction, -1 vertically)
			this.tile.type(this.tile.x(locChange.x), this.tile.y(locChange.y)), // <- Tile about to change to a plank(+1 horizontally in Lemming's direction)
			this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1)) // <- Lemming's tile (for blocker checking)
		];
		// Turn around at a blocker
		if (checks[0] == GameData.tile.type.BLOCKER || checks[1] == GameData.tile.type.BLOCKER || checks[2] == GameData.tile.type.BLOCKER) {
			// Turn around
			this.turnAround();
			// Re-evaluate checks
			moveTo = {
				x: this.x + (this.tile.width * this.dir),
				y: (this.y - this.tile.height)
			};
			locChange = {
				x: this.x + (this.tile.width * this.dir),
				y: this.y - 1
			};
			checks = [
				this.tile.type(this.tile.x(moveTo.x), this.tile.y(moveTo.y - 1)), // <- Tile the builder is about to move to (+1 horizontally in Lemming's direction, -1 vertically)
				this.tile.type(this.tile.x(locChange.x), this.tile.y(locChange.y)), // <- Tile about to change to a plank(+1 horizontally in Lemming's direction)
				this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1)) // <- Lemming's tile (for blocker checking)
			];
		}
		// See whether we can build a step
		if (checks[0] == GameData.tile.type.AIR) {
			// Move to new place
			this.x = moveTo.x;
			this.y = moveTo.y;
			// Build a step
			if (checks[1] == GameData.tile.type.AIR) {
				this.state.layers.primitiveLayer.placeTile(this.tile.x(locChange.x), this.tile.y(locChange.y), "tilesetPlaceables", this.state.buildTileRect, 1);
			}
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
			GameManager.audio.play("sndChink");
			this.clearAction();
		} else {
			this.y += this.tile.height;
			// Set up new alarm
			this.action.alarm = new Alarm(game, 120, function() {
				this.proceedDig();
			}, this);
		}
	}
};

Lemming.prototype.proceedMine = function() {
	if (this.action.name == "miner" && !this.action.idle && !this.dead && this.active) {
		// Check for blockers
		var checks = [
			this.tile.type(this.tile.x(this.x), this.tile.y(this.y - 1)),
			this.tile.type(this.tile.x(this.x + (GameData.tile.width * this.dir)), this.tile.y(this.y - 1)),
			this.tile.type(this.tile.x(this.x + (GameData.tile.width * this.dir)), this.tile.y(this.y + (GameData.tile.height - 1)))
		];
		if (checks[0] == GameData.tile.type.BLOCKER || checks[1] == GameData.tile.type.BLOCKER || checks[2] == GameData.tile.type.BLOCKER) {
			this.turnAround();
		}

		// Remove tile(s)
		var result = this.state.map.removeTile(this.tile.x(this.x + (GameData.tile.width * this.dir)), this.tile.y(this.y - 1));
		if (result === 2) {
			GameManager.audio.play("sndChink");
			this.clearAction();
		} else {
			result = this.state.map.removeTile(this.tile.x(this.x + (GameData.tile.width * this.dir)), this.tile.y(this.y + (GameData.tile.height - 1)));
			if (result === 2) {
				GameManager.audio.play("sndChink");
				this.clearAction();
			} else {
				this.x += (this.tile.width * this.dir);
				this.y += this.tile.height;
				// Set up new alarm
				this.action.alarm = new Alarm(game, 150, function() {
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
			if (this.gameLabel) {
				this.gameLabel.remove();
			}
			if (this.onFloor()) {
				GameManager.audio.play("sndOhNo");
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
			this.subaction.alarm = new Alarm(game, 60, function() {
				this.proceedExplode();
			}, this);
		}
	}
};

Lemming.prototype.explode = function() {
	GameManager.audio.play("sndPop");
	// Remove 3x3 tiles
	for (var a = -1; a <= 1; a++) {
		for (var b = -1; b <= 1; b++) {
			var xCheck = this.tile.x(this.x) + a;
			var yCheck = this.tile.y(this.y - (this.tile.height * 0.5)) + b;
			this.state.map.removeTile(xCheck, yCheck);
		}
	}
	// Remove self
	this.remove();
};

Lemming.prototype.detectByAction = function(xCheck, yCheck, actionName) {
	var group = this.state.lemmingsGroup.children;
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
	if (this.gameLabel) {
		this.gameLabel.remove();
	}
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
			GameManager.audio.play("sndDie");
			this.remove();
			break;
			// DEATH ACTION: Fall death
		case Lemming.DEATHTYPE_FALL:
			GameManager.audio.play("sndSplat");
			this.playAnim("splat", 15);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.remove();
			}, this);
			break;
		case Lemming.DEATHTYPE_DROWN:
			GameManager.audio.play("sndDrown");
			this.playAnim("drown", 15);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.remove();
			}, this);
			break;
		case Lemming.DEATHTYPE_BURN:
			GameManager.audio.play("sndBurn");
			this.playAnim("burn", 15);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.remove();
			}, this);
			break;
		case Lemming.DEATHTYPE_INSTANT:
			this.remove();
			break;
	}
};

Lemming.prototype.remove = function() {
	this.markedForRemoval = true;
};