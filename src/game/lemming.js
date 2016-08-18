function Game_Lemming() {
  this.init.apply(this, arguments);
}

Game_Lemming.prototype = Object.create(Game_Base.prototype);
Game_Lemming.prototype.constructor = Game_Lemming;

Game_Lemming.prototype.init = function() {
  Game_Base.prototype.init.call(this);
  this.sprite = new Sprite_Lemming();
}

Game_Lemming.prototype.spawn = function(x, y) {
  Game_Base.prototype.spawn.call(this, x, y);
  this.sprite.playAnimation("fall");
}
