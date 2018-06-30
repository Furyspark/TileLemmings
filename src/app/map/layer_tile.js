function Layer_Tile() {
  this.initialize.apply(this, arguments);
};

Layer_Tile.prototype.initialize = function(map) {
  this._map = map;
  this._data = [];
  this.clear();
};

Layer_Tile.prototype.getMap = function() {
  return this._map;
};

Layer_Tile.prototype.getWidth = function() {
  return this.getMap().width;
};

Layer_Tile.prototype.getHeight = function() {
  return this.getMap().height;
};

Layer_Tile.prototype.getSize = function() {
  return this.getWidth() * this.getHeight();
};

Layer_Tile.prototype.getIndex = function(pos) {
  return pos.x + pos.y * this.getWidth();
};

Layer_Tile.prototype.getPos = function(index) {
  return new Point(
    index % this.getWidth(),
    Math.floor(index / this.getWidth())
  );
};

Layer_Tile.prototype.removeTile = function(index) {
  let tile = this._data[index];
  if(tile == null) return false;
  this._data.splice(index, 1, null);
  $gameMap._tempTiles.push(tile);
  this.getMap().world.removeChild(tile.sprite);
  return true;
};

Layer_Tile.prototype.clear = function() {
  // Remove old tiles
  for(let a = 0;a < this._data.length;a++) {
    this.removeTile(index);
  }
  // Resize and fill data with null
  this._data = [];
  while(this._data.length < this.getSize()) {
    this._data.push(null);
  }
};

Layer_Tile.prototype.addTile = function(index, tile) {
  // Remove old tile (if any)
  this.removeTile(index);
  // Add tile
  this._data.splice(index, 1, tile);
  if(tile != null) {
    // Remove from temp tiles, if possible
    let tempIndex = $gameMap._tempTiles.indexOf(tile);
    if(tempIndex >= 0) {
      $gameMap._tempTiles.splice(tempIndex, 1);
    }
    // Add tile's sprite
    this.getMap().world.addChild(tile.sprite);
    // Reposition tile
    let pos = this.getPos(index);
    tile.x = pos.x * this.getMap().tileHeight;
    tile.y = pos.y * this.getMap().tileHeight;
  }
};

Layer_Tile.prototype.replaceTile = function(index, tile) {
  if(index >= 0 && index < this.getSize()) {
    this.addTile(index, tile);
  }
};

Layer_Tile.prototype.getTileByIndex = function(index) {
  return this._data[index];
};

Layer_Tile.prototype.getTileByPos = function(pos) {
  let index = this.getIndex(pos);
  return this._data[index];
};
