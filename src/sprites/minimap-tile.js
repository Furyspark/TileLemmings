function Sprite_MinimapTile() {
  this.init.apply(this, arguments);
}

Sprite_MinimapTile.prototype = Object.create(Sprite_Base.prototype);
Sprite_MinimapTile.prototype.constructor = Sprite_MinimapTile;

Sprite_MinimapTile.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  this.addAnimationExt("atlMinimap", "ground", 1, "tile.png");
  this.addAnimationExt("atlMinimap", "steel", 1, "steel.png");
  this.addAnimationExt("atlMinimap", "water", 1, "water.png");
  this.playAnimation("water");
}
