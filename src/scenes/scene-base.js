function Scene_Base() {
  this.init.apply(this, arguments);
}

Scene_Base.FADEDURATION_DEFAULT = 500;


Scene_Base.prototype.init = function() {
  this.stage = new PIXI.Container();
  this.initFadeScreen();
}

Scene_Base.prototype.update = function() {
}

Scene_Base.prototype.render = function() {
  this.stage.children.sort(function(a, b) {
    return b.z - a.z;
  });
  Core.renderer.render(this.stage);
}

Scene_Base.prototype.create = function() {}

Scene_Base.prototype.end = function() {}

Scene_Base.prototype.initFadeScreen = function() {
  this._fadeScreen = new PIXI.Graphics();
  this._fadeScreen.beginFill(0x000000);
  this._fadeScreen.drawRect(0, 0, Core.resolution.x, Core.resolution.y);
  this._fadeScreen.endFill();
  this._fadeScreen.z = -3000;
  this.stage.addChild(this._fadeScreen);
}

Scene_Base.prototype.fadeIn = function(callback) {
  var obj = createjs.Tween.get(this._fadeScreen, { override: true }).to({ alpha: 0 }, Scene_Base.FADEDURATION_DEFAULT).set({ visible: false });
  if(callback) obj.call(callback);
}

Scene_Base.prototype.fadeOut = function(callback) {
  var obj = createjs.Tween.get(this._fadeScreen, { override: true }).set({ visible: true }).to({ alpha: 1 }, Scene_Base.FADEDURATION_DEFAULT);
  if(callback) obj.call(callback);
}
