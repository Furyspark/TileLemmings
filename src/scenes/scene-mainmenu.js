function Scene_MainMenu() {
  this.init.apply(this, arguments);
}

Scene_MainMenu.prototype = Object.create(Scene_MenuBase.prototype);
Scene_MainMenu.prototype.constructor = Scene_MainMenu;

Scene_MainMenu.prototype.init = function() {
  Scene_MenuBase.prototype.init.call(this);
}

Scene_MainMenu.prototype.initMembers = function() {
  Scene_MenuBase.prototype.initMembers.call(this);
}

Scene_MainMenu.prototype.create = function() {
  Scene_MenuBase.prototype.create.call(this);
}

Scene_MainMenu.prototype.update = function() {
  Scene_MenuBase.prototype.update.call(this);
}

Scene_MainMenu.prototype.createCommands = function() {
  Scene_MenuBase.prototype.createCommands.call(this);
  // Options
  var elem = new UI_Button(0, 0, "btnOptions");
}
