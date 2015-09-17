var intermissionState = {
	levelFolder: null,
	levelObj: null,
	background: null,

	map: null,
	minimap: null,

	init: function(levelFolder, levelObj, retry) {
		this.levelFolder = levelFolder;
		this.levelObj = levelObj;
	},

	preload: function() {
		game.load.json("level", this.levelFolder.baseUrl + this.levelObj.filename);
	},

	create: function() {
		this.background = new Background(this.game, "bgMainMenu");

		// Init bitmap data
		if(!game.cache.checkBitmapDataKey("previewTileNormal")) {
			normalBmd = this.game.add.bitmapData(8, 8);
			normalBmd.fill(0, 255, 0, 1);
			game.cache.addBitmapData("previewTileNormal", normalBmd);
		}
		if(!game.cache.checkBitmapDataKey("previewTileSteel")) {
			steelBmd = this.game.add.bitmapData(8, 8);
			steelBmd.fill(127, 127, 127, 1);
			game.cache.addBitmapData("previewTileSteel", steelBmd);
		}
		if(!game.cache.checkBitmapDataKey("previewBG")) {
			steelBmd = this.game.add.bitmapData(8, 8);
			steelBmd.fill(0, 0, 0, 1);
			game.cache.addBitmapData("previewBG", steelBmd);
		}

		this.initMapPreview();

		this.game.input.onTap.addOnce(function() {
			this.game.state.start("game", true, false, this.levelFolder, this.levelObj);
		}, this);
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
		var gfx = game.add.image(0, 0, game.cache.getBitmapData("previewBG"));
		gfx.width = (8 * this.map.width);
		gfx.height = (8 * this.map.height);
		this.minimap.add(gfx);
		for(var a = 0;a < this.map.tileLayer.length;a++) {
			var tileType = this.map.tileLayer[a];
			if(tileType > 0) {
				// Determine position
				var place = {
					xTile: (a % this.map.width),
					yTile: Math.floor(a / this.map.width)
				};
				place.xPos = place.xTile * 8;
				place.yPos = place.yTile * 8;

				var bmd = "previewTileNormal";
				if(tileType === 2) {
					bmd = "previewTileSteel";
				}
				var gfx = game.add.image(place.xPos, place.yPos, game.cache.getBitmapData(bmd));
				this.map.primitiveLayer.push(gfx);
				this.minimap.add(gfx);
				gfx.bringToTop();
			}
		}
		this.minimap.width = Math.max(240, Math.min(480, this.map.width * 4));
		this.minimap.height = Math.max(180, Math.min(480, this.map.height * 4));
		this.minimap.x = (this.game.stage.width - 30) - this.minimap.width;
		this.minimap.y = 30;

		this.levelNameText = this.game.add.text(120, 10, this.levelObj.name, {
			font: "bold 20pt Arial",
			fill: "#FFFFFF",
			boundsAlignH: "center",
			stroke: "#000000",
			strokeThickness: 3
		});
		this.levelNameText.setTextBounds(0, 0, 240, 40);

		var newStyle = {
			font: "12pt Arial",
			fill: "#FFFFFF",
			stroke: "#000000",
			strokeThickness: 3
		};
		this.saveText = this.game.add.text(120, 70, lemmingCount.toString() + " lemmings\n" + ((this.map.properties.need / lemmingCount) * 100) + "% to be saved", newStyle);
		this.saveText.setTextBounds(0, 0, 240, 80);

		// Free memory
		this.game.cache.removeJSON("level");
	}
};