(function(Phaser) {
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
					this.callback.call(this.callbackContext);
				}
				this.state.alarms.remove(this);
			}
		}
	}
};
var GUI = function(game, group, x, y) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);
	group.add(this);

	// Set references
	this.guiType = "undefined";
	this.subType = "";
	this.state = this.game.state.getCurrentState();
};

GUI.prototype = Object.create(Phaser.Sprite.prototype);
GUI.prototype.constructor = GUI;
var GUI_Button = function(game, group, x, y) {
	GUI.call(this, game, group, x, y);

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
	}, group);
	this.label.stroke = "#000000";
	this.label.strokeThickness = 3;
	this.label.owner = this;
	this.label.anchor.set(0.5);
	this.label.reposition = function() {
		this.x = this.owner.x + (this.owner.width / 2);
		this.y = this.owner.y + 10;
	};

	this.label.text = "";
	this.label.reposition();

	// Set on press action
	this.events.onInputDown.add(function() {
		this.select(true);
	}, this);
};

GUI_Button.prototype = Object.create(GUI.prototype);
GUI_Button.prototype.constructor = GUI_Button;

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
			var index = (tileX % this.parent.tileLayer.width) + (tileY * this.parent.tileLayer.width);
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
	var locChange = {
		x: this.tile.x(this.x),
		y: this.tile.y(this.y + (this.tile.height * 0.5))
	};
	// this.tileLayer.setType(locChange.x, locChange.y, 1);
	this.state.layers.primitiveLayer.placeTile(locChange.x, locChange.y, "tilesetPlaceables", new Phaser.Rectangle(32, 16, this.tile.width, this.tile.height), 1);
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
	zoom: 1.5,
	layers: {
		tileLayer: {
			data: [],
			state: null,
			setType: function(x, y, type) {
				var index = Math.floor((x % this.state.map.width) + (y * this.state.map.width));
				this.data[index] = type;
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
			}
		},
		primitiveLayer: {
			data: [],
			state: null,
			getTile: function(tileX, tileY) {
				return this.data[this.getIndex(tileX, tileY)];
			},
			getIndex: function(tileX, tileY) {
				return Math.floor((tileX % this.state.map.width) + (tileY * this.state.map.height));
			},
			removeTile: function(tileX, tileY) {
				var testTile = this.getTile(tileX, tileY);
				if(testTile != null) {
					testTile.destroy();
				}
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
				}
			},
			replaceTile: function(tileX, tileY, newTile) {
				this.removeTile(tileX, tileY);
				this.data[this.getIndex(tileX, tileY)] = newTile;
			}
		}
	},
	bgm: null,
	lemmingSelected: null,

	tileLayer: null,
	levelGroup: null,
	lemmingsGroup: [],
	doorsGroup: [],
	exitsGroup: [],
	trapsGroup: [],
	guiGroup: null,
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
		this.levelGroup.scale.setTo(this.zoom);
		this.guiGroup = new Phaser.Group(game);
		
		// Create GUI
		this.createLevelGUI();

		// Create camera config
		this.cam = {
			scrolling: false,
			gameCamera: game.camera
		};

		// Create map
		this.map = game.cache.getJSON("level");
		Object.defineProperty(this.map, "totalwidth", {get() {
			return this.width * this.tilewidth;
		}})
		Object.defineProperty(this.map, "totalheight", {get() {
			return this.height * this.tileheight;
		}});
		this.layers.tileLayer.width = this.map.width;
		this.layers.tileLayer.height = this.map.height;

		// Adjust camera bounds
		game.world.bounds.setTo(0, 0, this.map.totalwidth * this.zoom, this.map.totalheight * this.zoom);
		game.camera.bounds.setTo(0, 0, game.world.bounds.width, game.world.bounds.height);
		game.camera.setPosition(0, 0);

		// Predetermine map files
		var mapFiles = [];
		if(this.map.properties.bgm) {
			mapFiles.push({
				url: "assets/audio/bgm/" + this.map.properties.bgm,
				key: "bgm",
				type: "sound"
			});
		}

		// Set tile layers
		this.map.objects = [];
		for(var a in this.map.layers) {
			var layer = this.map.layers[a];
			if(layer.name === "tiles") {
				for(var b in layer.data) {
					var gid = layer.data[b];
					if(gid === 0) {
						this.layers.tileLayer.data.push(0);
					}
					else {
						this.layers.tileLayer.data.push(1);
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
		this.layers.primitiveLayer.getTile(10, 25).destroy();

		// Set up action count
		for(var a in this.actions.items) {
			var action = this.actions.items[a];
			if(this.map.properties[action.name]) {
				this.setActionAmount(action.name, parseInt(this.map.properties[action.name]));
			}
		}
	},

	enableUserInteraction: function() {
		// Add action assignment possibility
		game.input.activePointer.leftButton.onDown.add(function() {
			if(this.lemmingSelected != null && this.actions.current && this.actions.current.amount > 0) {
				this.lemmingSelected.setAction(this.actions.current.name);
			}
		}, this);
		// Add right-mouse scrolling possibility
		game.input.activePointer.leftButton.onDown.add(function() {
			console.log("MEW");
		}, this);
	},

	startLevel: function() {
		this.initMap();
		this.enableUserInteraction();
		// Set level stuff
		// Create groups

		// Create map layers
		// this.tileLayer = this.map.createLayer("tiles");
		// this.tileLayer.resizeWorld();

		// Create objects
		for(var a in this.map.objects) {
			var obj = this.map.objects[a];
			// Create door
			if(obj.type == "door") {
				var newObj = new Prop(game, (obj.x + (obj.width * 0.5)), obj.y);
				newObj.setAsDoor("classic", 50, 500, this.lemmingsGroup);
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

	zoomTo: function(factor) {
		this.zoom = factor;
		this.levelGroup.scale.setTo(factor);
	},

	update: function() {
		// Determine lemmings under mouse cursor
		var lemmingSelect = {
			data: [],
			removeBy: function(callback) {
				for(var a = this.data.length-1;a >= 0;a--) {
					var lem = this.data[a];
					if(callback.call(lem)) {
						this.data.splice(a, 1);
					}
				}
			}
		};
		for(var a = 0;a < this.lemmingsGroup.length;a++) {
			var obj = this.lemmingsGroup[a];
			obj.cursorDeselect();
			if(obj.mouseOver()) {
				lemmingSelect.data.push(obj);
			}
		}
		// Callback for checking the right lemming
		lemmingSelect.removeBy(this.lemmingSelectableCallback);
		if(lemmingSelect.data.length > 0) {
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
			var worldCursor = this.getWorldCursor();
			var camPos = {
				x: game.camera.x + (game.camera.width * 0.5),
				y: game.camera.y + (game.camera.height * 0.5)
			};
			console.log(worldCursor);
			console.log(camPos);
		}
	},

	render: function() {
		// var drawing = false;
		// for(var a in this.lemmingsGroup) {
		// 	var obj = this.lemmingsGroup[a];
		// 	if(typeof obj.render !== "undefined") {
		// 		obj.render();
		// 	}
		// 	if(obj.objectType == "lemming" && !drawing) {
		// 		drawing = true;
		// 		game.debug.bodyInfo(obj, 16, 24);
		// 	}
		// 	game.debug.body(obj);
		// }
	},

	lemmingSelectableCallback: function() {
		return false;
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
			var btn = new GUI_Button(game, this.guiGroup, 0, game.camera.y + game.camera.height);
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
		}
	},

	deselectAllActions: function() {
		for(var a in this.guiGroup.children) {
			var obj = this.guiGroup.children[a];
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