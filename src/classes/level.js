var Level = function(src, onLoad, onLoadContext, levelFolder, levelObj) {
	Phaser.Group.call(this, game);
	game.world.add(this);
	GameManager.level = this;
	// Set default properties
	this.properties = {};
	this.rawLayers = [];

	this.baseWidth = 1;
	this.baseHeight = 1;

	this.levelFolder = levelFolder;
	this.levelObj = levelObj;
	this.baseUrl = this.levelFolder.baseUrl;
	this.name = this.levelObj.name;
	this.tileLayer = null;
	this.objectLayer = null;
	this.bg = null;

	this.lemmingsGroup = game.add.group(this);
	this.lemmingCount = 0;
	this.lemmingNeed = 1;
	this.actions = {};

	// Set game stuff
	this.started = false;
	this.ended = false;

	// Define properties
	Object.defineProperties(this, {
		"totalWidth": {
			get() {
				return this.baseWidth * GameData.tile.width;
			}
		},
		"totalHeight": {
			get() {
				return this.baseHeight * GameData.tile.height;
			}
		}
	});

	// Create callback
	this.onLoad = {
		callback: onLoad,
		context: onLoadContext
	};
	this.tilesets = [null];

	// Keep track of assets
	this.expectedAssets = [];

	// Load assets
	this.loadAssets(src);
};
Level.prototype = Object.create(Phaser.Group.prototype);
Level.prototype.constructor = Level;

/*
	method: loadAssets
	Loads this level's assets (tilesets, music, background)
*/
Level.prototype.loadAssets = function(src) {
	// Create callback
	game.load.onFileComplete.add(function levelLoad(progress, fileKey, success, totalLoadedFiles, totalFiles) {
		if(this.expectedAssets.indexOf(fileKey) !== -1) {
			// Create background
			if(fileKey === "bg") {
				this.createBackground();
			}
			// Splice expectation list
			var a = this.expectedAssets.indexOf(fileKey);
			if(a !== -1) {
				this.expectedAssets.splice(a, 1);
			}
			if(this.expectedAssets.length === 0) {
				game.load.onFileComplete.remove(levelLoad, this);
				this.applySource(src);
			}
		}
	}, this);

	var a, ts;
	// Create tilesets
	for(a = 0;a < src.tilesets.length;a++) {
		this.loadTileset(src.tilesets[a]);
	}
	// Load BGM
	if(src.properties && src.properties.bgm) {
		this.expectedAssets.push("bgm");
		game.load.audio("bgm", "assets/audio/bgm/" + src.properties.bgm);
	}
	// Load Background
	if(src.properties && src.properties.bg) {
		this.expectedAssets.push("bg");
		game.load.image("bg", "assets/gfx/backgrounds/" + src.properties.bg);
	}
};

/*
	method: loadTileset(src)
	Loads a tileset for this map
*/
Level.prototype.loadTileset = function(src) {
	var url = this.baseUrl + src.source;
	var ts;
	this.expectedAssets.push("ts_" + url);
	ts = new Tileset(url, this, src.firstgid);
	this.tilesets.push(ts);
};

/*
	method: applySource(src)
	Applies a source to this level
*/
Level.prototype.applySource = function(src) {
	// Set size
	this.baseWidth = src.width;
	this.baseHeight = src.height;

	// Create layers
	var layer, tempLayer, a;
	for(a = 0;a < src.layers.length;a++) {
		layer = src.layers[a];
		this.addLayer(layer);
	}

	// Set properties
	if(src.properties.need) {
		this.lemmingNeed = parseInt(src.properties.need);
	}
	// Set actions
	for(a in GameData.actions) {
		if(src.properties[a]) {
			this.actions[a] = {
				value: src.properties[a]
			};
		}
	}

	// Do callback to the intermission
	this.onLoad.callback.call(this.onLoad.context);
};

/*
	method: addLayer(src)
	Adds a layer to this level
*/
Level.prototype.addLayer = function(src, firstgid) {
	var layer = new Layer(src, this);
	if(layer.name === "tiles") {
		this.tileLayer = layer;
	}
	else if(layer.name === "objects") {
		this.objectLayer = layer;
	}
	this.rawLayers.push(layer);
	this.add(layer);
};

Level.prototype.zOrder = function() {
	var a;
	// Set (z-)order of display objects
	// Background
	if (this.bg) {
		this.bringToTop(this.bg);
	}
	// Objects
	this.bringToTop(this.objectLayer);
	this.bringToTop(this.tileLayer);
	// for(a = 0;a < this.actions.previewGroup.length;a++) {
	// 	obj = this.actions.previewGroup[a];
	// 	this.levelGroup.bringToTop(obj);
	// }
	// Lemmings
	this.bringToTop(this.lemmingsGroup);
	for(a = 0;a < this.lemmingsGroup.children.length;a++) {
		obj = this.lemmingsGroup.children[a];
		if(obj.cursor.sprite) {
			this.bringToTop(obj.cursor.sprite);
		}
	}
	//this.level.bringToTop(this.gridGroup);
};

/*
	method: createBackground
	Creates a background for this level
*/
Level.prototype.createBackground = function() {
	this.bg = new Background("bg", this);
};
