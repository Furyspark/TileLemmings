function Sprite_UI() {
  this.init.apply(this, arguments);
}

Sprite_UI.prototype = Object.create(Sprite_Base.prototype);
Sprite_UI.prototype.constructor = Sprite_UI;

Sprite_UI.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  this.z = -100;
}
