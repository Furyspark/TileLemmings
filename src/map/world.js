function Game_World() {
  this.init.apply(this, arguments);
}

Game_World.prototype = Object.create(PIXI.Container.prototype);
Game_World.prototype.constructor = Game_World;

Game_World.prototype.init = function() {
  PIXI.Container.prototype.constructor.call(this);
}

Game_World.prototype.zOrder = function() {
  this.children.sort(function(a, b) {
    if(a.z && b.z && a.z < b.z) return -1;
    if(a.z && b.z && a.z > b.z) return 1;
    return 0;
  });
}
