(function(Phaser) {var GUI = function(game, group, x, y) {
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
	this.callback = function() {};
	this.pressed = false;
	this.inputEnabled = true;
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

	this.label.text = "10";
	this.label.reposition();

	// Set on press action
	this.events.onInputDown.add(function() {
		this.select(true);
	}, this);
};

GUI_Button.prototype = Object.create(GUI.prototype);
GUI_Button.prototype.constructor = GUI_Button;

GUI_Button.prototype.set = function(stateObject, callback, subType) {
	this.callback = callback;
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

	this.callback();

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
var Lemming = function(game, group, x, y) {
	Phaser.Sprite.call(this, game, x, y, "lemming");
	game.add.existing(this);
	this.levelGroup = group;
	this.levelGroup.add(this);
	this.state = this.game.state.getCurrentState();

	// Set anchor
	this.anchor.setTo(0.5, 1);

	// Set physics
	game.physics.arcade.enable(this);
	this.body.setSize(16, 20);

	// Set animations
	this.addAnim("fall", "Fall", 4);
	this.addAnim("move", "Move", 10);
	this.addAnim("mine", "Mine", 24);
	this.animations.play("fall", 15);
	this.body.velocity.y = 100;

	this.objectType = "lemming";
};

Lemming.prototype = Object.create(Phaser.Sprite.prototype);
Lemming.prototype.constructor = Lemming;

Lemming.prototype.addAnim = function(key, animName, numFrames) {
	var a, frames = [];
	for(a = 0;a < numFrames;a += 1) {
		var anim = "sprLemming_" + animName + "_" + a.toString() + ".png";
		frames.push(anim);
	}
	this.animations.add(key, frames, 60, true);
};

Lemming.prototype.updatePhysics = function() {
	if(this.body.onFloor()) {
		this.animations.play("move", 15);
		this.body.velocity.x = 30;
		this.body.velocity.y = 1;
	}
	else {
		this.animations.play("fall", 15);
		this.body.velocity.x = 0;
		this.body.velocity.y = 100;
	}
};

Lemming.prototype.render = function() {
	
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
		tileLayer: null
	},
	bgm: null,

	map: null,
	tileLayer: null,
	levelGroup: null,
	lemmingsGroup: [],
	doorsGroup: [],
	exitsGroup: [],
	trapsGroup: [],
	guiGroup: null,

	actions: {
		climber: 0,
		floater: 0,
		exploder: 10,
		blocker: 0,
		builder: 0,
		basher: 0,
		miner: 0,
		digger: 0
	},
	actionSelect: "",
	actionButtons: {
		climber: null,
		floater: null,
		exploder: null,
		blocker: null,
		builder: null,
		basher: null,
		miner: null,
		digger: null
	},

	preload: function() {
		game.load.tilemap("level1", "assets/levels/level1.json", null, Phaser.Tilemap.TILED_JSON);
	},

	create: function() {
		// Set physics
		game.physics.startSystem(Phaser.Physics.ARCADE);
		// Set level stuff
		this.levelTimer = new Phaser.Timer(game);
		// Create groups
		this.levelGroup = new Phaser.Group(game);
		// this.levelGroup.scale.setTo(1.5);
		this.guiGroup = new Phaser.Group(game);

		// Set map
		this.map = new Phaser.Tilemap(game, "level1");
		this.map.tileWidth = 16;
		this.map.tileHeight = 16;
		this.map.addTilesetImage("pink", "tilesetPink");
		this.map.addTilesetImage("pillar", "tilesetPillar");
		this.tileLayer = this.map.createLayer("tiles");
		this.tileLayer.resizeWorld();
		this.map.setCollisionBetween(1, 65000);

		this.levelGroup.add(this.tileLayer);
		// Set map collisions

		for(var a in this.map.objects.objects) {
			var obj = this.map.objects.objects[a], newObj = null;
			// Create door
			if(obj.type == "door") {
				var newObj = new Prop(game, this.levelGroup, (obj.x + (obj.width * 0.5)), obj.y);
				newObj.setAsDoor("classic", 50, 500, this.lemmingsGroup);
				this.doorsGroup.push(newObj);
			}
		}

		// Create GUI
		this.createLevelGUI();

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
		for(var a in this.lemmingsGroup) {
			var obj = this.lemmingsGroup[a];
			game.physics.arcade.collide(obj, this.tileLayer);
			obj.updatePhysics();
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
		var bgmKey = this.map.properties.bgm;
		if(typeof bgmKey !== "undefined") {
			this.playBGM(bgmKey);
		}
	},

	playBGM: function(bgm) {
		this.bgm = game.sound.play(bgm, 1, true);
	},

	stopBGM: function() {
		if(this.bgm != null) {
			this.bgm.stop();
		}
	},

	createLevelGUI: function() {
		var actions = ["Climber", "Floater", "Exploder", "Blocker", "Builder", "Basher", "Miner", "Digger"];
		var buttons = [];

		// Create buttons
		for(var a in actions) {
			var action = actions[a];
			var btn = new GUI_Button(game, this.guiGroup, 0, game.camera.y + game.camera.height);
			buttons.push(btn);
			btn.set({
				released: "Btn_" + action + "_0.png",
				pressed: "Btn_" + action + "_1.png"
			}, function() {
				console.log(action + " selected");
			}, "action");

			// Assign buttons
			switch(action) {
				case "Climber":
				this.actionButtons.climber = btn;
				break;
				case "Floater":
				this.actionButtons.floater = btn;
				break;
				case "Exploder":
				this.actionButtons.exploder = btn;
				break;
				case "Blocker":
				this.actionButtons.blocker = btn;
				break;
				case "Builder":
				this.actionButtons.builder = btn;
				break;
				case "Basher":
				this.actionButtons.basher = btn;
				break;
				case "Miner":
				this.actionButtons.miner = btn;
				break;
				case "Digger":
				this.actionButtons.digger = btn;
				break;
			}
		}

		// Align buttons
		var alignX = 0;
		for(var a in buttons) {
			var btn = buttons[a];
			btn.x = alignX;
			alignX += btn.width;
			btn.y -= btn.height;
		}

		this.expendAction("exploder");
	},

	deselectAllActions: function() {
		for(var a in this.guiGroup.children) {
			var obj = this.guiGroup.children[a];
			if(obj.subType == "action") {
				obj.deselect();
			}
		}
	},

	expendAction: function(action) {
		// switch(action) {
		// 	case "climber":
		// 	this.actions.climber = Math.max(0, this.actions.climber - 1);
		// 	this.actionButtons.climber.label.text = this.actions.climber.toString();
		// 	break;
		// 	case "floater":
		// 	this.actions.floater = Math.max(0, this.actions.floater - 1);
		// 	this.actionButtons.floater.label.text = this.actions.floater.toString();
		// 	break;
		// 	case "exploder":
		// 	this.actions.exploder = Math.max(0, this.actions.exploder - 1);
		// 	this.actionButtons.exploder.label.text = this.actions.exploder.toString();
		// 	break;
		// 	case "blocker":
		// 	this.actions.blocker = Math.max(0, this.actions.blocker - 1);
		// 	this.actionButtons.blocker.label.text = this.actions.blocker.toString();
		// 	break;
		// 	case "builder":
		// 	this.actions.builder = Math.max(0, this.actions.builder - 1);
		// 	this.actionButtons.builder.label.text = this.actions.builder.toString();
		// 	break;
		// 	case "basher":
		// 	this.actions.basher = Math.max(0, this.actions.basher - 1);
		// 	this.actionButtons.basher.label.text = this.actions.basher.toString();
		// 	break;
		// 	case "miner":
		// 	this.actions.miner = Math.max(0, this.actions.miner - 1);
		// 	this.actionButtons.miner.label.text = this.actions.miner.toString();
		// 	break;
		// 	case "digger":
		// 	this.actions.digger = Math.max(0, this.actions.digger - 1);
		// 	this.actionButtons.digger.label.text = this.actions.digger.toString();
		// 	break;
		// }
		this.actions[action] = Math.max(0, this.actions[action] - 1);
		this.actionButtons[action].label.text = this.actions[action].toString();
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

game.state.start("boot");})(Phaser);