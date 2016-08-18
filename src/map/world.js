function World() {
  this.init.apply(this, arguments);
}

World.prototype = Object.create(PIXI.Container.prototype);
World.prototype.constructor = World;

World.prototype.init = function() {
  PIXI.Container.prototype.constructor.call(this);
}

World.prototype.zOrder = function() {
  this.children.sort(function(a, b) {
    if(a.z && b.z && a.z < b.z) return -1;
    if(a.z && b.z && a.z > b.z) return 1;
    return 0;
  });
}
