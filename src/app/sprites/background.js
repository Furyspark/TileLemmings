function Sprite_Background() {
  this.init.apply(this, arguments);
}

Sprite_Background.prototype = Object.create(PIXI.extras.TilingSprite.prototype);
Sprite_Background.prototype.constructor = Sprite_Background;

Sprite_Background.prototype.init = function(tex, w, h) {
  if(!w) w = 640;
  if(!h) h = 360;
  PIXI.extras.TilingSprite.prototype.constructor.call(this, tex, w, h);
  this.z = 2000;
}
