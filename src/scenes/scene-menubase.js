function Scene_MenuBase() {
  this.init.apply(this, arguments);
}

Scene_MenuBase.prototype = Object.create(Scene_Base.prototype);
Scene_MenuBase.prototype.constructor = Scene_MenuBase;

Scene_MenuBase.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
  this.initMembers();
  this.addBackground();
  this.createCommands();
}

Scene_MenuBase.prototype.create = function() {
  this.fadeIn();
}

Scene_MenuBase.prototype.initMembers = function() {
  this.ui = [];
}

Scene_MenuBase.prototype.addUI = function(elem) {
  if(!elem.z) elem.z = 0;
  this.ui.push(elem);
}

Scene_MenuBase.prototype.applyUIZOrdering = function() {
  this.ui.sort(function(a, b) {
    return a.z - b.z;
  });
}

Scene_MenuBase.prototype.addBackground = function() {
  this.background = new Background("bgMainMenu");
  this.stage.addChild(this.background);
}

Scene_MenuBase.prototype.createCommands = function() {}

Scene_MenuBase.prototype.addListeners = function() {
  Scene_Base.prototype.removeListeners.call(this);
  Input.mouse.button.LEFT.onPress.add(this._onMouseLeftDown, this);
}

Scene_MenuBase.prototype.removeListeners = function() {
  Scene_Base.prototype.removeListeners.call(this);
  Input.mouse.button.LEFT.onPress.remove(this._onMouseLeftDown, this);
}

Scene_MenuBase.prototype._onMouseLeftDown = function() {
  this.applyUIZOrdering();
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) {
      if(elem.onClick) elem.onClick.dispatch();
      break;
    }
  }
}
