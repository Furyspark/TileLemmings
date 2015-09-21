var intermissionState = {
	levelFolder: null,
	levelObj: null,
	background: null,
	labels: [],
	guiGroup: [],

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
		// Add background
		this.background = new Background(game, "bgMainMenu");

		// Init map
		this.map = game.cache.getJSON("level");

		// Create map preview
		this.initMapPreview();

		// Add user input
		game.input.onTap.addOnce(function() {
			if(!this.mouseOverGUI()) {
				this.clearState();
				this.loadLevelFiles();
			}
		}, this);

		// Add 'return to main menu' button
		var btn = new GUI_MainMenuButton(game, 4, 4, "mainmenu");
		this.guiGroup.push(btn);
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.clearState();
			game.state.start("menu");
		}, this);
		btn.resize(60, 24);
		btn.label.text = "Main Menu";
		btn.label.fontSize = 10;
	},

	loadLevelFiles: function() {
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

		// Preload map files
		if(this.mapFiles.length > 0) {
			// Set load handler
			this.loadFunction = function(progress, fileKey, success, totalLoadedFiles, totalFiles) {
				if(progress === undefined) {
					progress = -1;
				}

				if(progress >= 0 && totalLoadedFiles >= totalFiles) {
					game.load.onFileComplete.remove(this.loadFunction, this);
					this.loadFunction = null;
					this.startLevel();
				}
				else if(!game.load.onFileComplete.has(this.loadFunction, this)) {
					game.load.onFileComplete.add(this.loadFunction, this);
				}
			};

			// Load files
			for(var a = 0;a < this.mapFiles.length;a++) {
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
			this.loadFunction();
		}
		else {
			// No files needed to be loaded: start level
			this.startLevel();
		}
	},

	startLevel: function() {
		game.state.start("game", true, false, this.levelFolder, this.levelObj);
	},

	mouseOverGUI: function() {
		for(var a = 0;a < this.guiGroup.length;a++) {
			var elem = this.guiGroup[a];
			if(elem.mouseOver()) {
				return true;
			}
		}
		return false;
	},

	clearState: function() {
		// Destroy minimap
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
		// Destroy labels
		while(this.labels.length > 0) {
			var gobj = this.labels.shift();
			if(gobj.remove) {
				gobj.remove();
			}
			else {
				gobj.destroy();
			}
		}
		// Destroy GUI elements (buttons etc)
		while(this.guiGroup.length > 0) {
			var gobj = this.guiGroup.shift();
			if(gobj.remove) {
				gobj.remove();
			}
			else {
				gobj.destroy();
			}
		}
	},

	initMapPreview: function() {
		this.minimap = new Phaser.Group(game);

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
		this.minimap.x = (game.width - 30) - this.minimap.width;
		this.minimap.y = 30;

		var txt = game.add.text(120, 10, this.levelObj.name, {
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
		txt = game.add.text(120, 70, lemmingCount.toString() + " lemmings\n" + Math.floor((this.map.properties.need / lemmingCount) * 100) + "% to be saved", newStyle);
		txt.setTextBounds(0, 0, 240, 80);
		this.labels.push(txt);

		// Free memory
		game.cache.removeJSON("level");
	},

	clearMapFiles: function(mapFiles) {
		// Remove map files
		for(var a = 0;a < mapFiles.length;a++) {
			var mapFile = mapFiles[a];
			switch(mapFile.type) {
				case "image":
					game.cache.removeImage(mapFile.key, true);
					break;
				case "sound":
					game.cache.removeSound(mapFile.key);
					break;
			}
		}
	}
};