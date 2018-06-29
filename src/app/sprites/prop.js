function Sprite_Prop() {
  this.init.apply(this, arguments);
}

Sprite_Prop.prototype = Object.create(Sprite_Base.prototype);
Sprite_Prop.prototype.constructor = Sprite_Prop;

Sprite_Prop.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  this.anchor.set(0.5);
  this.z = 50;
  this.animSpeed = 1 / 2;
}
