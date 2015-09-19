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
		this.background = new Background(this.game, "bgMainMenu");

		// Create map preview
		this.initMapPreview();

		// Add user input
		this.game.input.onTap.addOnce(function() {
			if(!this.mouseOverGUI()) {
				this.clearState();
				this.game.state.start("game", true, false, this.levelFolder, this.levelObj);
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