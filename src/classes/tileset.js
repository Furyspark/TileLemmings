var Tileset = function(url, level, firstGID) {
	this.rawData = null;
	this.margin = 0;
	this.spacing = 0;
	this.firstGID = firstGID;
	this.tileCount = 0;
	this.tileProperties = {};
	this.tileAnimations = {};
	this.imageWidth = 0;
	this.imageHeight = 0;

	// Define properties
	Object.defineProperties(this, {
		"tileWidth": {
			get() {
				return this.imageWidth / (GameData.tile.width + this.spacing);
			}
		},
		"tileHeight": {
			get() {
				return this.imageHeight / (GameData.tile.height + this.spacing);
			}
		}
	});

	// Set references
	this.level = level;
	this.url = url;
	this.tempUrl = this.url.match(/(.+)\/.+$/)[1] + "/";
	this.imageKey = "";
	this.key = "ts_" + this.url;

	// Load data
	game.load.onFileComplete.add(function tilesetLoad(progress, fileKey, success, totalLoadedFiles, totalFiles) {
		if(fileKey == this.key) {
			game.load.onFileComplete.remove(tilesetLoad, this);
			this.processTileset();
		}
	}, this);
	game.load.json(this.key, this.url);
	game.load.start();
};
Tileset.prototype.constructor = Tileset;

/*
	method: coordsToIndex(x, y)
	Calculates an index based in the size of this tileset image
*/
Tileset.prototype.coordsToIndex = function(x, y) {
	return Math.floor(x % this.tileWidth) + Math.floor(y * this.tileWidth);
};

/*
	method: indexToCoords(index)
	Calculates tile coordinates based on the size of this tileset image
*/
Tileset.prototype.indexToCoords = function(index) {
	return {
		x: Math.floor(index % this.tileWidth),
		y: Math.floor(index / this.tileWidth)
	};
};

/*
	method: getTileCrop(tileX, tileY)
	Returns the cropping of a tile by coordinates
*/
Tileset.prototype.getTileCrop = function(tileX, tileY) {
	var result = new Phaser.Rectangle(
		this.margin + ((GameData.tile.width + this.spacing) * tileX),
		this.margin + ((GameData.tile.height + this.spacing) * tileY),
		GameData.tile.width,
		GameData.tile.height
	);
	return result;
};


/*
	method: processTileset()
	Called after the tileset's JSON is done loading
*/
Tileset.prototype.processTileset = function() {
	this.rawData = game.cache.getJSON(this.key);

	// Set base properties
	this.name = this.rawData.name;
	this.margin = this.rawData.margin;
	this.spacing = this.rawData.spacing;
	this.tileCount = this.rawData.tilecount;
	this.imageWidth = this.rawData.imagewidth;
	this.imageHeight = this.rawData.imageheight;

	// Link tileset to the level based on firstGID and tileCount
	var a;
	for(a = this.firstGID;a < this.firstGID + this.tileCount;a++) {
		this.level.tilesets[a] = this;
	}

	// Set tile properties
	var b;
	for(a in this.rawData.tileproperties) {
		this.tileProperties[a] = {};
		for(b in this.rawData.tileproperties[a]) {
			this.tileProperties[a][b] = this.rawData.tileproperties[a][b];
		}
	}

	// Set tile animations
	var srcAnim, anim;
	if(this.rawData.tiles) {
		for(a in this.rawData.tiles) {
			if(this.rawData.tiles[a].animation) {
				anim = [];
				srcAnim = this.rawData.tiles[a].animation;
				for(b = 0;b < srcAnim.length;b++) {
					anim.push({
						baseGID: srcAnim[b].tileid,
						duration: Math.floor(Math.max(1, ((srcAnim[b].duration * 1000) / 60)))
					});
				}
				this.tileAnimations[a] = anim;
			}
		}
	}

	// Load image
	if(this.rawData.image) {
		this.imageKey = "tsImg_" + this.url
		this.level.expectedAssets.push(this.imageKey);
		game.load.image(this.imageKey, this.tempUrl + this.rawData.image);
	}
};
