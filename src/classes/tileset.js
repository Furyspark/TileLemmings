var Tileset = function(url) {
	this.image = null;
	this.rawData = null;
	this.margin = 0;
	this.spacing = 0;
	this.tileCount = 0;
	this.tileProperties = {};

	this.url = url;

	// Load data
	game.load.onFileComplete.add(function tilesetLoad(progress, fileKey, success, totalLoadedFiles, totalFiles) {
		if(fileKey == this.url)
			game.load.onFileComplete.remove(tilesetLoad, this);
			this.processTileset();
		}
	}, this);
	game.load.json(this.url, this.url);
};
Tileset.prototype.constructor = Tileset;

/*
	method: processTileset()
	Called after the tileset's JSON is done loading
*/
Tileset.prototype.processTileset = function() {
	this.rawData = game.cache.getJSON(this.url);

	this.name = this.rawData.name;
	this.margin = this.rawData.margin;
	this.spacing = this.rawData.spacing;
	this.tileCount = this.rawData.tilecount;
	var a, b;
	for(a in this.rawData.tileproperties) {
		this.tileProperties[a] = {};
		for(b in this.rawData.tileproperties[a]) {
			this.tileProperties[a][b] = this.rawData.tileproperties[a][b];
		}
	}
	console.log(this.tileProperties);

	game.cache.removeJSON(this.url);
};
