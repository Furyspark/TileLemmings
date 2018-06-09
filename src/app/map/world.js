function Game_World() {
  this.init.apply(this, arguments);
}

Game_World.prototype = Object.create(PIXI.Container.prototype);
Game_World.prototype.constructor = Game_World;

Game_World.prototype.init = function() {
  PIXI.Container.prototype.constructor.call(this);
  this.z = 150;
}

Game_World.prototype.zOrder = function() {
  this.children.stableSort(function(a, b) {
    return b.z - a.z;
  });
}
