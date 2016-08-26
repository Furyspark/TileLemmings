function Background() {
  this.init.apply(this, arguments);
}

Background.prototype = Object.create(PIXI.extras.TilingSprite.prototype);
Background.prototype.constructor = Background;

Background.prototype.init = function(imageKey, w, h, tile, parallax) {
  if(!parallax) parallax = new Point(0.5, 0.5);
  if(!tile) tile = { x: true, y: true };
  var tex = null;
  if(imageKey && imageKey.length > 0) tex = Cache.getImage(imageKey);
  if(!w) w = Core.renderer.width;
  if(!h) h = Core.renderer.height;
  PIXI.extras.TilingSprite.prototype.constructor.call(this, tex, w, h);
  this.z = 1000;
  this.parallax = parallax;
  this.tile = tile;
}

Background.prototype.refreshTiling = function() {
  if(!this.tile.x && !this.tile.y) {
    var factor = Math.max(
      $gameMap.camera.rect.width / this.texture.width,
      $gameMap.camera.rect.height / this.texture.height
    );
    this.tileScale.set(factor);
  }
  else if(!this.tile.x && this.tile.y) {
    var factor = $gameMap.camera.rect.width / this.texture.width;
    this.tileScale.set(factor);
  }
  else if(!this.tile.y & this.tile.x) {
    var factor = $gameMap.camera.rect.height / this.texture.height;
    this.tileScale.set(factor);
  }
}

Background.prototype.update = function() {}

Background.prototype.refresh = function() {
  this.refreshTiling();
  if(this.tile.x) this.tilePosition.x = $gameMap.camera.rect.x * this.parallax.x;
  else this.tilePosition.x = $gameMap.camera.rect.x;
  if(this.tile.y) this.tilePosition.y = $gameMap.camera.rect.y * this.parallax.y;
  else this.tilePosition.y = $gameMap.camera.rect.y;
}
