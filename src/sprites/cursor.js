function Sprite_Cursor() {
  this.init.apply(this, arguments);
}

Sprite_Cursor.prototype = Object.create(Sprite_Base.prototype);
Sprite_Cursor.prototype.constructor = Sprite_Cursor;

Sprite_Cursor.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  var anim = this.addAnimation("idle");
  anim.addFrame("atlMisc", "sprCursor_Idle.png");
  var anim = this.addAnimation("over");
  anim.addFrame("atlMisc", "sprCursor_Open.png");
  this.visible = false;
  this.scale.set(2);
  this.anchor.set(0.5);
}
