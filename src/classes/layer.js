var Layer = function(src, level) {
	Phaser.Group.call(this, game);

	// Set default values
	this.width = 1;
	this.height = 1;
	this.type = Layer.TILE_LAYER;
	this.tiles = [];
	this.tileTypes = [];

	// Apply source object
	this.applySource(src);
};
Layer.prototype = Object.create(Phaser.Group.prototype);
Layer.prototype.constructor = Layer;

Layer.TILE_LAYER = 0;
Layer.OBJECT_LAYER = 1;

/*
	method: applySource(src)
	Applies a source object to this layer
*/
Layer.prototype.applySource = function(src) {
	this.width = src.width;
	this.height = src.height;
	if(src.objects) {
		this.type = Layer.OBJECT_LAYER;
	}

	// Tile layer
	var a, gid, tile;
	if(this.type == Layer.TILE_LAYER) {
		for(a = 0;a < this.data.length;a++) {
			gid = this.data[a];
			tile = new Tile();
		}
	}
};

/*
	method: coordsToIndex(x, y)
	Calculates an index based in the size of this layer
*/
Layer.prototype.coordsToIndex = function(x, y) {
	return Math.floor(x % this.width) + Math.floor(y / this.width);
};

/*
	method: indexToCoords(index)
	Calculates tile coordinates based on the size of this layer
*/
Layer.prototype.indexToCoords = function(index) {
	return {
		x: Math.floor(index % this.width),
		y: Math.floor(index / this.width)
	};
};

/*
	method: setTileType(tileX, tileY, type)
	Sets the tile type for the given position
*/
Layer.prototype.setTileType = function(tileX, tileY, type) {
	var index = this.coordsToIndex(tileX, tileY);
	this.tileTypes[index] = type;
};
