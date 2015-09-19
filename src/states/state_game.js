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
							obj.animations.currentAnim.paused = false;
							obj.animations.currentAnim.speed = (15 * this.effectiveSpeed);
						}
						else if(obj.animations.currentAnim && this.effectiveSpeed === 0) {
							obj.animations.paused = true;
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
				var delay = 0;
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
					if(objProps.delay) {
						delay = parseInt(objProps.delay);
					}
				}
				// Add to total lemming count
				this.victoryState.total += doorValue;
				// Create object
				newObj.setAsDoor(doorType, doorValue, doorRate, delay, this.lemmingsGroup.all);
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