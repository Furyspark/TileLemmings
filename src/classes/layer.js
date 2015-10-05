var Layer = function(src, level) {
	Phaser.Group.call(this, game);

	this.level = level;
	this.name = "";

	// Set default values
	this.baseWidth = 1;
	this.baseHeight = 1;
	this.type = Layer.UNKNOWN_LAYER;

	// Tile layer stuff
	this.tiles = [];
	this.tileTypes = [];

	// Object layer stuff
	this.doorGroup = game.add.group(this);
	this.exitGroup = game.add.group(this);
	this.trapGroup = game.add.group(this);

	// Apply source object
	this.applySource(src);
};
Layer.prototype = Object.create(Phaser.Group.prototype);
Layer.prototype.constructor = Layer;

Layer.UNKNOWN_LAYER = 0;
Layer.TILE_LAYER = 1;
Layer.OBJECT_LAYER = 2;

/*
	method: applySource(src)
	Applies a source object to this layer
*/
Layer.prototype.applySource = function(src) {
	this.baseWidth = src.width;
	this.baseHeight = src.height;
	this.name = src.name;

	if(src.data) {
		this.type = Layer.TILE_LAYER;
	}
	else if(src.objects) {
		this.type = Layer.OBJECT_LAYER;
	}

	// Fill tile layer
	if(this.type == Layer.TILE_LAYER) {
		while(this.tiles.length < this.baseWidth * this.baseHeight) {
			this.tiles.push(null);
			this.tileTypes.push(0);
		}
	}

	// Tile layer
	var a, b, gid, baseGID, tile, ts, animCrops;
	if(this.type == Layer.TILE_LAYER) {
		for(a = 0;a < src.data.length;a++) {
			gid = src.data[a];
			if(gid > 0) {
				// Determine tileset
				ts = this.level.tilesets[gid];
				baseGID = gid - ts.firstGID;
				// Determine animation croppings
				animCrops = [];
				if(ts.tileAnimations[baseGID]) {
					for(b = 0;b < ts.tileAnimations[baseGID].length;b++) {
						animCrops.push(ts.getTileCrop(
							ts.indexToCoords(ts.tileAnimations[baseGID].baseGID.x),
							ts.indexToCoords(ts.tileAnimations[baseGID].baseGID.y)
						));
					}
				}
				else {
					animCrops = [ts.getTileCrop(ts.indexToCoords(baseGID).x, ts.indexToCoords(baseGID).y)];
				}
				// Add tile
				tile = new Tile(this.indexToCoords(a).x * GameData.tile.width, this.indexToCoords(a).y * GameData.tile.height, ts.imageKey, animCrops);
				this.tiles[a] = tile;
				this.add(tile);
				// Set tile type
				if(ts.tileProperties[baseGID] && ts.tileProperties[baseGID].tileType) {
					this.setTileType(this.indexToCoods(a).x, this.indexToCoords(a).y, parseInt(ts.tileProperties[baseGID].tileType));
				}
				else {
					this.setTileType(this.indexToCoords(a).x, this.indexToCoords(a).y, 1);
				}
			}
		}
	}

	// Object layer
	var obj, srcObj, tsObjSrc, delay;
	if(this.type == Layer.OBJECT_LAYER) {
		for(a = 0;a < src.objects.length;a++) {
			srcObj = src.objects[a];
			ts = this.level.tilesets[srcObj.gid];
			baseGID = srcObj.gid - ts.firstGID;
			tsObjSrc = ts.tileProperties[baseGID];
			// Create props
			if(tsObjSrc.propType) {
				obj = new Prop(srcObj.x + (srcObj.width * 0.5), srcObj.y);
				switch(tsObjSrc.propType) {
					case "door":
						obj.y -= srcObj.height;
						this.level.lemmingCount += parseInt(srcObj.properties.value);
						delay = 0;
						if(srcObj.delay) {
							delay = srcObj.delay;
						}
						obj.setAsDoor(tsObjSrc.resref, srcObj.properties.value, srcObj.properties.rate, delay);
						this.doorGroup.add(obj);
						break;
					case "exit":
						obj.setAsExit(tsObjSrc.resref);
						this.exitGroup.add(obj);
						break;
					case "trap":
						obj.setAsTrap(tsObjSrc.resref);
						this.trapGroup.add(obj);
						break;
				}
			}
		}
	}
};

/*
	method: coordsToIndex(x, y)
	Calculates an index based in the size of this layer
*/
Layer.prototype.coordsToIndex = function(x, y) {
	return Math.floor((x % this.baseWidth) + Math.floor(y * this.baseWidth));
};

/*
	method: indexToCoords(index)
	Calculates tile coordinates based on the size of this layer
*/
Layer.prototype.indexToCoords = function(index) {
	return {
		x: Math.floor(index % this.baseWidth),
		y: Math.floor(index / this.baseWidth)
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

/*
	method: getTileType(tileX, tileY)
	Returns the tile type at the given position(in tile space)
*/
Layer.prototype.getTileType = function(tileX, tileY) {
	return this.tileTypes[this.coordsToIndex(tileX, tileY)];
};
