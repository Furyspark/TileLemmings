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