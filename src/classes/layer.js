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
	this.tileMods = [];

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

Layer.TILE_FLIP_H = 0x80000000;
Layer.TILE_FLIP_V = 0x40000000;
Layer.TILE_FLIP_HV = 0x20000000;
Layer.TILE_CLEAR_BITMASK = ~(Layer.TILE_FLIP_H | Layer.TILE_FLIP_V | Layer.TILE_FLIP_HV);

Layer.IDENTIFIER_MOD = /^(?:tilemods?)/;

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
			this.tileMods.push(null);
			this.tileTypes.push(0);
		}
	}

	// Tile layer
	var a, b, gid, baseGID, tile, ts, animCrops, flip;
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
							ts.indexToCoords(ts.tileAnimations[baseGID][b].baseGID).x,
							ts.indexToCoords(ts.tileAnimations[baseGID][b].baseGID).y
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
				if(this.name === "tiles") {
					if(ts.tileProperties[baseGID] && ts.tileProperties[baseGID].tileType) {
						this.setTileType(this.indexToCoords(a).x, this.indexToCoords(a).y, parseInt(ts.tileProperties[baseGID].tileType));
					}
					else {
						this.setTileType(this.indexToCoords(a).x, this.indexToCoords(a).y, 1);
					}
				}
				// Set mod type
				else if(Layer.IDENTIFIER_MOD.test(this.name)) {
					if(ts.tileProperties[baseGID] && ts.tileProperties[baseGID].modType) {
						this.setModType(this.indexToCoords(a).x, this.indexToCoords(a).y, parseInt(ts.tileProperties[baseGID].modType), ts.tileProperties[baseGID]);
					}
				}
			}
		}
	}

	// Object layer
	var obj, srcObj, tsObjSrc, delay, propConfig;
	if(this.type == Layer.OBJECT_LAYER) {
		for(a = 0;a < src.objects.length;a++) {
			srcObj = src.objects[a];
			// Attempt flipping
			flip = {
				h: (srcObj.gid & Layer.TILE_FLIP_H) !== 0,
				v: (srcObj.gid & Layer.TILE_FLIP_V) !== 0,
				hv: (srcObj.gid & Layer.TILE_FLIP_HV) !== 0
			};
			srcObj.gid = srcObj.gid & Layer.TILE_CLEAR_BITMASK;
			// Proceed
			ts = this.level.tilesets[srcObj.gid];
			baseGID = srcObj.gid - ts.firstGID;
			tsObjSrc = ts.tileProperties[baseGID];
			// Create props
			if(tsObjSrc.propType) {
				obj = new Prop(srcObj.x + (srcObj.width * 0.5), srcObj.y, this.level);
				if(flip.h || flip.hv) {
					obj.scale.x = -obj.scale.x;
					obj.x += GameData.tile.width;
				}
				if(flip.v || flip.hv) {
					obj.scale.y = -obj.scale.y;
				}
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
						propConfig = game.cache.getJSON("config").props.traps[tsObjSrc.resref];
						obj.x += ((propConfig.anchor.x - 0.5) * srcObj.width);
						obj.y += ((propConfig.anchor.y - 0.5) * srcObj.height);
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
	if(x < 0 || x >= this.baseWidth || y < 0 || y >= this.baseHeight) {
		return -1;
	}
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
	if(index >= 0 && index < this.tileTypes.length) {
		this.tileTypes[index] = type;
	}
};

/*
	method: getTileType(tileX, tileY)
	Returns the tile type at the given position(in tile space)
*/
Layer.prototype.getTileType = function(tileX, tileY) {
	var index = this.coordsToIndex(tileX, tileY);
	if(index >= 0 && index < this.tileTypes.length) {
		return this.tileTypes[index];
	}
	return GameData.tile.type.AIR;
};

/*
	method: removeTile(tileX, tileY)
	Removes a tile from this layer without setting the tile type
*/
Layer.prototype.removeTile = function(tileX, tileY) {
	var index = this.coordsToIndex(tileX, tileY);
	if(index >= 0 && index < this.tiles.length) {
		var tile = this.tiles.splice(index, 1, null)[0];
		if(tile) {
			tile.destroy();
		}
	}
};

/*
	method: placeTile(tileX, tileY)
	Places a tile at the specified coordinates, removing an older tile if there is one
*/
Layer.prototype.placeTile = function(tileX, tileY, imageKey, cropping) {
	var index = this.coordsToIndex(tileX, tileY);
	if(index >= 0 && index < this.tiles.length) {
		var coord = this.level.toWorldSpace(tileX, tileY);
		var tile = new Tile(coord.x, coord.y, imageKey, [cropping]);
		this.add(tile);
		var oldTile = this.tiles.splice(index, 1, tile)[0];
		if(oldTile) {
			oldTile.destroy();
		}
	}
};

/*
	method: setModType(tileX, tileY, modType, modSrc)
	Marks these coordinates as a tile modifier
*/
Layer.prototype.setModType = function(tileX, tileY, modType, modSrc) {
	var index = this.coordsToIndex(tileX, tileY);
	var modObj = {
		type: modType
	};
	this.tileMods.splice(index, 1, modObj);
};

/*
	method: getTile(tileX, tileY)
	Returns the tile object in the specified coordinates in the layer
*/
Layer.prototype.getTile = function(tileX, tileY) {
	if(this.type === Layer.TILE_LAYER) {
		return this.tiles[this.coordsToIndex(tileX, tileY)];
	}
	return null;
};
