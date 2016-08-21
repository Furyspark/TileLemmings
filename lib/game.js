var $gameMap    = null;

function Point() {
  this.init.apply(this, arguments);
}

Point.prototype = Object.create(PIXI.Point.prototype);
Point.prototype.constructor = Point;

Point.prototype.init = function(x, y) {
  PIXI.Point.prototype.constructor.call(this, x, y);
}

function Rect() {
  this.init.apply(this, arguments);
}

Rect.prototype = Object.create(PIXI.Rectangle.prototype);
Rect.prototype.constructor = Rect;

Object.defineProperties(Rect.prototype, {
  left: {
    get: function() { return this.x; },
    set: function(value) { this.x = value; }
  },
  top: {
    get: function() { return this.y; },
    set: function(value) { this.y = value; }
  },
  right: {
    get: function() { return this.x + this.width; },
    set: function(value) { this.width = value - this.x; }
  },
  bottom: {
    get: function() { return this.y + this.height; },
    set: function(value) { this.height = value - this.y; }
  }
});

Rect.prototype.init = function(x, y, w, h) {
  PIXI.Rectangle.prototype.constructor.call(this, x, y, w, h);
}

Rect.prototype.overlap = function(rect) {
  return ((rect.right > this.left && rect.left < this.right) &&
  (rect.bottom > this.top && rect.top < this.bottom));
}

function Signal() {
  this.initialize.apply(this, arguments);
}

Signal.prototype.initialize = function() {
  this._bindings = [];
}

Signal.prototype.add = function(callback, context, args, priority) {
  if(args === undefined) args = [];
  if(priority === undefined) priority = 50;
  this._bindings.push({
    callback: callback,
    context: context,
    args: args,
    once: false,
    priority: priority
  });
}

Signal.prototype.addOnce = function(callback, context, args, priority) {
  if(!args) args = [];
  if(!priority && priority !== 0) priority = 50;
  this._bindings.push({
    callback: callback,
    context: context,
    args: args,
    once: true,
    priority: priority
  });
}

Signal.prototype.remove = function(callback, context) {
  for(var a = 0;a < this._bindings.length;a++) {
    var obj = this._bindings[a];
    if(obj.callback === callback && obj.context === context) {
      this._bindings.splice(a, 1);
      return true;
    }
  }
  return false;
}

Signal.prototype.sortFunction = function(a, b) {
  if(a.priority < b.priority) return -1;
  if(a.priority > b.priority) return 1;
  return 0;
}

Signal.prototype.dispatch = function() {
  var binds = [];
  for(var a = 0;a < this._bindings.length;a++) {
    var bind = this._bindings[a];
    if(bind.once) {
      this._bindings.splice(a, 1);
      a--;
    }
    binds.push(bind);
  }
  binds = binds.sort(this.sortFunction);
  for(var a = 0;a < binds.length;a++) {
    var bind = binds[a];
    bind.callback.apply(bind.context, bind.args);
  }
}

function Animation() {
  this.init.apply(this, arguments);
}

Animation.prototype.init = function(name) {
  this.name = name;
  this.frames = [];
  this.onEnd = new Signal();
}

Animation.prototype.addFrame = function(atlasKey, frameKey) {
  var atlas = Cache.getTextureAtlas(atlasKey);
  if(atlas) {
    var frame = atlas[frameKey];
    if(frame) {
      this.frames.push(frame);
    }
  }
  return this;
}

function Pool() {
  this.init.apply(this, arguments);
}

Pool.prototype.init = function(type, map, initArgs, startAmount) {
  if(!startAmount && startAmount !== 0) startAmount = 0;
  if(!initArgs) initArgs = [];
  this._type = type;
  this.map = map;
  this._initArgs = initArgs;
  this._objects = [];
  while(this._objects.length < startAmount) {
    this.create();
  }
}

Pool.prototype.spawn = function(x, y, args) {
  var obj = this.getFirstNotExisting();
  if(!obj) obj = this.create();
  obj.x = x;
  obj.y = y;
  obj.exists = true;
  if(obj.spawn) obj.spawn.apply(obj, args);
  return obj;
}

Pool.prototype.create = function() {
  var obj = eval("new " + this._type + "(" + this._initArgs.join(", ") + ");");
  this._objects.push(obj);
  obj.exists = false;
  obj.map = this.map;
  this.map.objects.push(obj);
  if(obj.sprite) this.map.world.addChild(obj.sprite);
  return obj;
}

Pool.prototype.listNotExisting = function() {
  var result = [];
  for(var a = 0;a < this._objects.length;a++) {
    var obj = this._objects[a];
    if(!obj.exists) result.push(obj);
  }
  return result;
}

Pool.prototype.getFirstNotExisting = function() {
  var list = this.listNotExisting();
  if(list.length > 0) return list.slice(0, 1)[0];
  return null;
}

function Background() {
  this.init.apply(this, arguments);
}

Background.prototype = Object.create(PIXI.extras.TilingSprite.prototype);
Background.prototype.constructor = Background;

Background.prototype.init = function(imageKey, w, h) {
  var tex = null;
  if(imageKey && imageKey.length > 0) tex = Cache.getImage(imageKey);
  if(!w) w = Core.renderer.width;
  if(!h) h = Core.renderer.height;
  PIXI.extras.TilingSprite.prototype.constructor.call(this, tex, w, h);
  this.z = 1000;
}

function Text() {
  this.init.apply(this, arguments);
}

Text.prototype = Object.create(PIXI.Text.prototype);
Text.prototype.constructor = Text;

Text.defaultStyle = {
  fill: "white",
  stroke: "black",
  strokeThickness: 4
};

Text.prototype.init = function(text, style) {
  if(!text) text = "";
  if(!style) style = Object.assign({}, Text.defaultStyle);
  PIXI.Text.prototype.constructor.call(this, text, style);
}

function Alarm() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Alarm.prototype, {
  time: {
    get: function() { return this._time; },
    set: function(value) { this._time = Math.max(-1, Math.floor(value)); }
  },
  baseTime: {
    get: function() { return this._baseTime; },
    set: function(value) {
      this._baseTime = Math.max(-1, Math.floor(value));
      if(this._baseTime === 0) this._baseTime = -1;
    }
  }
});

Alarm.prototype.init = function() {
  this._time = -1;
  this._basetime = -1;
  this.onExpire = new Signal();
}

Alarm.prototype.update = function() {
  this.time--;
  if(this.time === 0) {
    this.onExpire.dispatch();
    if(this.baseTime > 0 && this.time === 0) this.time = this.baseTime;
  }
}

Alarm.prototype.stop = function() {
  this.time = -1;
}

Alarm.prototype.start = function(time) {
  if(!time) time = -1;
  if(time > 0) this.time = time;
  else if(time === -1 && this.baseTime > 0) this.time = this.baseTime;
}

function Cache() {}

Cache._json = {};
Cache._audio = {};
Cache._images = {};
Cache._textureAtlases = {};

Cache.getJSON = function(key) {
  if(this._json[key]) return this._json[key];
  return null;
}

Cache.addJSON = function(key, obj) {
  this._json[key] = obj;
}

Cache.removeJSON = function(key) {
  delete this._json[key];
}

Cache.hasJSON = function(key) {
  return (this._json[key] !== undefined);
}

Cache.getAudio = function(key) {
  if(this._audio[key]) return this._audio[key];
  return null;
}

Cache.addAudio = function(key, obj) {
  this._audio[key] = obj;
}

Cache.removeAudio = function(key) {
  var howl = this._audio[key];
  howl.unload();
  delete this._audio[key];
}

Cache.hasAudio = function(key) {
  return (this._audio[key] !== undefined);
}

Cache.getImage = function(key) {
  if(this._images[key]) return this._images[key].clone();
  return null;
}

Cache.addImage = function(key, obj) {
  this._images[key] = obj;
}

Cache.removeImage = function(key) {
  var img = this._images[key];
  img.destroy(true);
  delete this._images[key];
}

Cache.hasImage = function(key) {
  return (this._images[key] !== undefined);
}

Cache.getTextureAtlas = function(key) {
  if(this._textureAtlases[key]) return this._textureAtlases[key];
  return null;
}

Cache.addTextureAtlas = function(key, dataObj) {
  var obj = {};
  for(var a in dataObj.data.frames) {
    var tex = PIXI.utils.TextureCache[a];
    obj[a] = tex;
  }
  this._textureAtlases[key] = obj;
}

Cache.removeTextureAtlas = function(key) {
  delete this._textureAtlases[key];
}

Cache.hasTextureAtlas = function(key) {
  return (this._textureAtlases[key] !== undefined);
}

function Loader() {}

Loader._loading = [];
Loader.onComplete = new Signal();

Loader.loadJSON = function(key, src) {
  var xobj = new XMLHttpRequest();
  xobj.open("GET", src);
  xobj.onreadystatechange = function() {
    if(xobj.readyState === 4 && xobj.status === 200) { // Done loading
      file.onComplete.dispatch();
    }
    else if(xobj.readyState === 4 && xobj.status !== 200) { // Fail loading
      file.onFail.dispatch();
    }
  }
  xobj.send(null);

  var file = {
    key: key,
    src: src,
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: xobj
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishJSON, this, [file], 10);

  return file;
}

Loader.loadAudio = function(key, src) {
  var file;
  var howl = new Howl({
    src: [src],
    onload: function() {
      file.onComplete.dispatch();
    }
  });

  file = {
    key: key,
    src: src,
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: howl
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishAudio, this, [file], 10);

  return file;
}

Loader.loadImage = function(key, src) {
  var file;
  PIXI.loader.add(key, src);
  PIXI.loader.on("complete", function(loader, resources) {
    for(var a in resources) {
      if(file.key === a) {
        file.dataObject = resources[a].texture;
        file.onComplete.dispatch();
        break;
      }
    }
  });

  file = {
    key: key,
    src: src,
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: null
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishImage, this, [file], 10);
  PIXI.loader.load();

  return file;
}

Loader.loadTextureAtlas = function(key, src) {
  var file;
  // Load JSON Data
  PIXI.loader.add(key, src);
  PIXI.loader.on("complete", function(loader, resources) {
    for(var a in resources) {
      if(a === file.key || a === file.key + "_image") {
        if(a === file.key) file.dataObject.data = resources[a].data;
        else if(a === file.key + "_image") file.dataObject.texture = resources[a].texture;
        file.remaining--;
        if(file.remaining <= 0) file.onComplete.dispatch();
      }
    }
  });

  // Load Image
  file = {
    key: key,
    src: src,
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: {
      texture: null,
      data: null
    },
    remaining: 2
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishTextureAtlas, this, [file], 10);
  PIXI.loader.load();

  return file;
}

Loader._finishJSON = function(file) {
  Cache.addJSON(file.key, JSON.parse(file.dataObject.responseText));
  this._finishFile(file);
}

Loader._finishAudio = function(file) {
  Cache.addAudio(file.key, file.dataObject);
  this._finishFile(file);
}

Loader._finishImage = function(file) {
  Cache.addImage(file.key, file.dataObject);
  this._finishFile(file);
}

Loader._finishTextureAtlas = function(file) {
  Cache.addTextureAtlas(file.key, file.dataObject);
  this._finishFile(file);
}

Loader._finishFile = function(file) {
  var a = this._loading.indexOf(file);
  if(a !== -1) Loader._loading.splice(a, 1);
  this.checkLoadCompletion();
}

Loader.checkLoadCompletion = function() {
  if(this._loading.length === 0) this.onComplete.dispatch();
}

function Core() {}

Core._dataObjects = [
  { name: "$dataProps", key: "dataProps", src: "assets/data/props.json" },
  { name: "$dataActions", key: "dataActions", src: "assets/data/actions.json" }
];
Core._config = [
  { key: "cfgVideo", src: "config/video.json" }
];

Core.tileset = {};

Object.defineProperties(Core, {
  hRes: {
    get: function() { return Core.resolution.x / parseInt(Core.renderer.view.style.width.slice(0, -2)); }
  },
  vRes: {
    get: function() { return Core.resolution.y / parseInt(Core.renderer.view.style.height.slice(0, -2)); }
  }
});

Core.start = function() {
  this.initMembers();

  this.initElectron();
  this.initPixi();
  this.fitToWindow();
  this.startDataObjects();
  this.loadConfig();
  Input.init();

  Loader.onComplete.addOnce(function() {
    SceneManager.push(new Scene_Boot());
    this.render();
  }, this);
}

Core.initMembers = function() {
  // Full screen
  this.isFullscreen = false;
  var func = function(e) {
    this.isFullscreen = !this.isFullscreen;
  };
  if(document.onfullscreenchange !== undefined) document.addEventListener("fullscreenchange", func.bind(this));
  else if(document.onwebkitfullscreenchange !== undefined) document.addEventListener("webkitfullscreenchange", func.bind(this));
  else if(document.onmozfullscreenchange !== undefined) document.addEventListener("mozfullscreenchange", func.bind(this));
  // Resolution
  this.resolution = new Point(1280, 720);
}

Core.initElectron = function() {
  this.usingElectron = false;
  if(typeof require === "function") {
    this.usingElectron = true;
    this.ipcRenderer = require("electron").ipcRenderer;
    this.initElectronProperties();
  }
}

Core.initElectronProperties = function() {
  window.addEventListener("resize", Core.onResize);
}

Core.onResize = function(e) {
  Core.fitToWindow();
}

Core.initPixi = function() {
  // this.renderer = new PIXI.CanvasRenderer(this.resolution.x, this.resolution.y);
  this.renderer = new PIXI.WebGLRenderer(this.resolution.x, this.resolution.y);
  PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
  document.body.appendChild(this.renderer.view);
  if(this.usingElectron) {
    this.resizeWindow(this.resolution.x, this.resolution.y);
    this.centerWindow();
  }
}

Core.render = function() {
  requestAnimationFrame(this.render.bind(this));
  SceneManager.update();
  Input._refreshButtonStates();
  SceneManager.render();
}

Core.startDataObjects = function() {
  for(var a = 0;a < this._dataObjects.length;a++) {
    var dObj = this._dataObjects[a];
    var obj = Loader.loadJSON(dObj.key, dObj.src);
    obj.onComplete.addOnce(function(dataObject) {
      window[dataObject.name] = Cache.getJSON(dataObject.key);
    }, this, [dObj], 20);
  }
}

Core.loadConfig = function() {
  for(var a = 0;a < this._config.length;a++) {
    var cfg = this._config[a];
    Loader.loadJSON(cfg.key, cfg.src);
  }
}

Core.fitToWindow = function() {
  Core.renderer.view.style.width = String(window.innerWidth) + "px";
  Core.renderer.view.style.height = String(window.innerHeight) + "px";
}

Core.resizeWindow = function(w, h) {
  if(Core.usingElectron) {
    var diffW = window.outerWidth - window.innerWidth;
    var diffH = window.outerHeight - window.innerHeight;
    Core.ipcRenderer.send("window", ["resize", w + diffW, h + diffH]);
  }
}

Core.centerWindow = function() {
  if(Core.usingElectron) {
    Core.ipcRenderer.send("window", ["center"]);
  }
}

Core.setFullscreen = function(state) {
  if(state === true) {
    if(Core.renderer.view.requestFullscreen) Core.renderer.view.requestFullscreen();
    else if(Core.renderer.view.webkitRequestFullscreen) Core.renderer.view.webkitRequestFullscreen();
    else if(Core.renderer.view.mozRequestFullScreen) Core.renderer.view.mozRequestFullScreen();
  }
  else {
    if(document.exitFullscreen) document.exitFullscreen();
    else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if(document.mozCancelFullScreen) document.mozCancelFullScreen();
  }
}

Core.getFullscreen = function() {
  return this.isFullscreen;
}

function Input() {}

Input.init = function() {
  this.initKeys();
  this.initActions();
  this.mouse = new Input_Mouse();
  this.initListeners();
}

Input.initKeys = function() {
  var keys = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
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
  // console.log(e.key);
  var key = this.key[e.key.toUpperCase()];
  if(key && !key.down) {
    key.down = true;
    key.pressed = true;
    key.onPress.dispatch();
  }
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
  this.mouse.updatePosition(e);
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

Input.initListeners = function() {
  // Core events
  window.addEventListener("keydown", this._onKeyDown.bind(this));
  window.addEventListener("keyup", this._onKeyUp.bind(this));
  Core.renderer.view.addEventListener("mousemove", this._onMouseMove.bind(this));
  Core.renderer.view.addEventListener("mousedown", this._onMouseDown.bind(this));
  Core.renderer.view.addEventListener("mouseup", this._onMouseUp.bind(this));
  // Misc events
  this.key.F4.onPress.add(function() {
    this.setFullscreen(!this.getFullscreen());
  }, Core);
  this.key.ENTER.onPress.add(function() {
    if(Input.key.Alt.down) {
      this.setFullscreen(!this.getFullscreen());
    }
  }, Core);
};

function Input_Key() {
  this.init.apply(this, arguments);
}

Input_Key.prototype.init = function(key) {
  this._key = key;
  this.down = false;
  this.pressed = false;
  this.released = false;
  this.onPress = new Signal();
  this.onRelease = new Signal();
}

function Input_Mouse() {
  this.init.apply(this, arguments);
}

Input_Mouse.prototype.init = function() {
  this.button = {
    LEFT: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    },
    MIDDLE: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    },
    RIGHT: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    }
  };
  this.position = {
    screen: {
      x: 0,
      y: 0
    },
    world: {
      x: 0,
      y: 0
    }
  };
}

Input_Mouse.prototype.updatePosition = function(e) {
  this.position.screen.x = Math.floor(e.clientX * Core.hRes);
  this.position.screen.y = Math.floor(e.clientY * Core.vRes);
  if($gameMap) {
    this.position.world.x = Math.floor(e.clientX * Core.hRes / $gameMap.world.scale.x) + $gameMap.camera.rect.left;
    this.position.world.y = Math.floor(e.clientY * Core.vRes / $gameMap.world.scale.y) + $gameMap.camera.rect.top;
  }
}

function AudioManager() {}

AudioManager._bgm = null;
AudioManager._volume = {
  bgm: 0.9,
  sfx: 0.9
};
AudioManager._sounds = [];

AudioManager.playBgm = function(key) {
  this.stopBgm();
  var snd = Cache.getAudio(key);
  if(snd) {
    this._bgm = { audio: snd, id: 0, channel: "bgm" };
    this._bgm.id = this._bgm.audio.play();
    this._bgm.audio.volume(this._volume.bgm, this._bgm.id);
    this._sounds.push(this._bgm);
    return this._bgm;
  }
  return null;
}

AudioManager.stopBgm = function() {
  if(this._bgm) this._bgm.audio.stop(this._bgm.id);
  this._bgm = null;
}

AudioManager.playSound = function(key) {
  var snd = Cache.getAudio(key);
  if(snd) {
    var sndObj = { audio: snd, id: snd.play(), channel: "snd" };
    snd.volume(this._volume.sfx, sndObj.id);
    this._sounds.push(sndObj);
    sndObj.audio.once("end", this._onSoundEnd.bind(this, sndObj));
    return sndObj;
  }
  return null;
}

AudioManager.baseDir = function(type) {
  if(type.toUpperCase() === "BGM") return "assets/audio/bgm/";
  return "assets/audio/sfx/";
}

AudioManager.setVolume = function(channel, volume) {
  volume = Math.max(0, Math.min(1, volume));
  if(this._volume[channel]) {
    this._volume[channel] = volume;
    for(var a = 0;a < this._sounds.length;a++) {
      var snd = this._sounds[a];
      if(snd.channel === channel) snd.audio.volume(volume, snd.id);
    }
  }
}

AudioManager._onSoundEnd = function(snd) {
  var a = this._sounds.indexOf(snd);
  if(a !== -1) this._sounds.splice(a, 1);
}

function SceneManager() {}

SceneManager._stack = [];

SceneManager.push = function(scene) {
  this._stack.push(scene);
  scene.create();
}

SceneManager.pop = function() {
  this._stack.pop();
}

SceneManager.current = function() {
  if(this._stack.length === 0) return null;
  return this._stack.slice(-1)[0];
}

SceneManager.update = function() {
  if(this.current()) this.current().update();
}

SceneManager.render = function() {
  if(this.current()) this.current().render();
}

function Sprite_Base() {
  this.init.apply(this, arguments);
}

Sprite_Base.prototype = Object.create(PIXI.Sprite.prototype);
Sprite_Base.prototype.constructor = Sprite_Base;

Object.defineProperties(Sprite_Base.prototype, {
  x: {
    get: function() { return this.position.x; },
    set: function(value) { this.position.x = Math.floor(value); }
  },
  y: {
    get: function() { return this.position.y; },
    set: function(value) { this.position.y = Math.floor(value); }
  }
});

Sprite_Base.prototype.init = function(texture) {
  if(!texture) texture = null;
  PIXI.Sprite.prototype.constructor.call(this, texture);
  this.atlasData = null;
  this.animations = {};
  this.animation = null
  this.animFrame = 0;
  this.animSpeed = 1;
  this.z = 0;
}

Sprite_Base.prototype.playAnimation = function(key) {
  if(this.animations[key] && !this.animation || (this.animation && this.animation.name !== key)) {
    this.animation = this.animations[key];
    this.animFrame = 0;
    this.texture = this.animation.frames[Math.floor(this.animFrame)];
    return this.animation;
  }
  return null;
}

Sprite_Base.prototype.addAnimation = function(name) {
  var anim = new Animation(name);
  this.animations[name] = anim;
  return anim;
}

Sprite_Base.prototype.addAnimationExt = function(atlas, name, frames, str) {
  var anim = this.addAnimation(name);
  for(var a = 0;a < frames;a++) {
    anim.addFrame(atlas, str.replace("%s", String(a)));
  }
}

Sprite_Base.prototype.getAnimation = function(key) {
  return this.animations[key];
}

Sprite_Base.prototype.isAnimationPlaying = function(key) {
  return (this.animation === this.animations[key]);
}

Sprite_Base.prototype.update = function() {
  if(this.animation) {
    var oldFrame = this.animFrame;
    this.animFrame = (this.animFrame + this.animSpeed) % this.animation.frames.length;
    this.texture = this.animation.frames[Math.floor(this.animFrame)];
    if(oldFrame > this.animFrame) this.animation.onEnd.dispatch();
  }
}

function Sprite_Lemming() {
  this.init.apply(this, arguments);
}

Sprite_Lemming.prototype = Object.create(Sprite_Base.prototype);
Sprite_Lemming.prototype.constructor = Sprite_Lemming;

Sprite_Lemming.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  this.z = -100;
  this.animSpeed = 1 / 4;
  this.anchor.set(0.5);
  this.initAnimations();
}

Sprite_Lemming.prototype.initAnimations = function() {
  this.addAnimationExt("atlLemming", "burn", 13, "sprLemming_Burn_%s.png");
  this.addAnimationExt("atlLemming", "drown", 16, "sprLemming_Drown_%s.png");
  this.addAnimationExt("atlLemming", "exit", 8, "sprLemming_Exit_%s.png");
  this.addAnimationExt("atlLemming", "explode", 16, "sprLemming_Explode_%s.png");
  this.addAnimationExt("atlLemming", "fall-death", 16, "sprLemming_FallDeath_%s.png");
  this.addAnimationExt("atlLemming", "fall", 4, "sprLemming_Fall_%s.png");
  this.addAnimationExt("atlLemming", "walk", 10, "sprLemming_Move_%s.png");
  this.addAnimationExt("atlLemming", "bash", 32, "sprLemming_Bash_%s.png");
  this.addAnimationExt("atlLemming", "block", 16, "sprLemming_Block_%s.png");
  this.addAnimationExt("atlLemming", "build", 16, "sprLemming_Build_%s.png");
  this.addAnimationExt("atlLemming", "build-end", 10, "sprLemming_BuildEnd_%s.png");
  this.addAnimationExt("atlLemming", "dig", 8, "sprLemming_Dig_%s.png");
  this.addAnimationExt("atlLemming", "mine", 24, "sprLemming_Mine_%s.png");
  this.addAnimationExt("atlLemming", "climb", 8, "sprLemming_Climb_%s.png");
  this.addAnimationExt("atlLemming", "climb-end", 8, "sprLemming_Climb_End_%s.png");
  this.addAnimationExt("atlLemming", "float", 4, "sprLemming_Float_%s.png");
  this.addAnimationExt("atlLemming", "float-start", 4, "sprLemming_Float_Start_%s.png");
}

function Sprite_Tile() {
  this.init.apply(this, arguments);
}

Sprite_Tile.prototype = Object.create(Sprite_Base.prototype);
Sprite_Tile.prototype.constructor = Sprite_Tile;

Sprite_Tile.prototype.init = function(texture) {
  Sprite_Base.prototype.init.call(this, texture);
}

function Minimap() {
  this.init.apply(this, arguments);
}

Minimap.prototype = Object.create(PIXI.Container.prototype);
Minimap.prototype.constructor = Minimap;

Minimap.prototype.init = function(options) {
  PIXI.Container.prototype.constructor.call(this);
  this.interactive = false;
  this.tiles = [];

  if(options) {
    if(options.addCameraView) {
      this.addCameraView();
      this.updateCameraView();
      if(options.interactive) {
        this.addInteractivity();
      }
    }
  }

  this.background = new PIXI.Graphics();
  this.background.beginFill(0x0);
  this.background.drawRect(0, 0, $gameMap.width * 16, $gameMap.height * 16);
  this.background.endFill();
  this.background.z = 100;
  this.addChild(this.background);
}

Minimap.prototype.update = function() {
  if($gameMap) {
    // Clear and fill tiles array if necessary
    if(this.tiles.length !== $gameMap.tiles.length) {
      this.tiles = [];
      while(this.tiles.length < $gameMap.tiles.length) this.tiles.push(null);
    }
    // Replace tiles
    var minimapSprites = Cache.getTextureAtlas("atlMinimap");
    for(var a = 0;a < $gameMap.tiles.length;a++) {
      var myTile = this.tiles[a];
      var mapTile = $gameMap.tiles[a];
      var pos = $gameMap.getTilePosition(a);
      var realPos = new Point(pos.x * $gameMap.tileWidth, pos.y * $gameMap.tileHeight);

      // Remove tile
      if(mapTile === null && myTile !== null) {
        var spr = this.tiles.splice(a, 1, 0)[0];
        this.removeChild(spr);
      }
      // Add tile
      else if(mapTile !== null && myTile === null) {
        var spr = new Sprite_MinimapTile();
        spr.position.set(realPos.x, realPos.y);
        this.updateTile(mapTile, spr);
        this.tiles.splice(a, 1, spr);
        this.addChild(spr);
      }
      else if(mapTile !== null && myTile !== null) {
        this.updateTile(mapTile, myTile);
      }
    }
  }
  // Apply Z-Ordering
  this.children.sort(function(a, b) {
    if(a.z > b.z) return -1;
    if(a.z < b.z) return 1;
    return 0;
  });
  if(this.minimapView) this.updateCameraView();
}

Minimap.prototype.updateTile = function(mapTile, myTile) {
  myTile.playAnimation("ground");
  if(mapTile.hasProperty("STEEL")) myTile.playAnimation("steel");
}

Minimap.prototype.addCameraView = function() {
  this.minimapView = new PIXI.Graphics();
  this.minimapView.z = -100;
  this.addChild(this.minimapView);
}

Minimap.prototype.updateCameraView = function() {
  this.minimapView.lineStyle(2, 0x00ff00, 1);
  this.minimapView.drawRect(0, 0, $gameMap.camera.width, $gameMap.camera.height);
}

Minimap.prototype.addInteractivity = function() {
}

function Sprite_MinimapTile() {
  this.init.apply(this, arguments);
}

Sprite_MinimapTile.prototype = Object.create(Sprite_Base.prototype);
Sprite_MinimapTile.prototype.constructor = Sprite_MinimapTile;

Sprite_MinimapTile.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  this.addAnimationExt("atlMinimap", "ground", 1, "tile.png");
  this.addAnimationExt("atlMinimap", "steel", 1, "steel.png");
  this.addAnimationExt("atlMinimap", "water", 1, "water.png");
  this.playAnimation("water");
}

function Sprite_Prop() {
  this.init.apply(this, arguments);
}

Sprite_Prop.prototype = Object.create(Sprite_Base.prototype);
Sprite_Prop.prototype.constructor = Sprite_Prop;

Sprite_Prop.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  this.anchor.set(0.5);
  this.z = 50;
  this.animSpeed = 0.25;
}

function Sprite_UI() {
  this.init.apply(this, arguments);
}

Sprite_UI.prototype = Object.create(Sprite_Base.prototype);
Sprite_UI.prototype.constructor = Sprite_UI;

Sprite_UI.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
}

function Sprite_Cursor() {
  this.init.apply(this, arguments);
}

Sprite_Cursor.prototype = Object.create(Sprite_Base.prototype);
Sprite_Cursor.prototype.constructor = Sprite_Cursor;

Sprite_Cursor.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  var anim = this.addAnimation("idle");
  anim.addFrame("atlMisc", "sprCursor_Idle.png");
  var anim = this.addAnimation("over");
  anim.addFrame("atlMisc", "sprCursor_Open.png");
  this.visible = false;
  this.scale.set(2);
  this.anchor.set(0.5);
}

function Sprite_Background() {
  this.init.apply(this, arguments);
}

Sprite_Background.prototype = Object.create(PIXI.extras.TilingSprite.prototype);
Sprite_Background.prototype.constructor = Sprite_Background;

Sprite_Background.prototype.init = function(tex, w, h) {
  if(!w) w = 640;
  if(!h) h = 360;
  PIXI.extras.TilingSprite.prototype.constructor.call(this, tex, w, h);
  this.z = 2000;
}

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

Scene_Base.prototype.create = function() {
}

function Scene_Boot() {
  this.init.apply(this, arguments);
}

Scene_Boot.prototype = Object.create(Scene_Base.prototype);
Scene_Boot.prototype.constructor = Scene_Boot;

Scene_Boot.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
  var obj = Loader.loadJSON("assetList", "assets/asset-list.json");
  obj.onComplete.addOnce(this.loadAssets, this);
}

Scene_Boot.prototype.loadAssets = function() {
  Loader.onComplete.addOnce(this.start, this);
  var assetList = Cache.getJSON("assetList");
  // Load Images
  for(var a = 0;a < assetList.images.length;a++) {
    var asset = assetList.images[a];
    Loader.loadImage(asset.key, asset.src);
  }
  // Load Texture Atlases
  for(var a = 0;a < assetList["texture-atlases"].length;a++) {
    var asset = assetList["texture-atlases"][a];
    Loader.loadTextureAtlas(asset.key, asset.src);
  }
  // Load audio
  for(var a = 0;a < assetList.audio.length;a++) {
    var asset = assetList.audio[a];
    Loader.loadAudio(asset.key, asset.src);
  }
}

Scene_Boot.prototype.start = function() {
  Core.tileset.generic = new Tileset();
  Core.tileset.generic.texture = Cache.getImage("tsGeneric");
  SceneManager.push(new Scene_PreGame("assets/levels/testlevel.json"));
}

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

function Scene_PreGame() {
  this.init.apply(this, arguments);
}

Scene_PreGame.TEXT_OBJECTIVE = "%l Lemmings\n%p% to be saved";

Scene_PreGame.prototype = Object.create(Scene_Base.prototype);
Scene_PreGame.prototype.constructor = Scene_PreGame;

Scene_PreGame.prototype.init = function(src) {
  Scene_Base.prototype.init.call(this);
  this._loading = true;
  $gameMap = new Map(src, this);
  $gameMap.onLoad.addOnce(this.start, this, [], 10);
}

Scene_PreGame.prototype.start = function() {
  this._loading = false;
  // Add background
  this.bg = new Background("bgMainMenu");
  this.stage.addChild(this.bg);
  // Add minimap
  this.minimap = new Minimap();
  this.stage.addChild(this.minimap);
  this.updateMinimap();
  // Add description
  this.text = {
    mapName: new Text($gameMap.name),
    objective: new Text(Scene_PreGame.TEXT_OBJECTIVE.replace("%l", $gameMap.totalLemmings).replace("%p", Math.floor($gameMap.needed / $gameMap.totalLemmings * 100)))
  };
  this.text.mapName.position.set(100, 40);
  this.text.objective.position.set(100, 80 + this.text.mapName.height);
  for(var a in this.text) {
    this.stage.addChild(this.text[a]);
  }

  Input.mouse.button.LEFT.onPress.add(this.startLevel, this);
}

Scene_PreGame.prototype.update = function() {
  Scene_Base.prototype.update.call(this);
  if(!this._loading) {
    this.updateMinimap();
  }
}

Scene_PreGame.prototype.updateMinimap = function() {
  this.minimap.update();
  // Reposition minimap
  var maxWidth = 360;
  this.minimap.height = (this.minimap.height / this.minimap.width) * maxWidth;
  this.minimap.width = maxWidth;
  this.minimap.position.set(Core.resolution.x - 40 - this.minimap.width, 40);
}

Scene_PreGame.prototype.startLevel = function() {
  Input.mouse.button.LEFT.onPress.remove(this.startLevel, this);
  SceneManager.push(new Scene_Game());
}

function Scene_Game() {
  this.init.apply(this, arguments);
}

Scene_Game.prototype = Object.create(Scene_Base.prototype);
Scene_Game.prototype.constructor = Scene_Game;

Scene_Game.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
  this.alarm = {
    doors: new Alarm()
  };
  this.stage.addChild($gameMap.world);
  this.actionSelected = "";
  this.paused = false;
  this.fastForward = false;
  this.grid = false;
  this.initUI();
  // Init cursor
  this.cursor = new Sprite_Cursor();
  this.lemmingSelect = null;
  this.stage.addChild(this.cursor);
  // Init action preview
  this.actionPreview = [];
  this.actionPreview = {
    tiles: [],
    alpha: {
      value: 0.9,
      speed: -0.05,
      min: 0.5,
      max: 0.9
    }
  };
  for(var a = 0;a < 5;a++) {
    var spr = new Sprite_Base();
    var anim = spr.addAnimation("idle");
    anim.addFrame("atlMisc", "previewTile.png");
    spr.playAnimation("idle");
    spr.visible = false;
    spr.z = -1510;
    this.actionPreview.tiles.push(spr);
    $gameMap.world.addChild(spr);
  }
}

Scene_Game.prototype.create = function() {
  this.startMap();
  this.initControls();
}

Scene_Game.prototype.update = function() {
  Scene_Base.prototype.update.call(this);
  // Move camera
  this.controlCamera();
  if(!this.paused) {
    // Update alarms
    for(var a in this.alarm) {
      this.alarm[a].update();
    }
    // Update map
    var updateCount = 1;
    if(this.fastForward) updateCount = 4;
    for(var a = 0;a < updateCount;a++) {
      for(var b in this.alarm) {
        this.alarm[b].update();
      }
      $gameMap.update();
    }
  }
  // Lemming control
  this.lemmingSelect = this.getLemmingUnderCursor();
  if(this.lemmingSelect) {
    var pt = $gameMap.toScreenSpace(this.lemmingSelect.x, this.lemmingSelect.y - 8);
    this.cursor.position.set(pt.x, pt.y);
    this.cursor.playAnimation("over");
    this.cursor.visible = true;
  }
  else {
    this.cursor.visible = false;
  }
  this.updateActionPreview();
  this.minimap.update();
}

Scene_Game.prototype.controlCamera = function() {
  var camSpeed = 3;
  if(Input.key.SHIFT.down) camSpeed *= 2;

  if(Input.isDown("camLeft")) {
    $gameMap.camera.move(-camSpeed, 0);
  }
  else if(Input.isDown("camRight")) {
    $gameMap.camera.move(camSpeed, 0);
  }
  if(Input.isDown("camUp")) {
    $gameMap.camera.move(0, -camSpeed);
  }
  else if(Input.isDown("camDown")) {
    $gameMap.camera.move(0, camSpeed);
  }
  $gameMap.updateCamera();
}

Scene_Game.prototype.startMap = function() {
  var snd = AudioManager.playSound("sndLetsGo");
  snd.audio.once("end", this._openDoors.bind(this));
}

Scene_Game.prototype._openDoors = function() {
  this.alarm.doors.time = 30;
  this.alarm.doors.onExpire.addOnce(function () {
    var arr = $gameMap.getDoors();
    var playedSound = false;
    for(var a = 0;a < arr.length;a++) {
      var obj = arr[a];
      if(!playedSound && obj.src.audio && obj.src.audio.open) {
        AudioManager.playSound(obj.src.audio.open);
        playedSound = true;
      }
      obj.doorOpen();
    }
  }, this);
}

Scene_Game.prototype.initUI = function() {
  this.uiHeight = 0;
  this.ui = [];
  this.uiScale = 2;
  this.createPanel();
  var cW = this.createActionButtons();
  this.createExtraButtons(cW);
  this.createMinimap();
}

Scene_Game.prototype.createPanel = function() {
  this.panel = new UI_Base(0, 0, "panel");
  this.panel.sprite.addAnimationExt("atlPanels", "idle", 1, "panel_classic.png");
  this.panel.sprite.playAnimation("idle");
  this.panel.sprite.scale.set(this.uiScale);
  this.panel.y = Core.resolution.y - this.panel.sprite.height;
  this.panel.z = 100;
  this.uiHeight = this.panel.sprite.height;
  this.stage.addChild(this.panel.sprite);
  this.ui.push(this.panel);
}

Scene_Game.prototype.createActionButtons = function() {
  var cA = 0;
  var cW = 0;
  for(var a in $gameMap.actions) {
    var action = $gameMap.actions[a];
    var actionSrc = $dataActions[a];
    var btn = new UI_Button(0, 0, "action" + cA.toString());

    btn.onClick.add(this.selectAction, this, [cA]);
    btn.addAnimation("up", "atlGUI", actionSrc.button.up);
    btn.addAnimation("down", "atlGUI", actionSrc.button.down);
    btn.sprite.scale.set(this.uiScale);
    btn.sprite.playAnimation("up");
    if(cA === 0) {
      this.actionSelected = a;
      btn.sprite.playAnimation("down");
    }
    btn.actionName = a;
    btn.label.text = action.amount.toString();

    btn.x = cW;
    cW += btn.sprite.width;
    btn.y = Core.resolution.y - btn.sprite.height;

    this.ui.push(btn);
    btn.refresh();
    this.stage.addChild(btn.sprite);
    cA++;
  }
  return cW;
}

Scene_Game.prototype.createExtraButtons = function(cW) {
  // Create pause button
  var btn = new UI_Button(0, 0, "pause");
  btn.onClick.add(this.pauseGame, this, [true]);
  btn.addAnimation("up", "atlGUI", ["Btn_Pause_0.png"]);
  btn.addAnimation("down", "atlGUI", ["Btn_Pause_1.png"]);
  btn.sprite.scale.set(this.uiScale);
  btn.sprite.playAnimation("up");
  btn.x = cW;
  cW += btn.sprite.width;
  btn.y = Core.resolution.y - btn.sprite.height;
  this.ui.push(btn);
  btn.refresh();
  this.stage.addChild(btn.sprite);
  // Create fast forward button
  var btn = new UI_Button(0, 0, "fastforward");
  btn.onClick.add(this.toggleFastForward, this, [true]);
  btn.addAnimation("up", "atlGUI", ["Btn_FastForward_0.png"]);
  btn.addAnimation("down", "atlGUI", ["Btn_FastForward_1.png"]);
  btn.sprite.scale.set(this.uiScale);
  btn.sprite.playAnimation("up");
  btn.x = cW;
  cW += btn.sprite.width;
  btn.y = Core.resolution.y - btn.sprite.height;
  this.ui.push(btn);
  btn.refresh();
  this.stage.addChild(btn.sprite);
  // Create grid button
  var btn = new UI_Button(0, 0, "grid");
  btn.onClick.add(this.toggleGrid, this, [true]);
  btn.addAnimation("up", "atlGUI", ["Btn_Grid_0.png"]);
  btn.addAnimation("down", "atlGUI", ["Btn_Grid_1.png"]);
  btn.sprite.scale.set(this.uiScale);
  btn.sprite.playAnimation("up");
  btn.x = cW;
  cW += btn.sprite.width;
  btn.y = Core.resolution.y - btn.sprite.height;
  this.ui.push(btn);
  btn.refresh();
  this.stage.addChild(btn.sprite);
}

Scene_Game.prototype.createMinimap = function() {
  this.minimap = new Minimap({ addCameraView: true, interactive: true });
  this.updateMinimap();
  this.stage.addChild(this.minimap);
}

Scene_Game.prototype.updateMinimap = function() {
  this.minimap.update();
  var maxWidth = 240;
  var maxHeight = this.panel.height - 1;
  this.minimap.height = (this.minimap.height / this.minimap.width) * maxWidth;
  this.minimap.width = maxWidth;
  this.minimap.position.set(Core.resolution.x - this.minimap.width, Core.resolution.y - this.minimap.height);
}

Scene_Game.prototype.initControls = function() {
  Input.mouse.button.LEFT.onPress.add(this._onMouseLeftDown, this);
  // Action select
  Input.key["1"].onPress.add(this.selectAction, this, [0]);
  Input.key["2"].onPress.add(this.selectAction, this, [1]);
  Input.key["3"].onPress.add(this.selectAction, this, [2]);
  Input.key["4"].onPress.add(this.selectAction, this, [3]);
  Input.key["5"].onPress.add(this.selectAction, this, [4]);
  Input.key["6"].onPress.add(this.selectAction, this, [5]);
  Input.key["7"].onPress.add(this.selectAction, this, [6]);
  Input.key["8"].onPress.add(this.selectAction, this, [7]);
  Input.key.F.onPress.add(this.toggleFastForward, this, [true]);
  Input.key[" "].onPress.add(this.pauseGame, this, [true]);
  Input.key.G.onPress.add(this.toggleGrid, this, [true]);
}

Scene_Game.prototype.releaseControls = function() {
  Input.mouse.button.LEFT.onPress.remove(this._onMouseLeftDown, this);
  Input.key["1"].onPress.remove(this.selectAction, this);
  Input.key["2"].onPress.remove(this.selectAction, this);
  Input.key["3"].onPress.remove(this.selectAction, this);
  Input.key["4"].onPress.remove(this.selectAction, this);
  Input.key["5"].onPress.remove(this.selectAction, this);
  Input.key["6"].onPress.remove(this.selectAction, this);
  Input.key["7"].onPress.remove(this.selectAction, this);
  Input.key["8"].onPress.remove(this.selectAction, this);
  Input.key.F.onPress.remove(this.toggleFastForward, this);
  Input.key[" "].onPress.remove(this.pauseGame, this);
  Input.key.G.onPress.remove(this.toggleGrid, this, [true]);
}

Scene_Game.prototype._onMouseLeftDown = function() {
  var elem = this.mouseOverUI();
  if(elem && elem.click) elem.click();
  else if(!elem && this.lemmingSelect) {
    if(this.actionSelected !== "" && $gameMap.actions[this.actionSelected]) {
      if($gameMap.actions[this.actionSelected].amount > 0) {
        var result = this.lemmingSelect.assignAction(this.actionSelected);
        if(result) {
          AudioManager.playSound("sndAction");
          $gameMap.actions[this.actionSelected].amount--;
          var elem = this.getActionButton(this.actionSelected);
          if(elem) {
            elem.label.text = $gameMap.actions[this.actionSelected].amount.toString();
            elem.refresh();
          }
        }
      }
    }
  }
}

Scene_Game.prototype.mouseOverUI = function() {
  this.sortUI();
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) return elem;
  }
  return null;
}

Scene_Game.prototype.sortUI = function() {
  this.ui.sort(function(a, b) {
    if(a.z > b.z) return 1;
    if(a.z < b.z) return -1;
    return 0;
  });
}

Scene_Game.prototype.selectAction = function(index) {
  var key = "action" + index.toString();
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.key === key) {
      elem.sprite.playAnimation("down");
      this.actionSelected = elem.actionName;
      AudioManager.playSound("sndUI_Click");
    }
    else if(elem.actionName) {
      elem.sprite.playAnimation("up");
    }
  }
}

Scene_Game.prototype.getUI_Element = function(key) {
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.key === key) return elem;
  }
  return null;
}

Scene_Game.prototype.getActionButton = function(actionName) {
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.actionName && elem.actionName === actionName) return elem;
  }
  return false;
}

Scene_Game.prototype.pauseGame = function(playSound) {
  this.paused = !this.paused;
  var elem = this.getUI_Element("pause");
  if(this.paused) elem.sprite.playAnimation("down");
  else elem.sprite.playAnimation("up");
  if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.toggleFastForward = function(playSound) {
  this.fastForward = !this.fastForward;
  var elem = this.getUI_Element("fastforward");
  if(this.fastForward) elem.sprite.playAnimation("down");
  else elem.sprite.playAnimation("up");
  if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.toggleGrid = function(playSound) {
  this.grid = !this.grid;
  var elem = this.getUI_Element("grid");
  if(this.grid) {
    elem.sprite.playAnimation("down");
    $gameMap.grid.visible = true;
  }
  else {
    elem.sprite.playAnimation("up");
    $gameMap.grid.visible = false;
  }
  if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.getLemmingUnderCursor = function() {
  var arr = $gameMap.getLemmings();
  // Filters
  if(Input.key.Q.down) arr = arr.filter(function(obj) { return obj.dir === Game_Lemming.DIR_LEFT; } );
  else if(Input.key.E.down) arr = arr.filter(function(obj) { return obj.dir === Game_Lemming.DIR_RIGHT; } );
  arr = arr.filter(function(obj) { return obj.interactive; } );
  // Action filters
  switch(this.actionSelected.toUpperCase()) {
    case "CLIMBER":
      arr = arr.filter(function(lemming) { return (!lemming.hasProperty("CLIMBER")); });
      break;
    case "FLOATER":
      arr = arr.filter(function(lemming) { return (!lemming.hasProperty("FLOATER")); });
      break;
    case "BOMBER":
      arr = arr.filter(function(lemming) { return (lemming.bomber.count === -1); } );
      break;
    case "BLOCKER":
      arr = arr.filter(function(lemming) { return (lemming.action !== Game_Lemming.ACTION_BLOCKER && lemming.onGround); } );
      break;
    case "BUILDER":
      arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_BUILDER || lemming.sprite.isAnimationPlaying('build-end')) && lemming.onGround); } );
      break;
    case "BASHER":
      arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_BASHER) && lemming.onGround); } );
      break;
    case "MINER":
      arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_MINER) && lemming.onGround); } );
      break;
    case "DIGGER":
      arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_DIGGER) && lemming.onGround); } );
      break;
  }
  // Select
  for(var a = 0;a < arr.length;a++) {
    var lem = arr[a];
    if(lem.mouseOver()) return lem;
  }
  return null;
}

Scene_Game.prototype.updateActionPreview = function() {
  // Update all action preview tiles
  this.actionPreview.alpha.value = Math.max(this.actionPreview.alpha.min, Math.min(this.actionPreview.alpha.max, this.actionPreview.alpha.value + this.actionPreview.alpha.speed));
  if(this.actionPreview.alpha.value === this.actionPreview.alpha.min) this.actionPreview.alpha.speed = -this.actionPreview.alpha.speed;
  else if(this.actionPreview.alpha.value === this.actionPreview.alpha.max) this.actionPreview.alpha.speed = -this.actionPreview.alpha.speed;
  for(var a = 0;a < this.actionPreview.tiles.length;a++) {
    var spr = this.actionPreview.tiles[a];
    spr.alpha = this.actionPreview.alpha.value;
    spr.visible = false;
  }
  if(this.lemmingSelect !== null) {
    switch(this.actionSelected) {
      case "blocker":
      case "bomber":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y) >> 4) << 4;
        spr.visible = true;
        break;
      case "builder":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + $gameMap.tileWidth * this.lemmingSelect.dir) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y) >> 4) << 4;
        spr.visible = true;
        break;
      case "basher":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + $gameMap.tileWidth * this.lemmingSelect.dir) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y) >> 4) << 4;
        spr.visible = true;
        break;
      case "miner":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + $gameMap.tileWidth * this.lemmingSelect.dir) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y) >> 4) << 4;
        spr.visible = true;
        var spr = this.actionPreview.tiles[1];
        spr.x = ((this.lemmingSelect.x + $gameMap.tileWidth * this.lemmingSelect.dir) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + $gameMap.tileHeight) >> 4) << 4;
        spr.visible = true;
        break;
      case "digger":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + $gameMap.tileHeight) >> 4) << 4;
        spr.visible = true;
        break;
    }
  }
}

function UI_Base() {
  this.init.apply(this, arguments);
}

Object.defineProperties(UI_Base.prototype, {
  x: {
    get: function() { return this.position.x; },
    set: function(value) {
      this.position.x = value;
      if(this.sprite) this.sprite.x = value;
    }
  },
  y: {
    get: function() { return this.position.y; },
    set: function(value) {
      this.position.y = value;
      if(this.sprite) this.sprite.y = value;
    }
  }
});

UI_Base.prototype.init = function(x, y, key) {
  this.position = new Point();
  this.sprite = new Sprite_UI();
  this.x = x;
  this.y = y;
  this.rect = null;
  this.key = key;
  this.z = 0;
}

UI_Base.prototype.over = function(x, y) {
  var r = this.rect;
  if(!r) r = new Rect(this.sprite.x - this.sprite.anchor.x * this.sprite.width, this.sprite.y - this.sprite.anchor.y * this.sprite.height, this.sprite.width, this.sprite.height);
  return (x >= r.left && x < r.right && y >= r.top && y < r.bottom);
}

function UI_Button() {
  this.init.apply(this, arguments);
}

UI_Button.prototype = Object.create(UI_Base.prototype);
UI_Button.prototype.constructor = UI_Button;

UI_Button.prototype.init = function(x, y, key) {
  UI_Base.prototype.init.call(this, x, y, key);
  this.label = new Text("", {
    fill: "white",
    stroke: "black",
    strokeThickness: 4,
    font: "bold 10px Arial"
  });
  this.label.anchor.x = 0.5;
  this.sprite.addChild(this.label);
  this.onClick = new Signal();
}

UI_Button.prototype.click = function() {
  this.onClick.dispatch();
}

UI_Button.prototype.addAnimation = function(name, atlasKey, animKeys) {
  var anim = this.sprite.addAnimation(name);
  for(var a = 0;a < animKeys.length;a++) {
    anim.addFrame(atlasKey, animKeys[a]);
  }
}

UI_Button.prototype.refresh = function() {
  this.label.x = (this.sprite.width / this.sprite.scale.y) / 2;
  this.label.y = 0;
}

function Map() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Map.prototype, {
  realWidth: {
    get: function() { return this.width * this.tileWidth; }
  },
  realHeight: {
    get: function() { return this.height * this.tileHeight; }
  }
});

Map.prototype.init = function(src, scene) {
  this.world           = new World();
  this.grid            = new PIXI.Container();
  this.camera          = new Camera(this);
  this.scene           = scene;
  this.tilesets        = [];
  this._expectedAssets = [];
  this._usedAssets     = [];
  this.width           = 1;
  this.height          = 1;
  this.tileWidth       = 16;
  this.tileHeight      = 16;
  this.tiles           = [];
  this.objects         = [];
  this.background      = { image: null, parallax: new Point(0.5, 0.5), useParallax: true };
  this.needed          = 1;
  this.saved           = 0;
  this.totalLemmings   = 0;
  this.name            = "No Name";
  this.pool            = {};
  this.actions         = {};
  this.maxFallDistance = 8 * 16;

  this.grid.z = -1500;
  this.grid.visible = false;
  this.world.addChild(this.grid);

  this.onLoad = new Signal();
  this.onLoad.addOnce(this.createLevel, this, [], 5);

  this.baseDir = src.split(/[\/\\]/).slice(0, -1).join("/") + "/";
  var obj = Loader.loadJSON("map", src);
  obj.onComplete.addOnce(this.parseTiledMap, this);
}

Map.prototype.parseTiledMap = function() {
  this.data = Cache.getJSON("map");
  this.parseMapProperties(this.data.properties);
  // Load Tilesets
  for(var a = 0;a < this.data.tilesets.length;a++) {
    var ts = this.data.tilesets[a];
    var key = "tileset" + a.toString();
    var tsBaseDir = this.baseDir + ts.source.split(/[\/\\]/).slice(0, -1).join("/") + "/";
    var args = [key, ts.firstgid, tsBaseDir, true];

    if(ts.source.split(/[\/\\]/).indexOf("generic") !== -1) args[3] = false;
    this._expectedAssets.push(key);
    var obj = Loader.loadJSON(key, this.baseDir + ts.source);
    obj.onComplete.addOnce(this.parseTilesetData, this, args, 20);
  }
}

Map.prototype.parseMapProperties = function(properties) {
  // Apply Map Properties
  if(properties.needed) this.needed = properties.needed;
  if(properties.name) this.name = properties.name;
  // Load Music
  if(properties.music) {
    var obj = Loader.loadAudio("music", AudioManager.baseDir("bgm") + properties.music + ".ogg");
    this._expectedAssets.push("music");
    obj.onComplete.addOnce(function() {
      this.clearAsset("music");
    }, this, [], 20);
  }
  // Load background
  if(properties.bg) {
    var obj = Loader.loadImage("background", "assets/graphics/backgrounds/" + properties.bg + ".jpg");
    this._expectedAssets.push("background");
    obj.onComplete.addOnce(function() {
      this.clearAsset("background");
    }, this, [], 20);
  }
  // Apply actions
  for(var a in $dataActions) {
    var action = $dataActions[a];
    if(properties[action.key]) this.actions[a] = { amount: properties[action.key] };
  }
}

Map.prototype.parseTilesetData = function(key, firstGid, baseDir, loadImage) {
  var tsData = Cache.getJSON(key);
  var ts = new Tileset();
  ts.margin         = tsData.margin;
  ts.spacing        = tsData.spacing;
  ts.tileWidth      = tsData.tilewidth;
  ts.tileHeight     = tsData.tileheight;
  ts.firstGid       = firstGid;
  ts.tileProperties = tsData.tileproperties ? tsData.tileproperties : null;

  if(loadImage) {
    var imageKey = key + "_image";
    this._expectedAssets.push(imageKey);
    var src = baseDir + tsData.image;
    var obj = Loader.loadImage(imageKey, src);
    obj.onComplete.addOnce(this.parseTileset, this, [imageKey, ts], 20);
  }
  else {
    this.tilesets.push(ts);
  }

  this._usedAssets.push({ type: "json", key: key });
  this.clearAsset(key);
}

Map.prototype.parseTileset = function(imageKey, tileset) {
  tileset.texture = Cache.getImage(imageKey);
  this.tilesets.push(tileset);

  this._usedAssets.push({ type: "image", key: imageKey });
  this.clearAsset(imageKey);
}

Map.prototype.clearAsset = function(key) {
  var a = this._expectedAssets.indexOf(key);
  if(a !== -1) {
    this._expectedAssets.splice(a, 1);
    if(this._expectedAssets.length === 0) {
      this.tilesets.sort(function(a, b) {
        if(a.firstGid < b.firstGid) return -1;
        if(a.firstGid > b.firstGid) return 1;
        return 0;
      });
      this.onLoad.dispatch();
    }
  }
}

Map.prototype.getTileset = function(uid) {
  for(var a = this.tilesets.length - 1;a >= 0;a--) {
    var ts = this.tilesets[a];
    if(uid >= ts.firstGid) return ts;
  }
  return null;
}

Map.prototype.createLevel = function() {
  this.width = this.data.width;
  this.height = this.data.height;
  this.tileWidth = this.data.tilewidth;
  this.tileHeight = this.data.tileheight;
  this.addBackground();
  // Resize
  while(this.tiles.length < this.width * this.height) {
    this.tiles.push(null);
  }
  // Parse layers
  for(var a = 0;a < this.data.layers.length;a++) {
    var layer = this.data.layers[a];
    // Tile Layer
    if(layer.type === "tilelayer") {
      this.parseTileLayer(layer);
    }
    // Object Layer
    else if(layer.type === "objectgroup") {
      this.parseObjectLayer(layer);
    }
  }
  // Create lemming pool
  this.pool.lemming = new Pool("Game_Lemming", this, [], this.totalLemmings);
  // Add grid
  this.addGrid();
}

Map.prototype.parseTileLayer = function(layer) {
  for(var a = 0;a < layer.data.length;a++) {
    var uid = layer.data[a];
    if(uid > 0) {
      var pos = this.getTilePosition(a);
      this.addTile(pos.x, pos.y, uid, 0);
    }
  }
}

Map.prototype.parseObjectLayer = function(layer) {
  for(var a = 0;a < layer.objects.length;a++) {
    var objData = layer.objects[a];
    var ts = this.getTileset(objData.gid);
    if(ts) {
      var props = ts.getTileProperties(objData.gid - ts.firstGid);
      if(props) {
        var obj;
        if(props.type === "prop") {
          obj = this.addProp(objData.x, objData.y, props.key, objData);
        }
      }
    }
  }
}

Map.prototype.addGrid = function() {
  for(var a = 0;a < this.width;a++) {
    for(var b = 0;b < this.height;b++) {
      var spr = new Sprite_Base();
      var anim = spr.addAnimation("idle");
      anim.addFrame("atlMisc", "gridTile.png");
      spr.position.set(a * this.tileWidth, b * this.tileHeight);
      spr.playAnimation("idle");
      this.grid.addChild(spr);
    }
  }
}

Map.prototype.addProp = function(x, y, key, data) {
  // Create object
  var obj = new Game_Prop(key);
  obj.map = this;
  obj.x = x;
  obj.y = y;
  this.objects.push(obj);
  // Reposition
  var src = $dataProps[obj.key];
  obj.x += (data.width * src.anchor.x);
  obj.y += (data.height * src.anchor.y);
  // Apply Properties
  if(data.properties) {
    // Door
    if(obj.type === "door") {
      // Value/Lemming Count
      if(data.properties.value) {
        this.totalLemmings += data.properties.value;
        obj.value = data.properties.value;
      }
      // Rate
      if(data.properties.rate) obj.rate = data.properties.rate;
    }
  }
  // Add to world
  this.world.addChild(obj.sprite);
}

Map.prototype.addTile = function(x, y, uid, flags, data) {
  if(!data) data = {};
  if(!flags) flags = 0;
  var ts = this.getTileset(uid);
  if(ts) {
    var index = this.getTileIndex(x, y);
    // Add new tile
    var tile = new Tile(ts.getTileTexture(uid - ts.firstGid));
    tile.x = x * this.tileWidth;
    tile.y = y * this.tileHeight;
    this.world.addChild(tile.sprite);
    // Add properties
    var properties = ts.getTileProperties(uid - ts.firstGid);
    if(properties) {
      for(var a in properties) {
        var property = properties[a];
        if(a.match(/PROPERTY_([a-zA-Z0-9]+)/i)) {
          tile.assignProperty(RegExp.$1);
        }
      }
    }
    // Remove old tile
    var oldTile = this.tiles.splice(index, 1, tile)[0];
    if(oldTile instanceof Tile) oldTile.sprite.destroy(true);
  }
}

Map.prototype.removeTile = function(x, y) {
  var index = this.getTileIndex(x, y);
  var oldTile = this.tiles.splice(index, 1, null)[0];
  if(oldTile instanceof Tile) {
    this.world.removeChild(oldTile.sprite);
    oldTile.sprite.destroy(true, false);
    return true;
  }
  return false;
}

Map.prototype.getTileIndex = function(x, y) {
  return x + (y * this.width);
}

Map.prototype.getTilePosition = function(index) {
  return new Point(
    Math.floor(index % this.width),
    Math.floor(index / this.width)
  );
}

Map.prototype.getTile = function(realX, realY) {
  if(realX < 0 || realY >= this.realWidth || realY < 0 || realY >= this.realHeight) return null;
  return this.tiles[this.getTileIndex(realX >> 4, realY >> 4)];
}

Map.prototype.setStage = function(stage) {
  stage.addChild(this.world);
}

Map.prototype.removeAssetsFromCache = function() {
  while(this._usedAssets.length > 0) {
    var asset = this._usedAssets.pop();
    switch(asset.type) {
      case "json":
        Cache.removeJSON(asset.key);
        break;
      case "image":
        Cache.removeImage(asset.key);
        break;
      case "audio":
        Cache.removeAudio(asset.key);
        break;
    }
  }
}

Map.prototype.update = function() {
  // Update objects
  var arr = this.objects.slice().filter(function(obj) { return obj.exists; } );
  for(var a = 0;a < arr.length;a++) {
    var o = arr[a];
    o.update();
  }
  // Apply Z-ordering
  this.world.children.sort(function(a, b) {
    if(a.z !== undefined && b.z !== undefined && a.z > b.z) return -1;
    if(a.z !== undefined && b.z !== undefined && a.z < b.z) return 1;
    return 0;
  });
}

Map.prototype.updateCamera = function() {
  this.camera.update();
  // Update tiles
  var arr = this.tiles.slice();
  for(var a = 0;a < arr.length;a++) {
    var t = arr[a];
    if(t) {
      if(this.camera.contains(t.sprite)) t.sprite.visible = true;
      else t.sprite.visible = false;
    }
  }
  // Update objects
  var arr = this.objects.slice().filter(function(obj) { return obj.exists; } );
  for(var a = 0;a < arr.length;a++) {
    var o = arr[a];
    if(this.camera.contains(o.sprite) && o.exists) o.sprite.visible = true;
    else o.sprite.visible = false;
  }
}

Map.prototype.getLemmings = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Lemming && obj.exists);
  });
}

Map.prototype.getDoors = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Prop && obj.type === "door" && obj.exists);
  });
}

Map.prototype.startMusic = function() {
  AudioManager.playBgm("music");
}

Map.prototype.tileCollision = function(realX, realY, lem) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return Tile.COLLISION_ENDOFMAP;
  var tile = this.getTile(realX, realY);
  if(tile) return tile.collisionFunction.call(lem, realX, realY);
  return Tile.COLLISIONFUNC_AIR.call(lem, realX, realY);
}

Map.prototype.tileHasBlocker = function(realX, realY) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return false;
  var r = new Rect((realX >> 4) << 4, (realY >> 4) << 4, this.tileWidth, this.tileHeight);
  var arr = this.getLemmings().slice().filter(function(lemming) { return lemming.action.current === Game_Lemming.ACTION_BLOCKER; } );
  for(var a = 0;a < arr.length;a++) {
    var lemming = arr[a];
    if(r.contains(lemming.x, lemming.y)) return true;
  }
  return false;
}

Map.prototype.toScreenSpace = function(mapX, mapY) {
  return new Point(
    (mapX - this.camera.rect.left) * this.world.scale.x,
    (mapY - this.camera.rect.top) * this.world.scale.y
  );
}

Map.prototype.replaceTile = function(x, y, tile) {
  var index = this.getTileIndex(x, y);
  if(index >= 0 && index < this.tiles.length) {
    var oldTile = this.tiles.splice(index, 1, tile)[0];
    if(oldTile) oldTile.sprite.destroy(true);
    tile.x = x * this.tileWidth;
    tile.y = y * this.tileHeight;
    this.world.addChild(tile.sprite);
  }
}

Map.prototype.toWorldSpace = function(screenX, screenY) {
  return new Point(
    (screenX / this.world.scale.x) + this.camera.rect.left,
    (screenY / this.world.scale.y) + this.camera.rect.top
  );
}

Map.prototype.addBackground = function() {
  if(Cache.hasImage("background")) {
    this.background.image = new Sprite_Background(Cache.getImage("background"), this.realWidth, this.realHeight);
    this.world.addChild(this.background.image);
  }
}

Map.prototype.end = function() {}

function Tileset() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Tileset.prototype, {
  width: {
    get: function() {
      return this.texture.width / (this.tileWidth + this.spacing);
    }
  },
  height: {
    get: function() {
      return this.texture.height / (this.tileHeight + this.spacing);
    }
  }
});

Tileset.prototype.init = function() {
  this.texture = null;
  this.firstGid = 1;
  this.margin = 2;
  this.spacing = 4;
  this.tileWidth = 16;
  this.tileHeight = 16;
  this.tileProperties = null;
}

Tileset.prototype.getCrop = function(index) {
  return new Rect(
    this.margin + (this.tileWidth + this.spacing) * (index % this.width),
    this.margin + (this.tileHeight + this.spacing) * Math.floor(index / this.width),
    this.tileWidth,
    this.tileHeight
  );
}

Tileset.prototype.getTileTexture = function(index) {
  var tex = this.texture.clone();
  tex.frame = this.getCrop(index);
  return tex;
}

Tileset.prototype.getTileProperties = function(index) {
  if(this.tileProperties && this.tileProperties[index.toString()]) return this.tileProperties[index.toString()];
  return null;
}

function Tile() {
  this.init.apply(this, arguments);
}

Tile.COLLISION_PASSABLE   = 0;
Tile.COLLISION_IMPASSABLE = 1;
Tile.COLLISION_ENDOFMAP   = 2;

Tile.COLLISIONFUNC_AIR = function(realX, realY) {
  return Tile.COLLISION_PASSABLE;
}
Tile.COLLISIONFUNC_GROUND = function(realX, realY) {
  return Tile.COLLISION_IMPASSABLE;
}

Tile.PROPERTY_STEEL = Math.pow(2, 0);

Object.defineProperties(Tile.prototype, {
  x: {
    get: function() { return this.position.x; },
    set: function(value) {
      this.position.x = value;
      if(this.sprite) this.sprite.position.x = value;
    }
  },
  y: {
    get: function() { return this.position.y; },
    set: function(value) {
      this.position.y = value;
      if(this.sprite) this.sprite.position.y = value;
    }
  }
});

Tile.prototype.init = function(texture) {
  this.sprite = new Sprite_Tile(texture);
  this.position = new Point();
  this.collisionFunction = Tile.COLLISIONFUNC_GROUND;
  this.property = 0;
}

Tile.prototype.assignProperty = function(name) {
  this.property = this.property | Tile["PROPERTY_" + name.toUpperCase()];
}

Tile.prototype.hasProperty = function(name) {
  return ((this.property & Tile["PROPERTY_" + name.toUpperCase()]) === Tile["PROPERTY_" + name.toUpperCase()]);
}

Tile.prototype.removeProperty = function(name) {
  this.property = this.property & ~(Tile["PROPERTY_" + name.toUpperCase()]);
}

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

function Camera() {
  this.init.apply(this, arguments);
}

Camera.prototype.init = function(map) {
  this.rect = new Rect(0, 0, 640, 360);
  this.map = map;
}

Camera.prototype.update = function() {
  this.map.world.scale.x = Core.resolution.x / this.rect.width;
  this.map.world.scale.y = Core.resolution.y / this.rect.height;
  this.map.world.position.x = -(this.rect.x * this.map.world.scale.x);
  this.map.world.position.y = -(this.rect.y * this.map.world.scale.y);
}

Camera.prototype.setPosition = function(position, anchor) {
  // Gather data
  var oldPos = new Point(this.rect.x, this.rect.y);
  var mapPos = new Point(
    position.x - (this.rect.width * anchor.x),
    position.y - (this.rect.height * anchor.y)
  );
  // Set bounds
  var scene = SceneManager.current();
  var bottomIncrease = 0;
  if(scene.uiHeight) bottomIncrease = scene.uiHeight / $gameMap.world.scale.y;
  var bounds = new Rect(0, 0, $gameMap.realWidth - this.rect.width, $gameMap.realHeight + bottomIncrease - this.rect.height);
  // Move
  this.rect.x = Math.max(bounds.left, Math.min(bounds.right, mapPos.x));
  this.rect.y = Math.max(bounds.top, Math.min(bounds.bottom, mapPos.y));
  // Update background
  if($gameMap.background.image) {
    $gameMap.background.image.tilePosition.x = this.rect.x * $gameMap.background.parallax.x;
    $gameMap.background.image.tilePosition.y = this.rect.y * $gameMap.background.parallax.y;
  }
  // Return data
  var diff = new Point(oldPos.x - this.rect.x, oldPos.y - this.rect.y);
  return diff;
}

Camera.prototype.move = function(x, y) {
  return this.setPosition(new Point(this.rect.x + x, this.rect.y + y), new Point(0, 0));
}

Camera.prototype.contains = function(spr) {
  var r = new Rect(spr.x - (spr.width * spr.anchor.x), spr.y - (spr.height * spr.anchor.y), spr.width, spr.height);
  return this.rect.overlap(r);
}

function Game_Base() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Game_Base.prototype, {
  exists: {
    get: function() { return this._exists; },
    set: function(value) {
      this._exists = value;
      if(this.sprite) this.sprite.visible = this._exists;
    }
  },
  x: {
    get: function() { return this._x; },
    set: function(value) {
      this._x = value;
      if(this.sprite) this.sprite.x = value;
    }
  },
  y: {
    get: function() { return this._y; },
    set: function(value) {
      this._y = value;
      if(this.sprite) this.sprite.y = value;
    }
  }
});

Game_Base.prototype.init = function() {
  this._exists = true;
  this._x = 0;
  this._y = 0;
  this.sprite = null;
  this.alarms = {};
  this.map = null;
}

Game_Base.prototype.spawn = function(args) {}

Game_Base.prototype.update = function() {
  // Update sprite
  if(this.sprite && this.sprite.update) this.sprite.update();
  // Update alarms
  for(var a in this.alarms) {
    this.alarms[a].update();
  }
}

Game_Base.prototype.remove = function() {
  this.exists = false;
}

function Game_Lemming() {
  this.init.apply(this, arguments);
}

Game_Lemming.prototype = Object.create(Game_Base.prototype);
Game_Lemming.prototype.constructor = Game_Lemming;

Game_Lemming.DIR_RIGHT          = 1;
Game_Lemming.DIR_LEFT           = -1;
Game_Lemming.ACTION_FALL        = { name: "Faller" };
Game_Lemming.ACTION_WALK        = { name: "Walker" };
Game_Lemming.ACTION_CLIMBER     = { name: "Climber" };
Game_Lemming.ACTION_FLOATER     = { name: "Floater" };
Game_Lemming.ACTION_BOMBER      = { name: "Bomber" };
Game_Lemming.ACTION_BLOCKER     = { name: "Blocker" };
Game_Lemming.ACTION_BUILDER     = { name: "Builder" };
Game_Lemming.ACTION_BASHER      = { name: "Basher" };
Game_Lemming.ACTION_MINER       = { name: "Miner" };
Game_Lemming.ACTION_DIGGER      = { name: "Digger" };
Game_Lemming.ACTION_BASHER      = { name: "Basher" };
Game_Lemming.ACTION_MINER       = { name: "Miner" };
Game_Lemming.ACTION_DIGGER      = { name: "Digger" };
Game_Lemming.ACTION_DEAD        = { name: "Dead" };

Game_Lemming.DEATH_ENDOFMAP = 0;
Game_Lemming.DEATH_FALL     = 1;

Game_Lemming.PROPERTY_CLIMBER = Math.pow(2, 0);
Game_Lemming.PROPERTY_FLOATER = Math.pow(2, 1);

Game_Lemming.prototype.init = function() {
  Game_Base.prototype.init.call(this);
  this.sprite           = new Sprite_Lemming();
  this.velocity         = new Point();
  this.dir              = Game_Lemming.DIR_RIGHT;
  this.property         = 0;
  this.action           = { current: Game_Lemming.ACTION_FALL };
  this.requestAnimation = "fall";
  this.fallDistance     = 0;
  this.onGround         = false;
  this.dead             = false;
  this.interactive      = true;
  this.clickArea        = new Rect(-8, -16, 16, 16);
  this.blockRect        = new Rect(-6, -12, 12, 13);

  this.bomber = { count: -1, label: new Text() };
  this.bomber.label.style.font = "bold 10px Arial";
  this.sprite.addChild(this.bomber.label);
  this.bomber.label.position.set(0, -16);
  this.bomber.label.anchor.set(0.5, 1);
  this.bomber.label.visible = false;
  this.alarms.bomber = new Alarm();
  this.alarms.bomber.baseTime = 60;
  this.alarms.bomber.onExpire.add(this._bomberTimer, this);

  this.alarms.action = new Alarm();
  this.alarms.action.onExpire.add(this._actionTimer, this);
  this.alarms.action.baseTime = 90;
  this.action.builder = { value: 0 };
  this.sprite.animations["build-end"].onEnd.add(this._buildEnd, this);

  this.sprite.animations["climb-end"].onEnd.add(this._climbEndAnim, this);
  this.initTriggers();
}

Game_Lemming.prototype.spawn = function(x, y) {
  Game_Base.prototype.spawn.call(this, x, y);
  this.dir                  = Game_Lemming.DIR_RIGHT;
  this.sprite.scale.x       = 1;
  this.property             = 0;
  this.onGround             = false;
  this.stopAction();
  this.fallDistance         = 0;
  this.onGround             = false;
  this.dead                 = false;
  this.interactive          = true;
  this.bomber.label.visible = false;
  this.bomber.count = -1;
}

Game_Lemming.prototype.initTriggers = function() {
  this.sprite.animations["fall-death"].onEnd.add(this.remove, this);
  this.sprite.animations["explode"].onEnd.add(this.explode, this);
  this.sprite.animations["float-start"].onEnd.add(this._floatEndAnim, this);
}

Game_Lemming.prototype.actionInitEval = function(key) {
  for(var a in $dataActions) {
    var action = $dataActions[a];
    if(action.initEval) eval(action.initEval);
  }
}

Game_Lemming.prototype.actionSpawnEval = function() {
  for(var a in $dataActions) {
    var action = $dataActions[a];
    if(action.spawnEval) eval(action.spawnEval);
  }
}

Game_Lemming.prototype.changeDirection = function() {
  if(this.dir === Game_Lemming.DIR_RIGHT) {
    this.dir = Game_Lemming.DIR_LEFT;
    this.sprite.scale.x = -1;
  }
  else if(this.dir === Game_Lemming.DIR_LEFT) {
    this.dir = Game_Lemming.DIR_RIGHT;
    this.sprite.scale.x = 1;
  }
}

Game_Lemming.prototype.update = function() {
  Game_Base.prototype.update.call(this);
  if(!this.dead) this.preMove();
  if(!this.dead) this.move();
  if(!this.dead) this.postMove();
  // Evals
  this.bomber.label.scale.x = 1 / this.sprite.scale.x;
  // Play animation
  this.sprite.playAnimation(this.requestAnimation);
}

Game_Lemming.prototype.preMove = function() {
  // Check for ground
  var col = this.map.tileCollision(this.x, this.y + 1, this);
  if(col === Tile.COLLISION_PASSABLE) {
    this.onGround = false;
    if(!this.dead) this.fall();
  }
  else if(col === Tile.COLLISION_IMPASSABLE) {
    if(!this.onGround) this.y = (((this.y + this.map.tileHeight) >> 4) << 4) - 1;
    this.onGround = true;
    this.checkFallDeath();
    if(!this.dead) this.walk();
  }
  else if(col === Tile.COLLISION_ENDOFMAP) {
    this.die(Game_Lemming.DEATH_ENDOFMAP);
  }
}

Game_Lemming.prototype.move = function() {
  var defaultAction = true;
  // Evals
  if(this.action.current === Game_Lemming.ACTION_CLIMBER) {
    defaultAction = false;
    if(this.map.tileCollision(this.x, this.y - 8, this) !== Tile.COLLISION_IMPASSABLE) {
      this.velocity.y = 0;
      this.requestAnimation = 'climb-end';
    }
    else if(this.map.tileCollision(this.x - (1 * this.dir), this.y + this.velocity.y, this) === Tile.COLLISION_IMPASSABLE) {
      this.action.current = Game_Lemming.ACTION_FALL;
      this.requestAnimation = 'fall';
    }
    else {
      this.y += this.velocity.y;
    }
  }
  // Default move
  if(defaultAction) {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
  // Update fall time
  if(this.action.current === Game_Lemming.ACTION_FALL) this.fallDistance += this.velocity.y;
  else this.fallDistance = 0;
}

Game_Lemming.prototype.postMove = function() {
  // React to ground
  if(this.map.tileCollision(this.x, this.y, this) === Tile.COLLISION_IMPASSABLE) {
    // Slope check
    if(this.map.tileCollision(this.x, this.y - this.map.tileHeight) === Tile.COLLISION_PASSABLE) {
      var defaultAction = true;
      // Evals
      if(this.action.current === Game_Lemming.ACTION_CLIMBER) defaultAction = false;
      // Align to slope
      if(defaultAction) {
        this.y -= this.map.tileHeight;
      }
    }
    else {
      var defaultAction = true;
      // Evals
      if(this.hasProperty("CLIMBER")) {
        defaultAction = false;
        if(this.action.current !== Game_Lemming.ACTION_CLIMBER) {
          this.action.current = Game_Lemming.ACTION_CLIMBER;
          this.requestAnimation = "climb";
          this.velocity.y = -0.25;
        }
      }
      // Turn around
      if(defaultAction) {
        this.x -= this.velocity.x;
        this.changeDirection();
      }
    }
  }
}

Game_Lemming.prototype.fall = function() {
  var defaultAction = true;
  // Evals
  if(this.hasProperty("FLOATER")) {
    defaultAction = false;
    this.action.current = Game_Lemming.ACTION_FLOATER;
    this.requestAnimation = "float-start";
    if(this.sprite.isAnimationPlaying("float")) this.requestAnimation = "float";
    this.velocity.y = 0.75;
    this.velocity.x = 0;
  }
  // Default action
  if(defaultAction) {
    this.action.current   = Game_Lemming.ACTION_FALL;
    this.requestAnimation = "fall";
    this.velocity.x       = 0;
    this.velocity.y       = 1;
  }
}

Game_Lemming.prototype.walk = function() {
  var defaultAction = true;
  // Evals
  if(this.action.current === Game_Lemming.ACTION_CLIMBER) defaultAction = false;
  else if(this.action.current === Game_Lemming.ACTION_BOMBER) {
    defaultAction = false;
    this.velocity.x = 0;
  }
  if(this.action.current === Game_Lemming.ACTION_BLOCKER) {
    defaultAction = false;
    this.velocity.x = 0;
  }
  else if(this.onGround) {
    var arr = this.map.getLemmings().slice();
    for(var a = 0;a < arr.length;a++) {
      var lemming = arr[a];
      if(lemming !== this && lemming.action.current === Game_Lemming.ACTION_BLOCKER &&
        !lemming.blockRect.contains(this.x - lemming.x, this.y - lemming.y) && lemming.blockRect.contains((this.x + this.velocity.x) - lemming.x, this.y - lemming.y)) {
        this.changeDirection(); break;
      }
    }
  }
  if(this.action.current === Game_Lemming.ACTION_BUILDER || this.action.current === Game_Lemming.ACTION_BASHER ||
    this.action.current === Game_Lemming.ACTION_MINER || this.action.current === Game_Lemming.ACTION_DIGGER) {
    defaultAction = false;
    this.velocity.x = 0;
  }
  // Default action
  if(defaultAction) {
    this.action.current   = Game_Lemming.ACTION_WALK;
    this.requestAnimation = "walk";
    this.velocity.x       = 0.5 * this.dir;
    this.velocity.y       = 0;
  }
}

Game_Lemming.prototype.checkFallDeath = function() {
  if(this.fallDistance >= this.map.maxFallDistance) this.die(Game_Lemming.DEATH_FALL);
}

Game_Lemming.prototype.die = function(deathType) {
  this.interactive = false;
  this.dead = true;
  this.action.current = Game_Lemming.prototype.ACTION_DEAD;
  switch(deathType) {
    case Game_Lemming.DEATH_FALL:
      AudioManager.playSound("sndLemmingDeath_Fall");
      this.requestAnimation = "fall-death";
      break;
    case Game_Lemming.DEATH_ENDOFMAP:
    default:
      AudioManager.playSound("sndDie");
      this.remove();
      break;
  }
}

Game_Lemming.prototype.mouseOver = function() {
  if(Input.mouse.position.world.x >= this.x + this.clickArea.x && Input.mouse.position.world.x < this.x + this.clickArea.width &&
    Input.mouse.position.world.y >= this.y + this.clickArea.y && Input.mouse.position.world.y < this.y + this.clickArea.height) return true;
  return false;
}

Game_Lemming.prototype.build = function(offsetX, offsetY) {
  var xTo = (this.x >> 4) + offsetX;
  var yTo = (this.y >> 4) + offsetY;
  var oldTile = this.map.getTile(xTo << 4, yTo << 4);
  if(oldTile === null) {
    var tile = new Tile(Core.tileset.generic.getTileTexture(0));
    this.map.replaceTile(xTo, yTo, tile);
  }
}

Game_Lemming.prototype.assignAction = function(actionName) {
  actionName = actionName.toUpperCase();
  if(actionName === "CLIMBER") {
    this.assignProperty("CLIMBER");
    return true;
  }
  else if(actionName === "FLOATER") {
    this.assignProperty("FLOATER");
    return true;
  }
  else if(actionName === "BOMBER") {
    this.bomber.count = 5;
    this.bomber.label.text = this.bomber.count.toString();
    this.bomber.label.visible = true;
    this.alarms.bomber.time = this.alarms.bomber.baseTime;
    return true;
  }
  else if(actionName === "BLOCKER") {
    this.action.current = Game_Lemming.ACTION_BLOCKER;
    this.requestAnimation = 'block';
    return true;
  }
  else if(actionName === "BUILDER") {
    this.action.current = Game_Lemming.ACTION_BUILDER;
    this.requestAnimation = "build";
    this.alarms.action.baseTime = 90;
    this.alarms.action.start();
    this.action.builder.value = 5;
    return true;
  }
  else if(actionName === "BASHER") {
    this.action.current = Game_Lemming.ACTION_BASHER;
    this.requestAnimation = "bash";
    this.alarms.action.baseTime = 60;
    this.alarms.action.start();
    return true;
  }
  else if(actionName === "MINER") {
    this.action.current = Game_Lemming.ACTION_MINER;
    this.requestAnimation = "mine";
    this.alarms.action.baseTime = 90;
    this.alarms.action.start();
    return true;
  }
  else if(actionName === "DIGGER") {
    this.action.current = Game_Lemming.ACTION_DIGGER;
    this.requestAnimation = "dig";
    this.alarms.action.baseTime = 60;
    this.alarms.action.start();
    return true;
  }
  // Was not able to assign action
  return false;
}

Game_Lemming.prototype.explode = function() {
  AudioManager.playSound("sndLemmingExplode");
  this.remove();
}

Game_Lemming.prototype.assignProperty = function(name) {
  this.property = this.property | Game_Lemming["PROPERTY_" + name.toUpperCase()];
}

Game_Lemming.prototype.hasProperty = function(name) {
  return ((this.property & Game_Lemming["PROPERTY_" + name.toUpperCase()]) === Game_Lemming["PROPERTY_" + name.toUpperCase()]);
}

Game_Lemming.prototype.removeProperty = function(name) {
  this.property = this.property & ~(Game_Lemming["PROPERTY_" + name.toUpperCase()]);
}

Game_Lemming.prototype.stopAction = function() {
  this.action.current = Game_Lemming.ACTION_WALK;
  this.requestAnimation = "walk";
  if(this.onGround) {
    this.action.current = Game_Lemming.ACTION_FALL;
    this.requestAnimation = "fall";
  }
  this.alarms.action.stop();
}

Game_Lemming.prototype._climbEndAnim = function() {
  this.y -= 8;
  this.action.current = Game_Lemming.ACTION_WALK;
  this.requestAnimation = "walk";
}

Game_Lemming.prototype._floatEndAnim = function() {
  this.sprite.playAnimation("float");
}

Game_Lemming.prototype._bomberTimer = function() {
  if(this.bomber.count >= 0) {
    this.bomber.count--;
    if(this.bomber.count === 0) {
      this._bomberStartExplode();
    }
    else {
      this.bomber.label.text = this.bomber.count.toString();
    }
  }
}

Game_Lemming.prototype._bomberStartExplode = function() {
  if(!this.onGround) this.explode();
  else {
    this.alarms.bomber.stop();
    this.bomber.label.visible = false;
    this.interactive = false;
    AudioManager.playSound('sndOhNo');
    this.action.current = Game_Lemming.ACTION_BOMBER;
    this.requestAnimation = 'explode';
  }
}

Game_Lemming.prototype._actionTimer = function() {
  if(this.action.current === Game_Lemming.ACTION_BUILDER) this._buildUpdate();
  else if(this.action.current === Game_Lemming.ACTION_BASHER) this._bashUpdate();
  else if(this.action.current === Game_Lemming.ACTION_MINER) this._mineUpdate();
  else if(this.action.current === Game_Lemming.ACTION_DIGGER) this._digUpdate();
}

Game_Lemming.prototype._buildUpdate = function() {
  if(this.map.tileCollision(this.x, this.y - this.map.tileHeight, this) === Tile.COLLISION_IMPASSABLE ||
  this.map.tileCollision(this.x + this.map.tileWidth * this.dir, this.y - this.map.tileHeight, this) === Tile.COLLISION_IMPASSABLE) {
    this.changeDirection();
    this.alarms.action.stop();
    this._buildEnd();
  }
  else {
    if(this.map.tileHasBlocker(this.x + (this.map.tileWidth * this.dir), this.y)) {
      this.changeDirection();
    }
    this.build(this.dir, 0, true);
    this.x += (this.map.tileWidth * this.dir);
    this.y -= this.map.tileHeight;
    this.action.builder.value--;
    if(this.action.builder.value < 2) {
      AudioManager.playSound('sndBuildEnding');
      if(this.action.builder.value === 0) {
        this.alarms.action.stop();
        this.requestAnimation = 'build-end';
      }
    }
  }
}

Game_Lemming.prototype._buildEnd = function() {
  this.action.current = Game_Lemming.ACTION_WALK;
  this.requestAnimation = 'walk';
}

Game_Lemming.prototype._bashUpdate = function() {
  var success = this.dig([new Point(this.x + this.map.tileWidth * this.dir, this.y)], new Point(this.map.tileWidth * this.dir, 0));
  if(!success) this.stopAction();
}

Game_Lemming.prototype._mineUpdate = function() {
  var success = this.dig([
    new Point(this.x + this.map.tileWidth * this.dir, this.y),
    new Point(this.x + this.map.tileWidth * this.dir, this.y + this.map.tileHeight)
  ], new Point(this.map.tileWidth * this.dir, this.map.tileHeight));
  if(!success) this.stopAction();
}

Game_Lemming.prototype._digUpdate = function() {
  var success = this.dig([new Point(this.x, this.y + this.map.tileHeight)], new Point(0, this.map.tileHeight));
  if(!success) this.stopAction();
}

Game_Lemming.prototype.dig = function(targetPoints, adjustMovement) {
  if(!adjustMovement) adjustMovement = new Point(0, 0);
  var success = true;
  var airTiles = 0;
  // Remove tile(s)
  for(var a = 0;a < targetPoints.length;a++) {
    var target = targetPoints[a];
    var tile = this.map.getTile(target.x, target.y);
    var col = this.map.tileCollision(target.x, target.y);
    if(tile && col === Tile.COLLISION_IMPASSABLE) {
      if(tile.hasProperty("STEEL")) {
        success = false;
        AudioManager.playSound("sndChink");
      }
      else this.map.removeTile(target.x >> 4, target.y >> 4);
    }
    else {
      airTiles++;
    }
  }
  if(airTiles === targetPoints.length) success = false;
  // Move in place
  if(success) {
    this.x += adjustMovement.x;
    this.y += adjustMovement.y;
  }
  return success;
}

function Game_Prop() {
  this.init.apply(this, arguments);
}

Game_Prop.prototype = Object.create(Game_Base.prototype);
Game_Prop.prototype.constructor = Game_Prop;

Game_Prop.prototype.init = function(key) {
  Game_Base.prototype.init.call(this);
  this.key = key;
  this.src = null;
  this.sprite = new Sprite_Prop();
  this.type = undefined;
  this.applySource();
}

Game_Prop.prototype.applySource = function() {
  this.src = $dataProps[this.key];
  this.type = this.src.type;
  // Initialize animations
  for(var a in this.src.animations) {
    var animSrc = this.src.animations[a];
    var anim = this.sprite.addAnimation(a);
    for(var b = 0;b < animSrc.length;b++) {
      anim.addFrame(this.src.baseTexture, animSrc[b]);
    }
  }
  // Door specific
  if(this.src.type === "door") {
    this.rate = 50;
    this.value = 0;
    this.sprite.playAnimation("closed");
    this.alarms.door = new Alarm();
    this.dropOffset = new Point(this.src.dropOffset.x, this.src.dropOffset.y);
  }
}

Game_Prop.prototype.update = function() {
  Game_Base.prototype.update.call(this);
}

Game_Prop.prototype.doorOpen = function() {
  var anim = this.sprite.playAnimation("opening");
  anim.onEnd.addOnce(this._doorOpened, this);
}

Game_Prop.prototype._doorOpened = function() {
  this.sprite.playAnimation("open");
  this.alarms.door.time = 30;
  this.alarms.door.onExpire.addOnce(this._doorStart, this);
}

Game_Prop.prototype._doorStart = function() {
  this.alarms.door.onExpire.add(this._doorAct, this);
  this.alarms.door.baseTime = this.rate;
  this.alarms.door.time = 1;
  this.map.startMusic();
}

Game_Prop.prototype._doorAct = function() {
  if(this.value > 0) {
    this.value--;
    this.map.pool.lemming.spawn(this.x + this.dropOffset.x, this.y + this.dropOffset.y);
    if(this.value === 0) this.alarms.door.stop();
  }
}

window.addEventListener("load", Core.start.bind(Core));
