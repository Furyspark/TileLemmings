function Background() {
  this.init.apply(this, arguments);
}

Background.prototype = Object.create(PIXI.extras.TilingSprite.prototype);
Background.prototype.constructor = Background;

Background.prototype.init = function(imageKey, w, h) {
  var tex = null;
  if(imageKey && imageKey.length > 0) tex = Cache.getImage(imageKey);
  if(!w) w = Core.renderer.width;
  if(!h) h = Core.renderer.height;
  PIXI.extras.TilingSprite.prototype.constructor.call(this, tex, w, h);
  this.z = 1000;
}
