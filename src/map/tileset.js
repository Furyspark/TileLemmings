function Game_Tileset() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Game_Tileset.prototype, {
  width: {
    get: function() {
      return this.texture.width / (this.tileWidth + this.spacing);
    }
  },
  height: {
    get: function() {
      return this.texture.height / (this.tileHeight + this.spacing);
    }
  }
});

Game_Tileset.prototype.init = function() {
  this.texture = null;
  this.firstGid = 1;
  this.margin = 2;
  this.spacing = 4;
  this.tileWidth = 16;
  this.tileHeight = 16;
  this.tileProperties = null;
}

Game_Tileset.prototype.getCrop = function(index) {
  return new Rect(
    this.margin + (this.tileWidth + this.spacing) * (index % this.width),
    this.margin + (this.tileHeight + this.spacing) * Math.floor(index / this.width),
    this.tileWidth,
    this.tileHeight
  );
}

Game_Tileset.prototype.getTileTexture = function(index) {
  var tex = this.texture.clone();
  tex.frame = this.getCrop(index);
  return tex;
}

Game_Tileset.prototype.getTileProperties = function(index) {
  if(this.tileProperties && this.tileProperties[index.toString()]) return this.tileProperties[index.toString()];
  return null;
}

Game_Tileset.prototype.getTileExtraProperties = function(index) {
  if(this.tiles && this.tiles[index.toString()]) return this.tiles[index.toString()];
  return null;
}
