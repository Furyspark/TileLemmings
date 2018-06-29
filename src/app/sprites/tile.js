function Sprite_Tile() {
  this.init.apply(this, arguments);
}

Sprite_Tile.prototype = Object.create(Sprite_Base.prototype);
Sprite_Tile.prototype.constructor = Sprite_Tile;

Sprite_Tile.prototype.init = function(texture) {
  Sprite_Base.prototype.init.call(this, texture);
  this.z = 0;
  this.animSpeed = 0.25;
}

Sprite_Tile.prototype.addAnimationFrame = function(animKey, tileset, index) {
  if(!this.animations[animKey]) this.addAnimation(animKey);
  var anim = this.getAnimation(animKey);
  var tex = tileset.getTileTexture(index);
  anim.frames.push(tex);
}

Sprite_Tile.prototype.update = function() {
  Sprite_Base.prototype.update.call(this);
  var arr = this.children.slice();
  for(var a = 0;a < arr.length;a++) {
    if(arr[a].update) arr[a].update();
  }
}
