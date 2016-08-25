function Scene_Base() {
  this.init.apply(this, arguments);
}

Scene_Base.prototype.init = function() {
  this.stage = new PIXI.Container();
}

Scene_Base.prototype.update = function() {
}

Scene_Base.prototype.render = function() {
  Core.renderer.render(this.stage);
}

Scene_Base.prototype.create = function() {}

Scene_Base.prototype.end = function() {}
