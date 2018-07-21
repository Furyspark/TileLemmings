function Input() {}

Input.init = function() {
  this.initKeys();
  this.initActions();
  this.mouse = new Input_Mouse();
  this.initListeners();
}

Input.initKeys = function() {
  var keys = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "ARROWLEFT", "ARROWRIGHT", "ARROWUP", "ARROWDOWN",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=",
  "ALT", "CONTROL", "SHIFT", "ENTER", " "];

  this.key = {};
  for(var a = 0;a < keys.length;a++) {
    var k = keys[a];
    this.key[k] = new Input_Key(k);
  }
}

Input.initActions = function() {
  this._actions = {
    camLeft: ["ARROWLEFT", "A"],
    camRight: ["ARROWRIGHT", "D"],
    camUp: ["ARROWUP", "W"],
    camDown: ["ARROWDOWN", "S"]
  };
}

Input.isDown = function(action) {
  var action = this._actions[action];
  if(action) {
    for(var a = 0;a < action.length;a++) {
      var key = action[a];
      if(this.key[key].down) return true;
    }
  }
  return false;
}

Input.isPressed = function(action) {
  var action = this._actions[action];
  if(action) {
    for(var a = 0;a < action.length;a++) {
      var key = action[a];
      if(this.key[key].pressed) return true;
    }
  }
  return false;
}

Input.isReleased = function(action) {
  var action = this._actions[action];
  if(action) {
    for(var a = 0;a < action.length;a++) {
      var key = action[a];
      if(this.key[key].released) return true;
    }
  }
  return false;
}

Input._refreshButtonStates = function() {
  for(var a in this.key) {
    var k = this.key[a];
    k.pressed = false;
    k.released = false;
  }
  for(var a in this.mouse.button) {
    var mb = this.mouse.button[a];
    mb.pressed = false;
    mb.released = false;
  }
}

Input._onKeyDown = function(e) {
  var key = this.key[e.key.toUpperCase()];
  if(key && !key.down) {
    key.down = true;
    key.pressed = true;
    key.onPress.dispatch();
  }
  key.onRepeat.dispatch();
}

Input._onKeyUp = function(e) {
  var key = this.key[e.key.toUpperCase()];
  if(key && key.down) {
    key.down = false;
    key.released = true;
    key.onRelease.dispatch();
  }
}

Input._onMouseMove = function(e) {
  this.mouse.onMove.dispatch([e]);
}

Input._onMouseDown = function(e) {
  var btn = null;
  if(e.button === 0) btn = "LEFT";
  else if(e.button === 1) btn = "MIDDLE";
  else if(e.button === 2) btn = "RIGHT";
  if(btn && !this.mouse.button[btn].down) {
    this.mouse.button[btn].down = true;
    this.mouse.button[btn].pressed = true;
    this.mouse.button[btn].onPress.dispatch();
  }
}

Input._onMouseUp = function(e) {
  var btn = null;
  if(e.button === 0) btn = "LEFT";
  else if(e.button === 1) btn = "MIDDLE";
  else if(e.button === 2) btn = "RIGHT";
  if(btn && this.mouse.button[btn].down) {
    this.mouse.button[btn].down = false;
    this.mouse.button[btn].released = true;
    this.mouse.button[btn].onRelease.dispatch();
  }
}

Input._wheel = function(e) {
  var btn = null;
  if(e.deltaY < 0) btn = "WHEELUP";
  else if(e.deltaY > 0) btn = "WHEELDOWN";
  if(btn) {
    this.mouse.button[btn].onPress.dispatch();
  }
}

Input.update = function() {
  this.mouse.update();
}

Input.initListeners = function() {
  // Core events
  window.addEventListener("keydown", this._onKeyDown.bind(this));
  window.addEventListener("keyup", this._onKeyUp.bind(this));
  window.addEventListener("mousemove", this._onMouseMove.bind(this));
  window.addEventListener("mousedown", this._onMouseDown.bind(this));
  window.addEventListener("mouseup", this._onMouseUp.bind(this));
  window.addEventListener("wheel", this._wheel.bind(this));
  // Misc events
  this.key.F4.onPress.add(function() {
    if(!this.key.ALT.down) {
      Core.setFullscreen(!Core.getFullscreen());
    }
  }, this);
  this.key.ENTER.onPress.add(function() {
    if(Input.key.ALT.down) {
      this.setFullscreen(!this.getFullscreen());
    }
  }, Core);
};
