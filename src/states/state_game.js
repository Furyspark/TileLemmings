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
		game.input.activePointer.rightButton.onDown.add(function() {
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