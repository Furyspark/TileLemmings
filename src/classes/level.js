var Level = function(src, onLoad, onLoadContext) {
	// Set default properties
	this.properties = {};
	this.rawLayers = [];
	this.width = 1;
	this.height = 1;

	// Create callback
	this.onLoad = {
		callback: onLoad,
		context: onLoadContext
	};
	this.tilesets = [];

	// Keep track of assets
	this.expectedAssets = [];

	// Load assets
	this.loadAssets(src);
};
Level.prototype.constructor = Level;

/*
	method: loadAssets
	Loads this level's assets (tilesets, music, background)
*/
Level.prototype.loadAssets = function(src) {
	// Create callback
	game.load.onFileComplete.add(function levelLoad(progress, fileKey, success, totalLoadedFiles, totalFiles) {
		if(this.expectedAssets.indexOf(fileKey) !== -1) {
			// Splice expectation list
			var a = this.expectedAssets.indexOf(fileKey);
			if(a !== -1) {
				this.expectedAssets.splice(a, 1);
			}
			if(this.expectedAssets.length === 0) {
				game.load.onFileComplete.remove(levelLoad, this);
				this.onLoad.callback.call(this.onLoad.callback.context);
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
		game.load.audio("bgm", src.properties.bgm);
	}
	// Load Background
	if(src.properties && src.properties.bg) {
		this.expectedAssets.push("bg");
		game.load.audio("bg", src.properties.bg);
	}
};

/*
	method: loadTileset(src)
	Loads a tileset for this map
*/
Level.prototype.loadTileset = function(src) {
	var url = src.src, ts;
	this.expectedAssets.push(url);
	ts = new Tileset(url, this);
	this.tilesets.push(ts);
};

/*
	method: applySource(src)
	Applies a source to this level
*/
Level.prototype.applySource = function(src) {
	// Create layers
	var layer, tempLayer;
	for(a = 0;a < src.layers.length;a++) {
		layer = src.layers[a];
		this.addLayer(layer);
	}
};

/*
	method: addLayer(src)
	Adds a layer to this level
*/
Level.prototype.addLayer = function(src, firstgid) {
	var layer = new Layer(src, this);
	this.layers.push(layer);
};
