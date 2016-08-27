function Scene_Options() {
  this.init.apply(this, arguments);
}

Scene_Options.prototype = Object.create(Scene_MenuBase.prototype);
Scene_Options.prototype.constructor = Scene_Options;

Scene_Options.prototype.init = function() {
  Scene_MenuBase.prototype.init.call(this);
}

Scene_Options.prototype.create = function() {
  Scene_MenuBase.prototype.create.call(this);
  this.fadeIn();
}

Scene_Options.prototype.createCommands = function() {
  Scene_MenuBase.prototype.createCommands.call(this);
  this.createText();
  this.createUI();
}

Scene_Options.prototype.continue = function() {
  Scene_MenuBase.prototype.continue.call(this);
  this.fadeIn();
}

Scene_Options.prototype.leave = function() {
  Scene_MenuBase.prototype.leave.call(this);
  Options.save();
}

Scene_Options.prototype.createText = function() {
  // Title
  this.text.title = new Text("Options");
  this.text.title.style.align = "center";
  this.text.title.anchor.set(0.5, 0);
  this.text.title.position.set(Core.resolution.x / 2, 40);
  this.stage.addChild(this.text.title);
}

Scene_Options.prototype.createUI = function() {
  this.createBackButton();
  // Checkbox: Toggle music pausing on game pausing
  var elem = new UI_CheckBox(new Point(96, 128), "Pause music when pausing the game", Options.data.audio.toggleDuringPause);
  elem.onToggle.add(function(value) {
    Options.data.audio.toggleDuringPause = value;
  }, this);
  this.addUI(elem);
}
