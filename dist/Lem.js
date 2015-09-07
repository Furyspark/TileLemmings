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
var Prop = function(game, group, x, y) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);
	this.levelGroup = group;
	this.levelGroup.add(this);
	this.state = this.game.state.getCurrentState();

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
				var lem = new Lemming(this.game, this.levelGroup, this.x, this.y + 30);
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
	layers: {
		tileLayer: {
			data: [],
			width: 1,
			height: 1,
			setType: function(x, y, type) {
				var index = Math.floor((x % this.width) + (y * this.width));
				this.data[index] = type;
			},
			logTiles: function() {
				var str = "";
				for(var a in this.data) {
					str += this.data[a];
					if(a % this.width == this.width-1) {
						str += "\n";
					}
				}
				console.log(str);
			}
		}
	},
	bgm: null,

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
		game.load.tilemap("level", "assets/levels/level1.json", null, Phaser.Tilemap.TILED_JSON);
	},

	create: function() {
		// Create groups
		this.levelGroup = new Phaser.Group(game);
		// this.levelGroup.scale.setTo(1.5);
		this.guiGroup = new Phaser.Group(game);
		
		// Create GUI
		this.createLevelGUI();

		// Create map
		this.map = new Phaser.Tilemap(game, "level");
		// Set tile size
		this.map.tileWidth = 16;
		this.map.tileHeight = 16;

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
		for(var a in this.map.layers) {
			var layer = this.map.layers[a];
			if(layer.name === "tiles") {
				for(var col in layer.data) {
					this.layers.tileLayer.height = Math.max(this.layers.tileLayer.height, parseInt(col)+1);
					var row = layer.data[col];
					for(var c in row) {
						this.layers.tileLayer.width = Math.max(this.layers.tileLayer.width, row.length);
						var tile = row[c];
						if(tile.index !== -1) {
							this.layers.tileLayer.data.push(1);
						}
						else {
							this.layers.tileLayer.data.push(0);
						}
					}
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
		// Place images
		this.map.addTilesetImage("pink", "tilesetPink");
		this.map.addTilesetImage("pillar", "tilesetPillar");

		// Set up action count
		for(var a in this.actions.items) {
			var action = this.actions.items[a];
			if(this.map.properties[action.name]) {
				this.setActionAmount(action.name, parseInt(this.map.properties[action.name]));
			}
		}
	},

	startLevel: function() {
		this.initMap();
		// Set physics
		game.physics.startSystem(Phaser.Physics.ARCADE);
		// Set level stuff
		// Create groups

		// Create map layers
		this.tileLayer = this.map.createLayer("tiles");
		this.tileLayer.resizeWorld();
		this.map.setCollisionBetween(1, 65000);

		this.levelGroup.add(this.tileLayer);
		// Set map collisions

		for(var a in this.map.objects.objects) {
			var obj = this.map.objects.objects[a];
			// Create door
			if(obj.type == "door") {
				var newObj = new Prop(game, this.levelGroup, (obj.x + (obj.width * 0.5)), obj.y);
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

	update: function() {
		// for(var a in this.lemmingsGroup) {
		// 	var obj = this.lemmingsGroup[a];
		// 	// game.physics.arcade.collide(obj, this.tileLayer);
		// 	// obj.updatePhysics();
		// }
		for(var a in this.alarms.data) {
			var alarm = this.alarms.data[a];
			alarm.step();
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