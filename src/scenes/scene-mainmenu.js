function Scene_MainMenu() {
  this.init.apply(this, arguments);
}

Scene_MainMenu.prototype = Object.create(Scene_Base.prototype);
Scene_MainMenu.prototype.constructor = Scene_MainMenu;

Scene_MainMenu.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
}

Scene_MainMenu.prototype.update = function() {
  Scene_Base.prototype.update.call(this);
}
