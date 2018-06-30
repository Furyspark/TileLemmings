function Game_Map_SnapShot_Tile() {
  this.initialize.apply(this, arguments);
};

Game_Map_SnapShot_Tile.prototype.initialize = function(tile, index) {
  this.recordSnapShot(tile, index);
};

Game_Map_SnapShot_Tile.prototype.clear = function() {
  this.index = 0;
  this.tile  = null;
  this.sprite = {
    animFrame: 0,
    animSpeed: 0,
    animKey: ""
  };
};

Game_Map_SnapShot_Tile.prototype.recordSnapShot = function(tile, index) {
  this.clear();
  this.index = index;
  this.tile  = tile;
  if(tile == null) return;
  this.sprite.animFrame = tile.sprite.animFrame;
  this.sprite.animSpeed = tile.sprite.animSpeed;
  this.sprite.animKey   = tile.sprite.animKey;
};

Game_Map_SnapShot_Tile.prototype.apply = function() {
  $gameMap.tiles.replaceTile(this.index, this.tile);
};
