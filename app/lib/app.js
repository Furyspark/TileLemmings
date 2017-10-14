var $gameMap        = null;
PIXI.addons         = {};
PIXI.addons.filters = {};

Math.radtodeg = function(rad) {
  return rad / Math.PI * 180;
}

Math.degtorad = function(deg) {
  return deg * Math.PI / 180;
}

Math.lengthdir_x = function(len, dir) {
  return Math.round((len * 100) * Math.cos(dir)) / 100;
}

Math.lengthdir_y = function(len, dir) {
  return -Math.round((len * 100) * Math.sin(dir)) / 100;
}

PIXI.addons.filters.ColorReplace = function(originalColor, newColor, epsilon) {
  PIXI.Filter.call(this);

  this.uniforms = {
    originalColor: { type: "3f", value: null },
    newColor: { type: "3f", value: null }
    // epsilon: { type: "1f", value: null }
  };

  this.originalColor = originalColor;
  this.newColor = newColor;
  // this.epsilon = epsilon;

  // this.passes = [this];

  this.vertexSrc = [
    // "attribute vec3 in_Position;                  // (x,y,z)",
    // //attribute vec3 in_Normal;                  // (x,y,z)     unused in this shader.
    // "attribute vec4 in_Colour;                    // (r,g,b,a)",
    // "attribute vec2 in_TextureCoord;              // (u,v)",
    // "varying vec2 v_vTexcoord;",
    // "varying vec4 v_vColour;",
    // "void main()",
    // "{",
    //     "vec4 object_space_pos = vec4( in_Position.x, in_Position.y, in_Position.z, 1.0);",
    //     "gl_Position = gm_Matrices[MATRIX_WORLD_VIEW_PROJECTION] * object_space_pos;",
    //     "v_vColour = in_Colour;",
    //     "v_vTexcoord = in_TextureCoord;",
    // "}"
    "attribute vec3 vertex;",
    "attribute vec3 normal;",
    "attribute vec2 uv1;",
    "attribute vec4 tangent;",
    "uniform mat4 _mv;",
    "uniform mat4 _mvProj;",
    "uniform mat3 _norm;",
    "uniform float _time;",
    "varying vec2 uv;",
    "varying vec3 n;",
    "void main(void) {",
      "gl_Position = _mvProj * vec4(vertex, 1.0);",
      "uv = uv1;",
      "n = normalize(_norm * normal);",
    "}"
  ].join("\n");

  this.fragmentSrc = [
    'precision mediump float;',
    // 'varying vec2 vTextureCoord;',
    'varying vec3 n;',
    'varying vec2 uv;',
    // 'uniform sampler2D texture;',
    'uniform sampler2D tex;',
    'uniform vec3 originalColor;',
    'uniform vec3 newColor;',
    'uniform float epsilon;',
    'void main(void) {',
      "vec3 eyeSpaceLightDirection = vec3(0.0,0.0,1.0);",
      "float diffuse = max(0,dot(normalize(n),eyeSpaceLightDirection));",
      "gl_FragColor = vec4(texture2D(tex,uv).xyz*diffuse,1.0);",
      // "if (gl_FragColor.r < 0.2 && gl_FragColor.b < 0.2)",
      //   "gl_FragColor = vec4(originalColor.rgb * gl_FragColor.g, 1.0);",
      // "else if (abs(gl_FragColor.r - gl_FragColor.b) < 0.3 && gl_FragColor.g == 0.0)",
      //   "gl_FragColor = vec4(newColor.rgb * gl_FragColor.r, 1.0);",
    // '  vec4 currentColor = texture2D(texture, vTextureCoord);',
    // '  currentColor.xyz = mix(currentColor.xyz, newColor.xyz, 0.1);',
    // '  gl_FragColor = vec4(currentColor.x, currentColor.y, currentColor.z, currentColor.a);',
    // '  vec3 colorDiff = originalColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));',
    // '  float colorDistance = length(colorDiff);',
    // '  float doReplace = step(colorDistance, epsilon);',
    // // '  gl_FragColor = vec4(mix(currentColor.rgb, (newColor + colorDiff) * currentColor.a, doReplace), currentColor.a);',
    // '  gl_FragColor = vec4(mix(currentColor.rgb, (newColor + colorDiff) * currentColor.a, doReplace), currentColor.a);',
    '}'
    // "uniform vec4 f_colour;",
    // "varying vec2 v_vTexcoord;",
    // "varying vec4 v_vColour;",
    // "void main()",
    // "{",
    //     "vec4 col = texture2D( gm_BaseTexture, v_vTexcoord );",
    //     "col.rgb = mix(col.rgb, f_colour.rgb, f_colour.a);",
    //     "gl_FragColor = v_vColour * col;",
    // "}"
  ].join("\n");
}

PIXI.addons.filters.ColorReplace.prototype = Object.create(PIXI.Filter.prototype);
PIXI.addons.filters.ColorReplace.prototype.constructor = PIXI.addons.filters.ColorReplace;

Object.defineProperties(PIXI.addons.filters.ColorReplace.prototype, {
  originalColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value & 0x0000ff) / 255;
      this.uniforms.originalColor.value = { x: r, y: g, z: b };
      this.dirty = true;
    }
  },
  newColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value & 0x0000ff) / 255;
      this.uniforms.newColor.value = { x: r, y: g, z: b };
      this.dirty = true;
    }
  }
  // epsilon: {
  //   set: function(value) {
  //     this.uniforms.epsilon.value = value;
  //     this.dirty = true;
  //   }
  // }
});

function Point() {
  this.init.apply(this, arguments);
}

Point.prototype = Object.create(PIXI.Point.prototype);
Point.prototype.constructor = Point;

Point.prototype.init = function(x, y) {
  PIXI.Point.prototype.constructor.call(this, x, y);
}

Point.prototype.clone = function() {
  return new Point(this.x, this.y);
}

Point.prototype.distanceTo = function(toPos) {
  return Math.sqrt(Math.pow(this.x - toPos.x, 2) + Math.pow(this.y - toPos.y, 2));
}

Point.prototype.rotationTo = function(toPos) {
  var delta = new Point(toPos.x - this.x, toPos.y - this.y);
  var radians = Math.atan2(delta.y, delta.x);
  return radians;
}

Point.prototype.rotate = function(angle) {
  var x = this.x;
  var y = this.y;
  this.set(
    Math.round((x * Math.cos(angle) - y * Math.sin(angle)) * 100) / 100,
    Math.round((x * Math.sin(angle) + y * Math.cos(angle)) * 100) / 100
  );
  return this;
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

Rect.prototype.clone = function() {
  return new Rect(this.x, this.y, this.width, this.height);
}

Rect.prototype.rotate = function(angle) {
  var tl = new Point(this.x, this.y);
  var tr = new Point(this.x + this.width, this.y);
  var bl = new Point(this.x, this.y + this.height);
  var br = new Point(this.x + this.width, this.y + this.height);
  tl.rotate(angle);
  tr.rotate(angle);
  bl.rotate(angle);
  br.rotate(angle);
  this.x = Math.min(tl.x, tr.x, bl.x, br.x);
  this.y = Math.min(tl.y, tr.y, bl.y, br.y);
  this.width = Math.max(tl.x, tr.x, bl.x, br.x) - Math.min(tl.x, tr.x, bl.x, br.x);
  this.height = Math.max(tl.y, tr.y, bl.y, br.y) - Math.min(tl.y, tr.y, br.y, br.y);
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

Signal.prototype.dispatch = function(params) {
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
    if(params) bind.callback.apply(bind.context, params);
    else bind.callback.apply(bind.context, bind.args);
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

Background.prototype.init = function(imageKey, w, h, tile, parallax) {
  if(!parallax) parallax = new Point(0.5, 0.5);
  if(!tile) tile = { x: true, y: true };
  var tex = null;
  if(imageKey && imageKey.length > 0) tex = Cache.getImage(imageKey);
  if(!w) w = Core.renderer.width;
  if(!h) h = Core.renderer.height;
  PIXI.extras.TilingSprite.prototype.constructor.call(this, tex, w, h);
  this.z = 1000;
  this.parallax = parallax;
  this.tile = tile;
}

Background.prototype.refreshTiling = function() {
  if(!this.tile.x && !this.tile.y) {
    var factor = Math.max(
      $gameMap.camera.rect.width / this.texture.width,
      $gameMap.camera.rect.height / this.texture.height
    );
    this.tileScale.set(factor);
  }
  else if(!this.tile.x && this.tile.y) {
    var factor = $gameMap.camera.rect.width / this.texture.width;
    this.tileScale.set(factor);
  }
  else if(!this.tile.y & this.tile.x) {
    var factor = $gameMap.camera.rect.height / this.texture.height;
    this.tileScale.set(factor);
  }
}

Background.prototype.update = function() {}

Background.prototype.refresh = function() {
  this.refreshTiling();
  if(this.tile.x) this.tilePosition.x = $gameMap.camera.rect.x * this.parallax.x;
  else this.tilePosition.x = $gameMap.camera.rect.x;
  if(this.tile.y) this.tilePosition.y = $gameMap.camera.rect.y * this.parallax.y;
  else this.tilePosition.y = $gameMap.camera.rect.y;
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
  if(!style) style = Text.defaultStyle;
  PIXI.Text.prototype.constructor.call(this, text, style);
  this.z = 0;
}

function Meow() {
  this.init.apply(this, arguments);
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
  if(this._textureAtlases[key]) return this._textureAtlases[key].cache;
  return null;
}

Cache.addTextureAtlas = function(key, dataObj) {
  var obj = {};
  for(var a in dataObj.data.frames) {
    var tex = PIXI.utils.TextureCache[a];
    obj[a] = tex;
  }
  this._textureAtlases[key] = { resources: dataObj, cache: obj };
}

Cache.removeTextureAtlas = function(key) {
  // Gather info
  var obj = this._textureAtlases[key];
  var arr = [];
  for(var a in obj.resources.textures) {
    arr.push(obj.resources.textures[a]);
  }
  // Delete textures
  while(arr.length > 0) {
    var obj = arr.shift();
    var destroyBase = false;
    if(arr.length === 0) destroyBase = true;
    obj.destroy(destroyBase);
  }
  // Delete reference
  delete this._textureAtlases[key];
}

Cache.hasTextureAtlas = function(key) {
  return (this._textureAtlases[key] !== undefined);
}

function Loader() {}

Loader._loading = [];
Loader._textureAtlasQueue = [];
Loader.onComplete = new Signal();

Loader.loadJSON = function(key, src) {
  if(this.isLoading("json", key) || Cache.hasJSON(key)) return null;
  var xobj = new XMLHttpRequest();
  xobj.open("GET", src);
  xobj.onreadystatechange = function() {
    if(xobj.readyState === 4 && xobj.status === 200) { // Done loading
      file.onComplete.dispatch();
    }
    else if(xobj.readyState === 4 && xobj.status !== 200) { // Fail loading
      file.onFail.dispatch();
    }
  };
  xobj.send(null);

  var file = {
    key: key,
    src: src,
    type: "json",
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: xobj
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishJSON, this, [file], 10);

  return file;
}

Loader.loadYAML = function(key, src) {
  if(this.isLoading("json", key) || Cache.hasJSON(key)) return null;
  let xobj = new XMLHttpRequest();
  xobj.open("GET", src);
  xobj.onreadystatechange = function() {
    if(xobj.readyState === 4 && xobj.status === 200) { // Done loading
      file.onComplete.dispatch();
    }
    else if(xobj.readyState === 4 && xobj.status !== 200) { // Fail loading
      file.onFail.dispatch();
    }
  };
  xobj.send(null);

  let file = {
    key: key,
    src: src,
    type: "json",
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: xobj
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishYAML, this, [file], 10);

  return file;
};

Loader.loadAudio = function(key, src) {
  if(this.isLoading("audio", key) || Cache.hasAudio(key)) return null;
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
    type: "audio",
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: howl
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishAudio, this, [file], 10);

  return file;
}

Loader.loadImage = function(key, src) {
  if(this.isLoading("image", key) || Cache.hasImage(key)) return null;
  var file;
  var loader = new PIXI.loaders.Loader();
  loader.add(key, src);
  loader.on("complete", function(loader, resources) {
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
    type: "image",
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: null
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishImage, this, [file], 10);
  loader.load();

  return file;
}

Loader.loadTextureAtlas = function(key, src) {
  if(this.isLoading("textureAtlas", key) || Cache.hasTextureAtlas(key)) return null;
  var file;
  var loader = new PIXI.loaders.Loader();
  loader.add(key, src);
  loader.on("complete", function(loader, resources) {
    for(var a in resources) {
      if(a === file.key) file.dataObject = resources[a];
      if(a === file.key || a === file.key + "_image") {
        file.remaining--;
        if(file.remaining <= 0) file.onComplete.dispatch();
      }
    }
  });

  file = {
    key: key,
    src: src,
    type: "textureAtlas",
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: null,
    remaining: 2
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishTextureAtlas, this, [file], 10);
  loader.load();

  // Add to queue
  this._textureAtlasQueue.push(file);

  return file;
}

Loader._finishJSON = function(file) {
  Cache.addJSON(file.key, JSON.parse(file.dataObject.responseText));
  this._finishFile(file);
}

Loader._finishYAML = function(file) {
  Cache.addJSON(file.key, jsyaml.load(file.dataObject.responseText));
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

Loader._startLoadingTextureAtlas = function(queueObj) {
}

Loader.checkLoadCompletion = function() {
  if(this._loading.length === 0) this.onComplete.dispatch();
}

Loader.determineKey = function(url) {
  return url;
}

Loader.isLoading = function(type, key) {
  for(let a = 0;a < this._loading.length;a++) {
    var file = this._loading[a];
    if(file.key === key && file.type === type) return true;
  }
  return false;
}

function Core() {}

Core._dataObjects = [
  { name: "$dataProps", key: "dataProps", src: "assets/data/props.yaml" },
  { name: "$dataActions", key: "dataActions", src: "assets/data/actions.yaml" }
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
  this.initExternalLibs();
  Input.init();

  Loader.onComplete.addOnce(function() {
    SceneManager.push(new Scene_Boot());
    this.render();
  }, this);
}

Core.initMembers = function() {
  this.lastTime = new Date;
  this.fps = 0;
  this.frameRate = 60;
  this.debugMode = false;
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
  this.aspectRatio = this.resolution.x / this.resolution.y;
  // View
  this.rendererLeft = 0;
  this.rendererTop = 0;
}

Core.initElectron = function() {
  this.usingElectron = false;
  if(typeof require === "function") {
    this.usingElectron = true;
    this.ipcRenderer = require("electron").ipcRenderer;
    this.fs = require("fs");
    this.initElectronProperties();
  }
}

Core.initElectronProperties = function() {
  window.addEventListener("resize", Core.onResize);
  this.ipcRenderer.on("core", function(ev, args) {
    var cmd = args.splice(0, 1)[0];
    switch(cmd.toUpperCase()) {
      case "DEBUG":
        Core.debugMode = true;
        break;
    }
  });
}

Core.onResize = function(e) {
  Core.fitToWindow();
}

Core.initExternalLibs = function() {
  createjs.Ticker.framerate = this.frameRate;
}

Core.initPixi = function() {
  if(PIXI.utils.isWebGLSupported()) {
    this.renderer = new PIXI.WebGLRenderer(this.resolution.x, this.resolution.y);
  } else {
    this.renderer = new PIXI.CanvasRenderer(this.resolution.x, this.resolution.y);
  }
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  document.body.appendChild(this.renderer.view);
  if(this.usingElectron) {
    this.resizeWindow(this.resolution.x, this.resolution.y);
    this.centerWindow();
  }
}

Core.render = function() {
  // Update FPS
  var nowTime = new Date;
  if(nowTime.getSeconds() !== this.lastTime.getSeconds()) {
    this.fps = Math.floor(1000 / (nowTime - this.lastTime));
  }
  this.lastTime = nowTime;
  // Set new timeout
  // setTimeout(function() {
    requestAnimationFrame(this.render.bind(this));
  //   this.render();
  // }.bind(this), Math.max(1, 1000 / this.frameRate));
  // Update scene
  Input.update();
  SceneManager.update();
  Input._refreshButtonStates();
  SceneManager.render();
}

Core.startDataObjects = function() {
  for(var a = 0;a < this._dataObjects.length;a++) {
    var dObj = this._dataObjects[a];
    var obj = Loader.loadYAML(dObj.key, dObj.src);
    obj.onComplete.addOnce(function(dataObject) {
      window[dataObject.name] = Cache.getJSON(dataObject.key);
    }, this, [dObj], 20);
  }
}

Core.fitToWindow = function() {
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var nw = ww;
  var nh = wh;
  if(ww / wh >= Core.aspectRatio) {
    nw = Math.floor(nh * Core.aspectRatio);
  } else {
    nh = Math.floor(nw / Core.aspectRatio);
  }
  Core.renderer.view.style.position = "absolute";
  Core.renderer.view.style.width = nw.toString() + "px";
  Core.renderer.view.style.height = nh.toString() + "px";
  Core.rendererLeft = Math.floor(ww / 2 - nw / 2);
  Core.rendererTop = Math.floor(wh / 2 - nh / 2);
  Core.renderer.view.style.left = Core.rendererLeft.toString() + "px";
  Core.renderer.view.style.top = Core.rendererTop.toString() + "px";
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

var $gameTemp = {};

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
  Core.renderer.view.addEventListener("mousemove", this._onMouseMove.bind(this));
  Core.renderer.view.addEventListener("mousedown", this._onMouseDown.bind(this));
  Core.renderer.view.addEventListener("mouseup", this._onMouseUp.bind(this));
  Core.renderer.view.addEventListener("wheel", this._wheel.bind(this));
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
    },
    WHEELUP: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    },
    WHEELDOWN: {
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
    screenPrev: {
      x: 0,
      y: 0
    },
    world: {
      x: 0,
      y: 0
    },
    worldPrev: {
      x: 0,
      y: 0
    },
    realTime: {
      x: 0,
      y: 0
    }
  };
  this.onMove = new Signal();
  this.onMove.add(this.updatePosition, this, [], 100);
}

Input_Mouse.prototype.update = function() {
  this.position.screenPrev.x = this.position.screen.x;
  this.position.screenPrev.y = this.position.screen.y;
  this.position.screen.x = Math.floor((this.position.realTime.x - Core.rendererLeft) * Core.hRes);
  this.position.screen.y = Math.floor((this.position.realTime.y - Core.rendererTop) * Core.vRes);
  if($gameMap && $gameMap.world) {
    this.position.worldPrev.x = this.position.world.x;
    this.position.worldPrev.y = this.position.world.y;
    this.position.world.x = Math.floor((this.position.realTime.x - Core.rendererLeft) * Core.hRes / $gameMap.world.scale.x) + $gameMap.camera.rect.left;
    this.position.world.y = Math.floor((this.position.realTime.y - Core.rendererTop) * Core.vRes / $gameMap.world.scale.y) + $gameMap.camera.rect.top;
  }
}

Input_Mouse.prototype.updatePosition = function(e) {
  this.position.realTime.x = e.clientX;
  this.position.realTime.y = e.clientY;
}

function AudioManager() {}

AudioManager._bgm = null;
AudioManager._sounds = [];

AudioManager.playBgm = function(key) {
  if(this._bgm && this._bgm.key === key) return this._bgm;
  this.stopBgm();
  var snd = Cache.getAudio(key);
  if(snd) {
    this._bgm = { audio: snd, id: 0, channel: "bgm", paused: false, key: key };
    this._bgm.id = this._bgm.audio.play();
    this._bgm.audio.volume(Options.data.audio.volume.bgm, this._bgm.id);
    this._bgm.audio.loop(true, this._bgm.id);
    this._sounds.push(this._bgm);
    return this._bgm;
  }
  return null;
}

AudioManager.stopBgm = function() {
  if(this._bgm) this._bgm.audio.stop(this._bgm.id);
  this._bgm = null;
}

AudioManager.pauseBgm = function() {
  if(this._bgm) {
    this._bgm.audio.pause(this._bgm.id);
    this._bgm.paused = true;
  }
}

AudioManager.resumeBgm = function() {
  if(this._bgm && this._bgm.paused) {
    this._bgm.audio.play(this._bgm.audio.id);
    this._bgm.paused = false;
  }
}

AudioManager.playSound = function(key) {
  var snd = Cache.getAudio(key);
  if(snd) {
    var sndObj = { audio: snd, id: snd.play(), channel: "snd", key: key };
    snd.volume(Options.data.audio.volume.snd, sndObj.id);
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
  Options.data.audio.volume[channel] = volume;
  for(var a = 0;a < this._sounds.length;a++) {
    var snd = this._sounds[a];
    if(snd.channel === channel) snd.audio.volume(volume, snd.id);
  }
}

AudioManager._onSoundEnd = function(snd) {
  var a = this._sounds.indexOf(snd);
  if(a !== -1) this._sounds.splice(a, 1);
}

function SceneManager() {}

SceneManager._stack = [];

SceneManager.push = function(scene) {
  var currentScene = this.current();
  if(currentScene) currentScene.leave();
  this._stack.push(scene);
  scene.create();
}

SceneManager.pop = function() {
  var scene = this._stack.pop();
  scene.leave();
  scene.end();
  this.current().continue();
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

function SaveManager() {}

SaveManager.data          = null;
SaveManager.SAVE_LOCATION = "save.json";
SaveManager.onSave        = new Signal();
SaveManager.onLoad        = new Signal();

SaveManager.generate = function() {
  this.data = {};
  this.data.mapCompletion = {};
}

SaveManager.addMapCompletion = function(world, key, completion) {
  if(!this.data.mapCompletion[world]) {
    this.data.mapCompletion[world] = {};
  }
  this.data.mapCompletion[world][key] = completion;
  this.save();
}

SaveManager.getMapCompletion = function(world, key) {
  return (this.data.mapCompletion[world] && this.data.mapCompletion[world][key] === true);
}

SaveManager.save = function() {
  var json = JSON.stringify(this.data);
  if(Core.usingElectron) {
    Core.fs.writeFile(SaveManager.SAVE_LOCATION, json, {}, function() {
      this.onSave.dispatch();
    }.bind(this));
  }
  else {
    localStorage.setItem("save", json);
    this.onSave.dispatch();
  }
}

SaveManager.load = function() {
  this.generate();
  if(Core.usingElectron) {
    Core.fs.readFile(SaveManager.SAVE_LOCATION, {}, function(err, data) {
      if(!err) this.data = Object.assign(this.data, JSON.parse(data));
      this.onLoad.dispatch();
    }.bind(this));
  }
  else {
    var data = localStorage.getItem("save");
    if(data) this.data = Object.assign(this.data, JSON.parse(data));
    this.onLoad.dispatch();
  }
}

function Options() {}

Options.data          = null;
Options.SAVE_LOCATION = __dirname + "/config.json";
Options.onSave        = new Signal();
Options.onLoad        = new Signal();

Options.generate = function() {
  this.data = {};
  this.data.audio = {
    volume: {
      bgm: 0.9,
      snd: 0.9
    },
    toggleDuringPause: false
  };
  this.data.gameplay = {
    startWithGrid: false
  };
}

Options.save = function() {
  var json = JSON.stringify(this.data);
  if(Core.usingElectron) {
    Core.fs.writeFile(Options.SAVE_LOCATION, json, {}, function() {
      this.onSave.dispatch();
    }.bind(this));
  }
  else {
    localStorage.setItem("config", json);
    this.onSave.dispatch();
  }
}

Options.load = function() {
  this.generate();
  if(Core.usingElectron) {
    Core.fs.readFile(Options.SAVE_LOCATION, {}, function(err, data) {
      if(!err) this.data = Object.assign(this.data, JSON.parse(data));
      this.onLoad.dispatch();
    }.bind(this));
  }
  else {
    var data = localStorage.getItem("config");
    if(data) this.data = Object.assign(this.data, JSON.parse(data));
    this.onLoad.dispatch();
  }
}

function Filter_ColorReplace() {
  this.initialize.apply(this, arguments);
}

Filter_ColorReplace.prototype = Object.create(PIXI.Filter.prototype);
Filter_ColorReplace.prototype.constructor = Filter_ColorReplace;

Object.defineProperties(Filter_ColorReplace.prototype, {
  findColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value &0x0000ff) / 255;
      this.uniforms.findColor[0] = r;
      this.uniforms.findColor[1] = g;
      this.uniforms.findColor[2] = b;
      this.dirty = true;
    }
  },
  replaceWithColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value &0x0000ff) / 255;
      this.uniforms.replaceWithColor[0] = r;
      this.uniforms.replaceWithColor[1] = g;
      this.uniforms.replaceWithColor[2] = b;
      this.dirty = true;
    }
  },
  range: {
    set: function(value) {
      this.uniforms.range = value;
      this.dirty = true;
    }
  }
});

Filter_ColorReplace.prototype.initialize = function(findColor, replaceWithColor, range) {
  if(range === undefined) range = 0.0000000001;

  var frag = [
    "precision mediump float;",
    "varying vec2 vTextureCoord;",
    "uniform sampler2D texture;",
    "uniform vec3 findColor;",
    "uniform vec3 replaceWithColor;",
    "uniform float range;",

    "void main() {",
    "vec4 currentColor = texture2D(texture, vTextureCoord);",
    "vec3 colorDiff = findColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));",
    "float colorDistance = length(colorDiff);",
    "float doReplace = step(colorDistance, range);",
    "gl_FragColor = vec4(mix(currentColor.rgb, (replaceWithColor + colorDiff) * currentColor.a, doReplace), currentColor.a);",
    "}"
  ].join("\n");
  PIXI.Filter.call(this, null, frag);

  this.findColor = findColor;
  this.replaceWithColor = replaceWithColor;
  this.range = range;
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

Sprite_Base.prototype.hasAnimation = function(key) {
  return (this.animations[key] instanceof Animation);
}

Sprite_Base.prototype.update = function() {
  // Update animation
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
  this.initFilters();
}

Sprite_Lemming.prototype.initAnimations = function() {
  this.addAnimationExt("atlLemming", "burn", 14, "sprLemming_Burn_%s.png");
  this.addAnimationExt("atlLemming", "drown", 16, "sprLemming_Drown_%s.png");
  this.addAnimationExt("atlLemming", "exit", 8, "sprLemming_Exit_%s.png");
  this.addAnimationExt("atlLemming", "explode", 16, "sprLemming_Explode_%s.png");
  this.addAnimationExt("atlLemming", "explosion", 1, "sprLemming_Explosion_%s.png");
  this.addAnimationExt("atlLemming", "fall-death", 16, "sprLemming_FallDeath_%s.png");
  this.addAnimationExt("atlLemming", "fall", 4, "sprLemming_Fall_%s.png");
  this.addAnimationExt("atlLemming", "walk", 8, "sprLemming_Walk_%s.png");
  this.addAnimationExt("atlLemming", "bash", 32, "sprLemming_Bash_%s.png");
  this.addAnimationExt("atlLemming", "block", 16, "sprLemming_Blocker_%s.png");
  this.addAnimationExt("atlLemming", "build", 16, "sprLemming_Build_%s.png");
  this.addAnimationExt("atlLemming", "build-end", 8, "sprLemming_BuildEnd_%s.png");
  this.addAnimationExt("atlLemming", "dig", 16, "sprLemming_Dig_%s.png");
  this.addAnimationExt("atlLemming", "mine", 24, "sprLemming_Mine_%s.png");
  this.addAnimationExt("atlLemming", "climb", 8, "sprLemming_Climb_%s.png");
  this.addAnimationExt("atlLemming", "climb-end", 8, "sprLemming_Climb_End_%s.png");
  this.addAnimationExt("atlLemming", "float", 6, "sprLemming_Float_%s.png");
  this.addAnimationExt("atlLemming", "float-start", 4, "sprLemming_Float_Start_%s.png");
}

Sprite_Lemming.prototype.initFilters = function() {
  // var color = {
  //   hair: 0x00b0b0,
  //   skin: 0xf0d0d0,
  //   clothes: 0x4040e0
  // };
  // var filter = new PIXI.addons.filters.ColorReplace(color.hair, color.skin, 0.1);
  // this.filters = [filter];
}

function Sprite_Tile() {
  this.init.apply(this, arguments);
}

Sprite_Tile.prototype = Object.create(Sprite_Base.prototype);
Sprite_Tile.prototype.constructor = Sprite_Tile;

Sprite_Tile.prototype.init = function(texture) {
  Sprite_Base.prototype.init.call(this, texture);
  this.animSpeed = 0.25;
}

Sprite_Tile.prototype.addAnimationFrame = function(animKey, tileset, index) {
  if(!this.animations[animKey]) this.addAnimation(animKey);
  var anim = this.getAnimation(animKey);
  var tex = tileset.getTileTexture(index);
  anim.frames.push(tex);
}

Sprite_Tile.prototype.update = function() {
  Sprite_Base.prototype.update.call(this);
  var arr = this.children.slice();
  for(var a = 0;a < arr.length;a++) {
    if(arr[a].update) arr[a].update();
  }
}

function Sprite_Minimap() {
  this.init.apply(this, arguments);
}

Sprite_Minimap.prototype = Object.create(PIXI.Container.prototype);
Sprite_Minimap.prototype.constructor = Sprite_Minimap;

Sprite_Minimap.prototype.init = function() {
  PIXI.Container.prototype.constructor.call(this);
  this.interactive = false;
  this.tiles = [];

  this.background = new PIXI.Graphics();
  this.background.beginFill(0x0);
  this.background.drawRect(0, 0, $gameMap.width * 16, $gameMap.height * 16);
  this.background.endFill();
  this.background.z = 100;
  this.addChild(this.background);
}

Sprite_Minimap.prototype.update = function() {
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
        var spr = this.tiles.splice(a, 1, null)[0];
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
}

Sprite_Minimap.prototype.updateTile = function(mapTile, myTile) {
  myTile.playAnimation("ground");
  if(mapTile.hasProperty("STEEL")) myTile.playAnimation("steel");
  if(mapTile.collisionFunction === Game_Tile.COLLISIONFUNC_LIQUID) myTile.playAnimation("liquid");
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
  this.addAnimationExt("atlMinimap", "liquid", 1, "water.png");
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
  this.z = -100;
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
  this.z = -2100;
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

Scene_Base.FADEDURATION_DEFAULT = 500;


Scene_Base.prototype.init = function() {
  this.stage = new PIXI.Container();
  this.initFadeScreen();
  this.active = false;
  if(Core.debugMode) {
    this.startDebug();
  }
}

Scene_Base.prototype.update = function() {
  if(Core.debugMode) {
    this.debug.fpsCounter.text = Core.fps.toString();
  }
}

Scene_Base.prototype.render = function() {
  this.stage.children.sort(function(a, b) {
    return b.z - a.z;
  });
  Core.renderer.render(this.stage);
}

Scene_Base.prototype.startDebug = function() {
  this.debug = {};
  this.debug.fpsCounter = new Text(Core.fps.toString());
  this.debug.fpsCounter.style.fontSize = 14;
  this.debug.fpsCounter.position.set(8, 8);
  this.stage.addChild(this.debug.fpsCounter);
}

Scene_Base.prototype.create = function() {
  this.addListeners();
  this.active = true;
}

Scene_Base.prototype.continue = function() {
  this.active = true;
}

Scene_Base.prototype.leave = function() {
  this.active = false;
}

Scene_Base.prototype.end = function() {
  this.removeListeners();
}

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

Scene_Base.prototype.addListeners = function() {
  this.removeListeners();
}

Scene_Base.prototype.removeListeners = function() {}

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
  this._loadStage = { assets: false, options: false, save: false };

  Loader.onComplete.addOnce(function() {
    this._loadStage.assets = true;
    this._checkLoadCompletion();
  }, this);
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
  // Load options
  Options.onLoad.addOnce(function() {
    this._loadStage.options = true;
    this._checkLoadCompletion();
  }, this);
  Options.load();
  // Load save game
  SaveManager.onLoad.addOnce(function() {
    this._loadStage.save = true;
    this._checkLoadCompletion();
  }, this);
  SaveManager.load();
}

Scene_Boot.prototype._checkLoadCompletion = function() {
  for(var a in this._loadStage) {
    if(this._loadStage[a] === false) return;
  }
  this.start();
}

Scene_Boot.prototype.start = function() {
  Core.tileset.generic = new Game_Tileset();
  Core.tileset.generic.texture = Cache.getImage("tsGeneric");
  SceneManager.push(new Scene_MainMenu());
  // SceneManager.push(new Scene_PreGame("assets/levels/testlevel.json"));
}

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
  Scene_Base.prototype.create.call(this);
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    elem.addListeners();
  }
  this.addListeners();
}

Scene_MenuBase.prototype.initMembers = function() {
  this.ui = [];
  this.text = {};
}

Scene_MenuBase.prototype.continue = function() {
  Scene_Base.prototype.continue.call(this);
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    elem.addListeners();
  }
  this.addListeners();
}

Scene_MenuBase.prototype.leave = function() {
  Scene_Base.prototype.leave.call(this);
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    elem.remove();
  }
  this.removeListeners();
}

Scene_MenuBase.prototype.addUI = function(elem) {
  if(!elem.z) elem.z = 0;
  this.ui.push(elem);
  if(elem.sprite) this.stage.addChild(elem.sprite);
  else if(elem.contains(PIXI.DisplayObject)) this.stage.addChild(elem);
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
  Scene_Base.prototype.addListeners.call(this);
  Input.mouse.button.LEFT.onPress.add(this._onMouseLeftDown, this);
  Input.mouse.button.LEFT.onRelease.add(this._onMouseLeftUp, this);
}

Scene_MenuBase.prototype.removeListeners = function() {
  Scene_Base.prototype.removeListeners.call(this);
  Input.mouse.button.LEFT.onPress.remove(this._onMouseLeftDown, this);
  Input.mouse.button.LEFT.onRelease.remove(this._onMouseLeftUp, this);
}

Scene_MenuBase.prototype._onMouseLeftDown = function() {
  var returnElem = null;
  if(this.active) {
    this.applyUIZOrdering();
    for(var a = 0;a < this.ui.length;a++) {
      var elem = this.ui[a];
      if(elem.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) {
        returnElem = elem;
        if(elem.click) elem.click();
        break;
      }
    }
  }
  return returnElem;
}

Scene_MenuBase.prototype._onMouseLeftUp = function() {
  if(this.active) {
    this.ui.forEach(function(obj) {
      obj.release();
    });

    this.applyUIZOrdering();
    for(var a = 0;a < this.ui.length;a++) {
      var elem = this.ui[a];
      if(elem.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) {
        if(elem.unclick) elem.unclick();
        break;
      }
    }
  }
}

Scene_MenuBase.prototype.createBackButton = function() {
  var elem = new UI_MenuButton(new Point(40, 40), "Back");
  elem.onClick.add(this.fadeOut, this, [function() {
    SceneManager.pop();
  }]);
  this.addUI(elem);
  return elem;
}

Scene_MenuBase.prototype.getUI_Element = function(key) {
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.key === key) return elem;
  }
  return null;
}

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
  AudioManager.playBgm("bgmTitle");
  this.fadeIn();
}

Scene_MainMenu.prototype.continue = function() {
  Scene_MenuBase.prototype.continue.call(this);
  AudioManager.playBgm("bgmTitle");
  this.fadeIn();
}

Scene_MainMenu.prototype.update = function() {
  Scene_MenuBase.prototype.update.call(this);
  this.updateCheat();
}

Scene_MainMenu.prototype.createCommands = function() {
  Scene_MenuBase.prototype.createCommands.call(this);
  // Options
  var elem = new UI_MenuButton(new Point(Core.resolution.x * 0.8, 400), "Options");
  elem.x -= elem.sprite.width / 2;
  elem.onClick.add(this.fadeOut, this, [function() {
    SceneManager.push(new Scene_Options());
  }]);
  this.addUI(elem);
  // Play
  var elem = new UI_MenuButton(new Point(Core.resolution.x * 0.2, 400), "Play");
  elem.x -= elem.sprite.width / 2;
  elem.onClick.add(this.fadeOut, this, [function() {
    SceneManager.push(new Scene_WorldMap());
  }]);
  this.addUI(elem);
  // Exit
  if(Core.usingElectron) {
    var elem = new UI_MenuButton(new Point(Core.resolution.x * 0.5, 600), "Exit");
    elem.x -= elem.sprite.width / 2;
    elem.onClick.add(this.fadeOut, this, [function() {
      close();
    }]);
    this.addUI(elem);
  }
}

Scene_MainMenu.prototype.updateCheat = function() {
  // Complete all levels with Shift+F9
  if(Input.key.F9.pressed && Input.key.SHIFT.down) {
    if(Cache.hasJSON("world")) Cache.removeJSON("world");
    var obj = Loader.loadJSON("world", "assets/data/world.json");
    obj.onComplete.addOnce(function() {
      var world = Cache.getJSON("world");
      for(var worldName in world) {
        var subworld = world[worldName];
        for(var b = 0;b < subworld.contents.length;b++) {
          var map = subworld.contents[b];
          if(map.type !== "map") continue;
          SaveManager.addMapCompletion(worldName, map.key, true);
        }
      }
      // console.log(world);
      AudioManager.playSound("sndOhNo");
    }, this);
  }
}

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
  // Audio
  // Checkbox: Toggle music pausing on game pausing
  var elem = new UI_CheckBox(new Point(96, 128), "Pause music when pausing the game", Options.data.audio.toggleDuringPause);
  elem.onToggle.add(function(value) {
    Options.data.audio.toggleDuringPause = value;
  }, this);
  this.addUI(elem);
  // Slider: Music volume
  var elem = new UI_Slider(new Point(96, 240), "Music Volume", 240, Options.data.audio.volume.bgm);
  elem.onChange.add(function(value) {
    AudioManager.setVolume("bgm", value);
  }, this);
  elem.valueInterval = 0.05;
  this.addUI(elem);
  // Slider: Sound volume
  var elem = new UI_Slider(new Point(96, 320), "Sound Volume", 240, Options.data.audio.volume.snd);
  elem.onChange.add(function(value) {
    AudioManager.setVolume("snd", value);
  }, this);
  elem.valueInterval = 0.05;
  this.addUI(elem);
  // Gameplay
  // Checkbox: Start with Grid On
  var elem = new UI_CheckBox(new Point(480, 128), "Start level with grid visible", Options.data.gameplay.startWithGrid);
  elem.onToggle.add(function(value) {
    Options.data.gameplay.startWithGrid = value;
  }, this);
  this.addUI(elem);
}

function Scene_PreGame() {
  this.init.apply(this, arguments);
}

Scene_PreGame.TEXT_OBJECTIVE = "%l Lemmings\n%p% to be saved";

Scene_PreGame.prototype = Object.create(Scene_MenuBase.prototype);
Scene_PreGame.prototype.constructor = Scene_PreGame;

Scene_PreGame.prototype.init = function(src) {
  Scene_MenuBase.prototype.init.call(this);
  this._loading = true;
  if(src) {
    $gameMap = new Game_Map(src, this);
    $gameMap.onCreate.addOnce(this.start, this, [], 10);
  }
}

Scene_PreGame.prototype.start = function() {
  this._loading = false;
  // Stop Bgm
  AudioManager.stopBgm();
  // Add background
  this.background = new Background("bgMainMenu");
  this.stage.addChild(this.background);
  // Add minimap
  this.minimap = new Sprite_Minimap();
  this.minimap.z = 0;
  this.stage.addChild(this.minimap);
  this.updateMinimap();
  // Add description
  this.text = {
    mapName: new Text($gameMap.name),
    objective: new Text(Scene_PreGame.TEXT_OBJECTIVE.replace("%l", $gameMap.totalLemmings).replace("%p", Math.floor($gameMap.needed / $gameMap.totalLemmings * 100)))
  };
  this.text.mapName.position.set(100, 120);
  this.text.objective.position.set(100, 160 + this.text.mapName.height);
  for(var a in this.text) {
    this.stage.addChild(this.text[a]);
  }
  // Fade in
  this.fadeIn();
  // Add back button
  this.createBackButton();
}

Scene_PreGame.prototype.update = function() {
  Scene_MenuBase.prototype.update.call(this);
  if(!this._loading) {
    this.updateMinimap();
  }
}

Scene_PreGame.prototype.continue = function() {
  Scene_MenuBase.prototype.continue.call(this);
  $gameMap.createLevel();
  this.fadeIn();
}

Scene_PreGame.prototype.end = function() {
  Scene_MenuBase.prototype.end.call(this);
  $gameMap.destroy();
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
  this.fadeOut(function() {
    SceneManager.push(new Scene_Game());
  }.bind(this));
}

Scene_PreGame.prototype._onMouseLeftDown = function() {
  if($gameMap && $gameMap.loaded) {
    var elem = Scene_MenuBase.prototype._onMouseLeftDown.call(this);
    if(!elem) {
      this.startLevel();
    }
  }
}

function Scene_Game() {
  this.init.apply(this, arguments);
}

Scene_Game.prototype = Object.create(Scene_Base.prototype);
Scene_Game.prototype.constructor = Scene_Game;

Scene_Game.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
  this.alarm = {
    doors: new Alarm(),
    nuke: new Alarm()
  };
  this.alarm.nuke.onExpire.add(this._nukeLemming, this);
  this.alarm.nuke.baseTime = 10;
  this.stage.addChild($gameMap.world);
  this.actionSelected = "";
  this.paused = false;
  this.fastForward = false;
  this.nuked = false;
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
  // Zoom
  this.zoom = {
    factor: {
      current: 1,
      to: 1,
      maximum: 3,
      minimum: 0.5
    },
    focusPoint: new Point()
  };
  this._calculateZoomBounds();
  // Fade in
  this.fadeIn(this.startMap.bind(this, 0));
  // Add end of map event
  $gameMap.onEndOfMap.addOnce(this.endMap, this);
  // Apply player config
  if(Options.data.gameplay.startWithGrid) this.toggleGrid(false);
  this._mouseScrolling = false;
}

Scene_Game.prototype.create = function() {
  Scene_Base.prototype.create.call(this);
  this.initControls();
  $gameMap.updateCameraBounds();
}

Scene_Game.prototype.update = function() {
  Scene_Base.prototype.update.call(this);
  // Move camera
  this.controlCamera();
  if(this.minimap) this.minimap.update();
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
    var pt = $gameMap.toScreenSpace(this.lemmingSelect.x - (this.lemmingSelect.offsetPoint.down.x * 8), this.lemmingSelect.y - (this.lemmingSelect.offsetPoint.down.y * 8));
    this.cursor.position.set(pt.x, pt.y);
    this.cursor.scale.set(2 / this.zoom.factor.current);
    this.cursor.playAnimation("over");
    this.cursor.visible = true;
  }
  else {
    this.cursor.visible = false;
  }
  this.updateActionPreview();
}

Scene_Game.prototype.startMouseScroll = function() {
  this._mouseScrolling = true;
}

Scene_Game.prototype.stopMouseScroll = function() {
  this._mouseScrolling = false;
}

Scene_Game.prototype.controlCamera = function() {
  // Mouse scrolling
  if(this._mouseScrolling) {
    var spdFactor = 0.5;
    var hspd = (Input.mouse.position.screenPrev.x - Input.mouse.position.screen.x) * spdFactor;
    var vspd = (Input.mouse.position.screenPrev.y - Input.mouse.position.screen.y) * spdFactor;
    $gameMap.camera.move(hspd, vspd);
  }

  // Keyboard scrolling
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

  // Update
  this.updateZoom();
  $gameMap.updateCamera();
}

Scene_Game.prototype.updateZoom = function() {
  // Gather data
  var fp = this.zoom.focusPoint;
  var br = $gameMap.camera.baseRect;
  var r = $gameMap.camera.rect;
  var prevW = r.width;
  var prevH = r.height;
  // Apply Zoom
  r.width = br.width * this.zoom.factor.current;
  r.height = br.height * this.zoom.factor.current;
  // Reposition
  var diffW = r.width - prevW;
  var diffH = r.height - prevH;
  var anchor = new Point((r.x - fp.x) / r.width, (r.y - fp.y) / r.height);
  var pos = new Point(r.x + (diffW * anchor.x), r.y + (diffH * anchor.y));
  $gameMap.camera.setPosition(pos, new Point(0, 0));
}

Scene_Game.prototype.startMap = function(stage) {
  if(stage === undefined) stage = 0;
  if(stage === 0) {
    this.alarm.start = new Alarm();
    this.alarm.start.onExpire.addOnce(this.startMap, this, [stage+1]);
    this.alarm.start.time = 60;
  }
  else if(stage === 1) {
    var snd = AudioManager.playSound("sndLetsGo");
    snd.audio.once("end", this.startMap.bind(this, stage+1));
  }
  else if(stage === 2) {
    this.alarm.start.onExpire.addOnce(this.startMap, this, [stage+1]);
    this.alarm.start.time = 30;
  }
  else if(stage === 3) {
    this._openDoors();
  }
}

Scene_Game.prototype._openDoors = function() {
  this.alarm.doors.time = 30;
  this.alarm.doors.onExpire.addOnce(function () {
    var arr = $gameMap.getDoors();
    var playedSound = false;
    for(var a = 0;a < arr.length;a++) {
      var obj = arr[a];
      if(!playedSound && obj.sounds && obj.sounds.open) {
        AudioManager.playSound(obj.sounds.open);
        playedSound = true;
      }
      obj.doorOpen();
    }
  }, this);
}

Scene_Game.prototype.initUI = function() {
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
  this.panel.sprite.z = 100;
  this.uiHeight = this.panel.sprite.height;
  this.stage.addChild(this.panel.sprite);
  this.ui.push(this.panel);
}

Scene_Game.prototype.panelHeight = function() {
  return this.panel.sprite.height;
}

Scene_Game.prototype.createActionButtons = function() {
  var cA = 0;
  var cW = 0;
  for(var a in $gameMap.actions) {
    var action = $gameMap.actions[a];
    var actionSrc = $dataActions[a];
    var btn = new UI_Button(0, 0, "action" + cA.toString());

    btn.onClick.add(this.selectAction, this, [cA]);
    btn.addAnimation("up", "atlGUI", [actionSrc.button.up]);
    btn.addAnimation("down", "atlGUI", [actionSrc.button.down]);
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
  // Create nuke button
  var btn = new UI_Button(0, 0, "nuke");
  btn.onClick.add(this._buttonNuke, this, [btn]);
  btn.addAnimation("up", "atlGUI", ["Btn_Nuke_0.png"]);
  btn.addAnimation("down", "atlGUI", ["Btn_Nuke_1.png"]);
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
  this.minimap = new UI_Minimap({ addCameraView: true, interactive: true });
  this.updateMinimap();
  this.stage.addChild(this.minimap.sprite);
}

Scene_Game.prototype.updateMinimap = function() {
  this.minimap.update();
  var maxWidth = 240;
  var maxHeight = this.panel.height - 1;
  this.minimap.sprite.height = (this.minimap.sprite.height / this.minimap.sprite.width) * maxWidth;
  this.minimap.sprite.width = maxWidth;
  this.minimap.sprite.position.set(Core.resolution.x - this.minimap.sprite.width, Core.resolution.y - this.minimap.sprite.height);
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
  // Zooming
  Input.mouse.button.WHEELUP.onPress.add(this.zoomIn, this, [0.1, true], 30);
  Input.mouse.button.WHEELDOWN.onPress.add(this.zoomOut, this, [0.1, true], 30);
  // Scrolling
  Input.mouse.button.RIGHT.onPress.add(this.startMouseScroll, this);
  Input.mouse.button.RIGHT.onRelease.add(this.stopMouseScroll, this);
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
  // Zooming
  Input.mouse.button.WHEELUP.onPress.remove(this.zoomIn, this);
  Input.mouse.button.WHEELDOWN.onPress.remove(this.zoomOut, this);
  // Scrolling
  Input.mouse.button.RIGHT.onPress.remove(this.startMouseScroll, this);
  Input.mouse.button.RIGHT.onRelease.remove(this.stopMouseScroll, this);
}

Scene_Game.prototype.zoomIn = function(amount, toCursor) {
  if(toCursor === undefined) toCursor = false;
  this.zoom.factor.to = Math.max(this.zoom.factor.minimum, this.zoom.factor.to - amount);
  // Set to 1.0 if within reach
  if(this.zoom.factor.to > 1 - amount && this.zoom.factor.to < 1 + amount) this.zoom.factor.to = 1;
  // Tween
  createjs.Tween.get(this.zoom.factor, { override: true })
    .to({ current: this.zoom.factor.to }, 500, createjs.Ease.getPowOut(2.5));
  if(toCursor) {
    this.zoom.focusPoint.x = Input.mouse.position.world.x;
    this.zoom.focusPoint.y = Input.mouse.position.world.y;
  }
  else {
    this.zoom.focusPoint.x = $gameMap.camera.rect.x + ($gameMap.camera.rect.width / 2);
    this.zoom.focusPoint.y = $gameMap.camera.rect.y + ($gameMap.camera.rect.height / 2);
  }
}

Scene_Game.prototype.zoomOut = function(amount, fromCursor) {
  if(fromCursor === undefined) fromCursor = false;
  this.zoom.factor.to = Math.min(this.zoom.factor.maximum, this.zoom.factor.to + amount);
  // Set to 1.0 if within reach
  if(this.zoom.factor.to > 1 - amount && this.zoom.factor.to < 1 + amount) this.zoom.factor.to = 1;
  // Tween
  createjs.Tween.get(this.zoom.factor, { override: true })
    .to({ current: this.zoom.factor.to }, 500, createjs.Ease.getPowOut(2.5));
  if(fromCursor) {
    this.zoom.focusPoint.x = Input.mouse.position.world.x;
    this.zoom.focusPoint.y = Input.mouse.position.world.y;
  }
  else {
    this.zoom.focusPoint.x = $gameMap.camera.rect.x + ($gameMap.camera.rect.width / 2);
    this.zoom.focusPoint.y = $gameMap.camera.rect.y + ($gameMap.camera.rect.height / 2);
  }
}

Scene_Game.prototype._calculateZoomBounds = function() {
  var newMaxSize = new Point(
    $gameMap.realWidth / $gameMap.camera.baseRect.width,
    ($gameMap.realHeight + this.panel.sprite.height) / $gameMap.camera.baseRect.height
  );
  this.zoom.factor.maximum = Math.min(newMaxSize.x, newMaxSize.y);
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
    return a.z - b.z;
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
  // Now paused
  if(this.paused) {
    elem.sprite.playAnimation("down");
    if(Options.data.audio.toggleDuringPause) AudioManager.pauseBgm();
  }
  // Now unpaused
  else {
    elem.sprite.playAnimation("up");
    AudioManager.resumeBgm();
  }
  if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.toggleFastForward = function(playSound) {
  this.fastForward = !this.fastForward;
  var elem = this.getUI_Element("fastforward");
  if(this.fastForward) elem.sprite.playAnimation("down");
  else elem.sprite.playAnimation("up");
  if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype._buttonNuke = function(btn) {
  var c = new Date().getTime();
  if(btn.lastClickTime >= c - 500) {
    this.nuke();
  }
}

Scene_Game.prototype.nuke = function() {
  this.nuked = true;
  var elem = this.getUI_Element("nuke");
  elem.sprite.playAnimation("down");
  AudioManager.playSound("sndUI_Click");
  this.alarm.nuke.start();
  // Prevent lemmings from spawning
  var arr = $gameMap.getDoors();
  for(var a = 0;a < arr.length;a++) {
    var obj = arr[a];
    obj.value = 0;
  }
}

Scene_Game.prototype._nukeLemming = function() {
  var arr = $gameMap.getLemmings().filter(function(lemming) {
    return (lemming.bomber.count === -1);
  });
  if(arr.length > 0) arr[0].nuke();
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
  if(Input.key.Q.down) arr = arr.filter(function(obj) {
    if(obj.rotation % (Math.PI * 2) === Math.degtorad(180)) return obj.dir === Game_Lemming.DIR_RIGHT;
    return obj.dir === Game_Lemming.DIR_LEFT;
  });
  else if(Input.key.E.down) arr = arr.filter(function(obj) {
    if(obj.rotation % (Math.PI * 2) === Math.degtorad(180)) return obj.dir === Game_Lemming.DIR_LEFT;
    return obj.dir === Game_Lemming.DIR_RIGHT;
  });
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
  // Sort by priority
  arr.sort(function(a, b) {
    var baseActions = [Game_Lemming.ACTION_WALK, Game_Lemming.ACTION_FALL];
    if(baseActions.indexOf(a.action.current) !== -1 && baseActions.indexOf(b.action.current) === -1) return 1;
    if(baseActions.indexOf(a.action.current) === -1 && baseActions.indexOf(b.action.current) !== -1) return -1;
    return 0;
  });
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
        spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.right.x * 16 * this.lemmingSelect.dir)) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.right.y * 16 * this.lemmingSelect.dir)) >> 4) << 4;
        spr.visible = true;
        break;
      case "basher":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.right.x * 16 * this.lemmingSelect.dir)) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.right.y * 16 * this.lemmingSelect.dir)) >> 4) << 4;
        spr.visible = true;
        break;
      case "miner":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.right.x * 16 * this.lemmingSelect.dir)) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.right.y * 16 * this.lemmingSelect.dir)) >> 4) << 4;
        spr.visible = true;
        var spr = this.actionPreview.tiles[1];
        spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.right.x * 16 * this.lemmingSelect.dir) + (this.lemmingSelect.offsetPoint.down.x * 16)) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.right.y * 16 * this.lemmingSelect.dir) + (this.lemmingSelect.offsetPoint.down.y * 16)) >> 4) << 4;
        spr.visible = true;
        break;
      case "digger":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.down.x * 16)) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.down.y * 16)) >> 4) << 4;
        spr.visible = true;
        break;
    }
  }
}

Scene_Game.prototype.endMap = function() {
  this.fadeOut(function() {
    AudioManager.stopBgm();
    this.releaseControls();
    SceneManager.push(new Scene_PostGame());
  }.bind(this));
}

function Scene_PostGame() {
  this.init.apply(this, arguments);
}

Scene_PostGame.prototype = Object.create(Scene_Base.prototype);
Scene_PostGame.prototype.constructor = Scene_PostGame;

Scene_PostGame.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
  this.needed = $gameMap.needed;
  this.saved = $gameMap.saved;
  this.totalLemmings = $gameMap.totalLemmings;
  this.success = this.saved >= this.needed;
  // Save game
  if($gameTemp.currentMap && this.success) {
    SaveManager.addMapCompletion($gameTemp.currentMap.world, $gameTemp.currentMap.key, true);
  }
}

Scene_PostGame.prototype.create = function() {
  // Stop Bgm
  AudioManager.stopBgm();
  // Add background
  this.bg = new Background("bgMainMenu");
  this.stage.addChild(this.bg);
  // Add status text
  var desc = "You totally stormed that level!\n\nLet's see if you can storm the next..."
  if(this.saved < this.totalLemmings && this.saved === this.needed) desc = "SPOT ON!\n\nYou can't get much closer than that.";
  else if(this.saved < this.needed && this.saved > 0) desc = "Total bummer!\n\nTry again.";
  else if(this.saved === 0) desc = "ROCK BOTTOM!\n\nI hope for your sake you nuked that level.";
  this.text = {
    status: new Text(desc)
  };
  this.text.status.style.align = "center";
  this.text.status.position.set(Core.resolution.x / 2, 40);
  this.text.status.anchor.set(0.5, 0);
  this.stage.addChild(this.text.status);
  // Fade in
  this.fadeIn();
  // Add interactivity
  Input.mouse.button.LEFT.onPress.add(this.continueGame, this);
}

Scene_PostGame.prototype.continueGame = function() {
  if(this.success) {
    this.fadeOut(function() {
      while(!(SceneManager.current() instanceof Scene_MainMenu) && !(SceneManager.current() instanceof Scene_WorldMap)) {
        SceneManager.pop();
      }
    }.bind(this));
  }
  else {
    this.fadeOut(function() {
      while(!(SceneManager.current() instanceof Scene_PreGame) && !(SceneManager.current() instanceof Scene_MainMenu) && !(SceneManager.current() instanceof Scene_WorldMap)) {
        SceneManager.pop();
      }
    }.bind(this));
  }
}

Scene_PostGame.prototype.end = function() {
  Input.mouse.button.LEFT.onPress.remove(this.continueGame, this);
}

function Scene_WorldMap() {
  this.init.apply(this, arguments);
}

Scene_WorldMap.prototype = Object.create(Scene_MenuBase.prototype);
Scene_WorldMap.prototype.constructor = Scene_WorldMap;

Scene_WorldMap.CONTENT_OFFSET     = new Point(112, 96);
Scene_WorldMap.CONTENT_BUTTONSIZE = new Point(128, 128);
Scene_WorldMap.CONTENT_DATASIZE   = new Point(8, 4);
Scene_WorldMap.CONTENT_PADDING    = 16;


Scene_WorldMap.prototype.init = function() {
  Scene_MenuBase.prototype.init.call(this);
  this.current = "root";
  this.clearData();
  this.volatileGraphics = [];

  if(Cache.hasJSON("world")) Cache.removeJSON("world");
  var obj = Loader.loadYAML("world", "assets/data/world.yaml");
  obj.onComplete.addOnce(this.start, this);
}

Scene_WorldMap.prototype.start = function() {
  AudioManager.playBgm("bgmTitle");
  $gameWorld = Cache.getJSON("world");
  this.generateContent(this.current);
  this.fadeIn();
}

Scene_WorldMap.prototype.continue = function() {
  Scene_MenuBase.prototype.continue.call(this);
  AudioManager.playBgm("bgmTitle");
  this.generateContent(this.current);
  this.fadeIn();
}

Scene_WorldMap.prototype.clearData = function() {
  this.data = [];
  this.data.width = Scene_WorldMap.CONTENT_DATASIZE.x;
  this.data.height = Scene_WorldMap.CONTENT_DATASIZE.y;
  while(this.data.length < this.data.width * this.data.height) {
    this.data.push(null);
  }
  // Function: Replace
  this.data.replace = function(x, y, obj) {
    var index = (x * this.width) + y;
    return this.splice(index, 1, obj)[0];
  }
}

Scene_WorldMap.prototype.getDir = function(key) {
  return $gameWorld[key];
}

Scene_WorldMap.prototype.generateContent = function(key) {
  // Remove old content
  this.clear();

  var dir = this.getDir(key);
  // Create back button
  var elem = this.createBackButton();
  elem.onClick.add(this.fadeOut, this, [function() {
    this.goBack();
  }.bind(this)]);
  // Create content
  for(var a = 0;a < dir.contents.length;a++) {
    var content = dir.contents[a];
    this.createWorldButton(content);
  }
  this.parseWorldButtonRequirements();
}

Scene_WorldMap.prototype.createWorldButton = function(src) {
  // Determine position
  var pos = new Point(
    Scene_WorldMap.CONTENT_OFFSET.x + ((Scene_WorldMap.CONTENT_BUTTONSIZE.x + Scene_WorldMap.CONTENT_PADDING) * src.position.x),
    Scene_WorldMap.CONTENT_OFFSET.y + ((Scene_WorldMap.CONTENT_BUTTONSIZE.y + Scene_WorldMap.CONTENT_PADDING) * src.position.y)
  );
  // Create button
  var btn = new UI_WorldButton(pos, UI_WorldButton["TYPE_" + src.type.toUpperCase()], [src.icon]);
  btn.key = src.key;
  // Add event
  btn.onClick.add(this.fadeOut, this, [function(type, key) {
    this.enterWorld(btn, type, key);
  }.bind(this, src.type, src.key)]);
  // Add to UI list
  this.addUI(btn);
  // Add to data list
  this.data.replace(src.position.x, src.position.y, btn);
  return btn;
}

Scene_WorldMap.prototype.parseWorldButtonRequirements = function() {
  var dir = this.getDir(this.current);
  for(var a = 0;a < dir.contents.length;a++) {
    var src = dir.contents[a];
    var btn = this.getWorldButton(src.key);
    var meetsRequirements = true;
    // Determine requirements
    if(btn && src && src.require) {
      for(var b = 0;b < src.require.length;b++) {
        var requirement = src.require[b];
        // Map completion
        if(requirement.type === "map-completion") {
          var result = this.parseWorldButtonRequirement_MapCompletion(btn, requirement);
          if(meetsRequirements === true) meetsRequirements = result;
        }
      }
    }
    // Set map completion
    if(SaveManager.getMapCompletion(this.current, src.key)) {
      btn.setCompletion(UI_WorldButton.COMPLETE_COMPLETE);
    }
    else if(meetsRequirements) btn.setCompletion(UI_WorldButton.COMPLETE_INCOMPLETE);
    else btn.setCompletion(UI_WorldButton.COMPLETE_LOCKED);
    btn.checkCompletion();
  }
}

Scene_WorldMap.prototype.parseWorldButtonRequirement_MapCompletion = function(btn, requirement) {
  if(requirement.dir === this.current) {
    var btnTo = this.getWorldButton(requirement.key);
    var arrow = this.createArrow(btn.centerPos, btnTo.centerPos, 0x00ffff, 0x00aaaa);
  }
  if(SaveManager.getMapCompletion(requirement.dir, requirement.key)) return true;
  return false;
}

Scene_WorldMap.prototype.createArrow = function(fromPos, toPos, lineColor, arrowColor) {
  var gfx = new PIXI.Graphics();
  var len = fromPos.distanceTo(toPos);
  var arrowHeadSize = 24;
  var arrowHeadWidth = 36;
  gfx.beginFill(lineColor)
    .drawRect(0, -3, len - arrowHeadSize, 6)
    .endFill()
    .beginFill(arrowColor)
    .drawPolygon([
      new Point((len - arrowHeadSize), -(arrowHeadWidth / 2)),
      new Point((len - arrowHeadSize), (arrowHeadWidth / 2)),
      new Point(len, 0)
    ])
    .endFill();
  gfx.rotation = fromPos.rotationTo(toPos);
  gfx.position.set(fromPos.x, fromPos.y);
  gfx.z = 10;
  this.volatileGraphics.push(gfx);
  this.stage.addChild(gfx);
  return gfx;
}

Scene_WorldMap.prototype.getWorldButton = function(key) {
  for(var a = 0;a < this.data.length;a++) {
    var obj = this.data[a];
    if(obj && obj.key === key) return obj;
  }
  return null;
}

Scene_WorldMap.prototype.createBackButton = function() {
  var elem = new UI_MenuButton(new Point(40, 40), "Back");
  this.addUI(elem);
  return elem;
}

Scene_WorldMap.prototype.clear = function() {
  this.clearData();
  while(this.ui.length > 0) {
    var elem = this.ui.pop();
    if(elem.sprite) this.stage.removeChild(elem.sprite);
  }
  while(this.volatileGraphics.length > 0) {
    var elem = this.volatileGraphics.pop();
    elem.destroy();
  }
}

Scene_WorldMap.prototype.goBack = function() {
  var dir = this.getDir(this.current);
  if(dir.previous === null) {
    SceneManager.pop();
  }
  else {
    this.current = dir.previous;
    this.generateContent(this.current);
    this.fadeIn();
  }
}

Scene_WorldMap.prototype.enterWorld = function(btn, type, key) {
  if(type === "world") {
    this.current = key;
    this.generateContent(this.current);
    this.fadeIn();
  }
  else if(type === "map") {
    $gameTemp.currentMap = { world: this.current, key: key };
    SceneManager.push(new Scene_PreGame("assets/levels/" + this.current + "/" + key));
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
      if(this.refresh) this.refresh();
    }
  },
  y: {
    get: function() { return this.position.y; },
    set: function(value) {
      this.position.y = value;
      if(this.sprite) this.sprite.y = value;
      if(this.refresh) this.refresh();
    }
  },
  enabled: {
    get: function() { return this._enabled; },
    set: function(value) {
      this._enabled = value;
      if(this._enabled && this.sprite) this.sprite.tint = 0xFFFFFF;
      else if(this._enabled && this.sprite) this.sprite.tint = 0x000000;
    }
  }
});

UI_Base.prototype.init = function(x, y, key) {
  this.position = new Point();
  this.sprite = new Sprite_UI();
  this.x = x;
  this.y = y;
  this.enabled = true;
  this.rect = null;
  this.key = key;
  this.z = 0;
}

UI_Base.prototype.click = function() {
  if(this.enabled && this.onClick) this.onClick.dispatch();
}

UI_Base.prototype.unclick = function() {}

UI_Base.prototype.release = function() {}

UI_Base.prototype.over = function(x, y) {
  var r = this.rect;
  var anchor = new Point(0, 0);
  if(this.sprite.anchor) anchor = this.sprite.anchor;
  if(!r) r = new Rect(this.sprite.x - anchor.x * this.sprite.width, this.sprite.y - anchor.y * this.sprite.height, this.sprite.width, this.sprite.height);
  return (x >= r.left && x < r.right && y >= r.top && y < r.bottom);
}

UI_Base.prototype.addAnimation = function(name, atlasKey, animKeys) {
  if(this.sprite) {
    var anim = this.sprite.addAnimation(name);
    for(var a = 0;a < animKeys.length;a++) {
      anim.addFrame(atlasKey, animKeys[a]);
    }
  }
}

UI_Base.prototype.addListeners = function() {}

UI_Base.prototype.removeListeners = function() {}

UI_Base.prototype.remove = function() {
  this.removeListeners();
}

function UI_Button() {
  this.init.apply(this, arguments);
}

UI_Button.prototype = Object.create(UI_Base.prototype);
UI_Button.prototype.constructor = UI_Button;

UI_Button.prototype.init = function(x, y, key) {
  UI_Base.prototype.init.call(this, x, y, key);
  this.actOnPress = true;
  this.label = new Text("", {
    fill: "white",
    stroke: "black",
    strokeThickness: 4,
    fontSize: 10
  });
  this.label.anchor.x = 0.5;
  this.sprite.addChild(this.label);
  this.onClick = new Signal();
  this.lastClickTime = 0;
  this.z = -10;
}

UI_Button.prototype.click = function() {
  if(this.actOnPress) this.onClick.dispatch();

  var d = new Date();
  this.lastClickTime = d.getTime();
}

UI_Button.prototype.unclick = function() {
  if(!this.actOnPress) this.onClick.dispatch();
}

UI_Button.prototype.refresh = function() {
  if(this.label) {
    this.label.x = (this.sprite.width / this.sprite.scale.y) / 2;
    this.label.y = 0;
  }
}

function UI_MenuButton() {
  this.init.apply(this, arguments);
}

UI_MenuButton.prototype = Object.create(UI_Button.prototype);
UI_MenuButton.prototype.constructor = UI_MenuButton;

UI_MenuButton.prototype.init = function(position, label, frames, downFrames) {
  if(!frames) frames = ["button_blue.png"];
  if(!downFrames) downFrames = ["button_blue_down.png"];
  UI_Button.prototype.init.call(this);
  this.actOnPress = false;
  this.label.text = label;
  this.label.style.align = "center";
  this.label.anchor.set(0.5, 0.5);

  this.addAnimation("idle", "atlMainMenu", frames);
  this.sprite.playAnimation("idle");
  this.addAnimation("down", "atlMainMenu", downFrames);
  this.x = position.x;
  this.y = position.y;

  this.onClick.add(this.playSound_Click, this, [], 10);
}

UI_MenuButton.prototype.refresh = function() {
  if(this.label) {
    this.label.x = (this.sprite.width / this.sprite.scale.y) / 2;
    this.label.y = (this.sprite.height / this.sprite.scale.y) / 2;
  }
}

UI_MenuButton.prototype.click = function() {
  UI_Button.prototype.click.call(this);
  this.sprite.playAnimation("down");
}

UI_MenuButton.prototype.release = function() {
  UI_Button.prototype.release.call(this);
  this.sprite.playAnimation("idle");
}

UI_MenuButton.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}

function UI_WorldButton() {
  this.init.apply(this, arguments);
}

UI_WorldButton.prototype = Object.create(UI_Button.prototype);
UI_WorldButton.prototype.constructor = UI_WorldButton;

UI_WorldButton.TYPE_WORLD = 1;
UI_WorldButton.TYPE_MAP = 2;

UI_WorldButton.COMPLETE_LOCKED     = 1;
UI_WorldButton.COMPLETE_INCOMPLETE = 2;
UI_WorldButton.COMPLETE_COMPLETE   = 3;

Object.defineProperties(UI_WorldButton.prototype, {
  centerPos: {
    get: function() {
      return new Point(this.rect.x + this.rect.width / 2, this.rect.y + this.rect.height / 2);
    }
  }
});


UI_WorldButton.prototype.init = function(position, type, iconFrames, complete) {
  UI_Button.prototype.init.call(this);
  if(!position) position = new Point(0, 0);
  if(!type) type = UI_WorldButton.TYPE_WORLD;
  if(!iconFrames) iconFrames = [];
  if(!complete) complete = UI_WorldButton.COMPLETE_LOCKED;
  this.rect = new Rect();
  this.type = type;
  this.complete = complete;
  this.subSprites = {};
  this.initGraphics(iconFrames);
  this.x = position.x;
  this.y = position.y;
  this.onClick.add(this.playSound_Click, this);
}

UI_WorldButton.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}

UI_WorldButton.prototype.click = function() {
  if(this.complete && this.complete !== UI_WorldButton.COMPLETE_LOCKED) this.onClick.dispatch();
}

UI_WorldButton.prototype.initGraphics = function(iconFrames) {
  // Add background
  this.createBackground();
  // Add icon
  this.subSprites.icon = new Sprite_Base();
  var anim = this.subSprites.icon.addAnimation("idle");
  for(var a = 0;a < iconFrames.length;a++) {
    var frame = iconFrames[a];
    anim.addFrame("atlWorldMap", frame);
  }
  this.subSprites.icon.playAnimation("idle");
  this.subSprites.icon.anchor.set(0.5);
  this.subSprites.icon.position.set(this.subSprites.background.width / 2, this.subSprites.background.height / 2);
  this.subSprites.icon.z = 0;
  this.sprite.addChild(this.subSprites.icon);
  // Add icon mask
  this.subSprites.iconMask = new PIXI.Graphics();
  this.subSprites.iconMask.beginFill(0x000000)
    .drawRect(4, 4, this.subSprites.background.width - 8, this.subSprites.background.height - 8)
    .endFill();
  this.subSprites.iconMask.z = 0;
  this.sprite.addChild(this.subSprites.iconMask);
  this.subSprites.icon.mask = this.subSprites.iconMask;
  // Add frame
  this.createFrame();

  this.refresh();
}

UI_WorldButton.prototype.refresh = function() {
  UI_Button.prototype.refresh.call(this);
  // Update Z-Ordering
  this.sprite.children.sort(function(a, b) {
    return b.z - a.z;
  });
  // Update rect
  if(this.rect) {
    this.rect.x = this.x;
    this.rect.y = this.y;
    this.rect.width = this.subSprites.background.width;
    this.rect.height = this.subSprites.background.height;
  }
}

UI_WorldButton.prototype.setCompletion = function(completion) {
  if(this.complete !== completion) {
    this.complete = completion;
    this.sprite.removeChild(this.subSprites.frame);
    this.sprite.removeChild(this.subSprites.background);
    this.createBackground();
    this.createFrame();
    this.refresh();
  }
}

UI_WorldButton.prototype.checkCompletion = function() {
  if(this.type === UI_WorldButton.TYPE_WORLD) {
    if(this.subSprites.check) this.sprite.removeChild(this.subSprites.check);

    var dir = $gameWorld[this.key];
    var success = true;
    // Determine completion
    for(var a = 0;a < dir.contents.length;a++) {
      var mapKey = dir.contents[a].key;
      if(!SaveManager.data.mapCompletion[this.key] || !SaveManager.data.mapCompletion[this.key][mapKey]) {
        success = false;
        break;
      }
    }
    // Create graphical check
    if(success) {
      this.subSprites.check = new Sprite_Base();
      this.subSprites.check.addAnimationExt("atlWorldMap", "idle", 1, "world-completion.png");
      this.subSprites.check.playAnimation("idle");
      this.subSprites.check.z = -15;
      this.subSprites.check.anchor.set(1, 1);
      this.subSprites.check.position.set(this.subSprites.background.width, this.subSprites.background.height);
      this.sprite.addChild(this.subSprites.check);
    }
  }
  else if(this.type === UI_WorldButton.TYPE_MAP) {
    if(this.subSprites.check) this.sprite.removeChild(this.subSprites.check);

    var createdSprite = false;
    if(this.complete === UI_WorldButton.COMPLETE_COMPLETE) {
      createdSprite = true;
      this.subSprites.check = new Sprite_Base();
      this.subSprites.check.addAnimationExt("atlWorldMap", "idle", 1, "world-completion.png");
    }
    else if(this.complete === UI_WorldButton.COMPLETE_LOCKED) {
      createdSprite = true;
      this.subSprites.check = new Sprite_Base();
      this.subSprites.check.addAnimationExt("atlWorldMap", "idle", 1, "world-locked.png");
    }

    if(createdSprite) {
      this.subSprites.check.playAnimation("idle");
      this.subSprites.check.z = -15;
      this.subSprites.check.anchor.set(1, 1);
      this.subSprites.check.position.set(this.subSprites.background.width, this.subSprites.background.height);
      this.sprite.addChild(this.subSprites.check);
    }
  }
}

UI_WorldButton.prototype.createBackground = function() {
  if(this.subSprites.background) this.sprite.removeChild(this.subSprites.background);

  var spriteKey = "button-bg_world.png";
  if(this.type === UI_WorldButton.TYPE_MAP) spriteKey = "button-bg_level.png";

  this.subSprites.background = new Sprite_Base();
  this.subSprites.background.addAnimationExt("atlWorldMap", "idle", 1, spriteKey);
  this.subSprites.background.playAnimation("idle");
  this.subSprites.background.z = 5;
  this.sprite.addChild(this.subSprites.background);
}

UI_WorldButton.prototype.createFrame = function() {
  if(this.subSprites.frame) this.sprite.removeChild(this.subSprites.frame);

  var spriteKey = "button-fg_world.png";
  if(this.type === UI_WorldButton.TYPE_MAP) spriteKey = "button-fg_level.png";

  this.subSprites.frame = new Sprite_Base();
  this.subSprites.frame.addAnimationExt("atlWorldMap", "idle", 1, spriteKey);
  this.subSprites.frame.playAnimation("idle");
  this.subSprites.frame.z = -5;
  this.sprite.addChild(this.subSprites.frame);
}

function UI_CheckBox() {
  this.init.apply(this, arguments);
}

UI_CheckBox.prototype = Object.create(UI_Base.prototype);
UI_CheckBox.prototype.constructor = UI_CheckBox;

UI_CheckBox.prototype.init = function(position, label, value) {
  if(!position) position = new Point(0, 0);
  if(!label) label = "N/A";
  if(!value && value !== false) value = false;
  UI_Base.prototype.init.call(this);
  this.onToggle = new Signal();
  this.onClick = new Signal();
  this.onClick.add(this.toggle, this, [], 20);
  this.onClick.add(this.playSound_Click, this, [], 10);

  this.initAnimations();
  this.createLabel(label);
  this.setValue(value);

  this.x = position.x;
  this.y = position.y;
}

UI_CheckBox.prototype.setValue = function(value) {
  this.value = value;
  this.onToggle.dispatch([this.value]);
  this.refresh();
}

UI_CheckBox.prototype.toggle = function() {
  this.value = !this.value;
  this.onToggle.dispatch([this.value]);
  this.refresh();
}

UI_CheckBox.prototype.refresh = function() {
  if(this.value === true) this.sprite.playAnimation("marked");
  else if(this.value === false) this.sprite.playAnimation("unmarked");
  if(this.label) this.label.position.set(this.sprite.width, this.sprite.height / 2);
}

UI_CheckBox.prototype.initAnimations = function() {
  this.addAnimation("marked", "atlMainMenu", ["checkbox_marked.png"]);
  this.addAnimation("unmarked", "atlMainMenu", ["checkbox_unmarked.png"]);
  this.sprite.playAnimation("unmarked");
}

UI_CheckBox.prototype.createLabel = function(text) {
  this.label = new Text(text);
  this.label.style.fontSize = 14;
  this.label.anchor.set(0, 0.5);
  this.sprite.addChild(this.label);
}

UI_CheckBox.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}

function UI_Slider() {
  this.init.apply(this, arguments);
}

UI_Slider.prototype = Object.create(UI_Base.prototype);
UI_Slider.prototype.constructor = UI_Slider;

Object.defineProperties(UI_Slider.prototype, {
  value: {
    get: function() { return this._value; },
    set: function(value) {
      var newValue = Math.floor((value - this.valueMin) / this.valueInterval) * this.valueInterval + this.valueMin;
      this._value = Math.min(this.valueMax, Math.max(this.valueMin, newValue));
      this.refresh();
      this.onChange.dispatch([this._value]);
    }
  }
});


UI_Slider.prototype.init = function(position, label, length, value) {
  UI_Base.prototype.init.call(this);
  this.onChange  = new Signal();
  this.onPress   = new Signal();
  this.onRelease = new Signal();
  this.onPress.add(function() {
    this.playSound_Click();
    this._onMouseMove();
  }, this, [], 20);

  this.rect = new Rect(0, 0, 16, 16);
  this.length = length;
  this.initGraphics();
  this.createLabel(label);

  this.valueMin = 0;
  this.valueMax = 1;
  this.valueInterval = 0.01;
  this.value = value;

  this.x = position.x;
  this.y = position.y;
  this.refresh();
}

UI_Slider.prototype.click = function() {
  if(this.enabled) {
    this.onPress.dispatch();
    this._interacting = true;
    this._onMouseMove();
  }
}

UI_Slider.prototype._onMouseMove = function() {
  if(this._interacting) {
    var x = Input.mouse.position.screen.x;
    this.value = Math.max(0, Math.min(this.rect.width, x - this.rect.x)) / this.rect.width;
  }
}

UI_Slider.prototype.initGraphics = function() {
  this.subSprites = { bar: new Sprite_Base(), handle: new Sprite_Base() };
  // Create bar
  this.subSprites.bar.addAnimation("idle").addFrame("atlMainMenu", "slider_bg.png");
  this.subSprites.bar.playAnimation("idle");
  this.subSprites.bar.width = this.length;
  this.sprite.addChild(this.subSprites.bar);
  // Create handle
  this.subSprites.handle.addAnimation("idle").addFrame("atlMainMenu", "slider.png");
  this.subSprites.handle.playAnimation("idle");
  this.subSprites.handle.anchor.set(0.5);
  this.sprite.addChild(this.subSprites.handle);
}

UI_Slider.prototype.createLabel = function(text) {
  this.label = new Text(text);
  this.label.style.fontSize = 14;
  this.label.anchor.set(0.5, 1);
  this.sprite.addChild(this.label);
}

UI_Slider.prototype.addListeners = function() {
  UI_Base.prototype.addListeners.call(this);
  Input.mouse.button.LEFT.onRelease.add(this._releaseHold, this);
  Input.mouse.onMove.add(this._onMouseMove, this, [], 30);
}

UI_Slider.prototype.removeListeners = function() {
  UI_Base.prototype.removeListeners.call(this);
  Input.mouse.button.LEFT.onRelease.remove(this._releaseHold, this);
  Input.mouse.onMove.remove(this._onMouseMove, this);
}

UI_Slider.prototype._releaseHold = function() {
  if(this._interacting) {
    this._interacting = false;
    this.onRelease.dispatch();
  }
}

UI_Slider.prototype.refresh = function() {
  if(this.rect) {
    this.rect.x = this.x;
    this.rect.y = this.y - 16;
    this.rect.width = this.length;
    this.rect.height = 32;
  }
  if(this.label) this.label.position.set(this.rect.width / 2, -(this.rect.height / 2));
  if(this.subSprites) this.subSprites.handle.position.x = this.value * this.length;
}

UI_Slider.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}

function UI_Minimap() {
  this.init.apply(this, arguments);
}

UI_Minimap.prototype = Object.create(UI_Base.prototype);
UI_Minimap.prototype.constructor = UI_Base;

UI_Minimap.prototype.init = function(options) {
  UI_Base.prototype.init.call(this);
  this.sprite = new Sprite_Minimap();
  this._moveByMouse = false;

  if(options) {
    if(options.addCameraView) {
      this.addCameraView();
      this.updateCameraView();
      if(options.interactive) {
        this.addInteractivity();
      }
    }
  }
}

UI_Minimap.prototype.update = function() {
  if(this._moveByMouse) {
    var pos = new Point(
      (Input.mouse.position.screen.x - this.sprite.x) / this.sprite.scale.x,
      (Input.mouse.position.screen.y - this.sprite.y) / this.sprite.scale.y
    );
    $gameMap.camera.setPosition(pos, new Point(0.5, 0.5));
  }
  this.sprite.update();
  this.updateCameraView();
}

UI_Minimap.prototype.addCameraView = function() {
  // Create frame
  this.cameraFrame = new Sprite_Base();
  var anim = this.cameraFrame.addAnimation('idle');
  anim.addFrame('atlMinimap', 'frame.png');
  this.cameraFrame.playAnimation('idle');
  this.cameraFrame.z = -100;
  this.sprite.addChild(this.cameraFrame);
  // Create mask
  this.cameraFrameMask = new PIXI.Graphics();
  this.cameraFrameMask.beginFill(0x000000);
  this.cameraFrameMask.drawRect(0, 0, $gameMap.realWidth, $gameMap.realHeight);
  this.cameraFrameMask.endFill();
  this.sprite.addChild(this.cameraFrameMask);
  this.cameraFrame.mask = this.cameraFrameMask;
}

UI_Minimap.prototype.updateCameraView = function() {
  var scene = SceneManager.current();
  var subtractHeight = 0;
  if(scene && scene.panelHeight) subtractHeight = scene.panelHeight() / $gameMap.world.scale.y;
  this.cameraFrame.x = $gameMap.camera.rect.x;
  this.cameraFrame.y = $gameMap.camera.rect.y;
  this.cameraFrame.width = $gameMap.camera.rect.width;
  this.cameraFrame.height = $gameMap.camera.rect.height - subtractHeight;
}

UI_Minimap.prototype.addInteractivity = function() {
  Input.mouse.button.LEFT.onPress.add(this.mouseDown, this, [], 30);
  Input.mouse.button.LEFT.onRelease.add(this.mouseUp, this, [], 30);
}

UI_Minimap.prototype.removeInteractivity = function() {
  Input.mouse.button.LEFT.onPress.remove(this.mouseDown, this);
  Input.mouse.button.LEFT.onRelease.remove(this.mouseUp, this);
}

UI_Minimap.prototype.mouseDown = function() {
  if(this.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) this._moveByMouse = true;
}

UI_Minimap.prototype.mouseUp = function() {
  this._moveByMouse = false;
}

function Game_Map() {
  this.init.apply(this, arguments);
}

Game_Map.TILE_FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
Game_Map.TILE_FLIPPED_VERTICALLY_FLAG   = 0x40000000;
Game_Map.TILE_FLIPPED_DIAGONALLY_FLAG   = 0x20000000;

Object.defineProperties(Game_Map.prototype, {
  realWidth: {
    get: function() { return this.width * this.tileWidth; }
  },
  realHeight: {
    get: function() { return this.height * this.tileHeight; }
  }
});


Game_Map.prototype.init = function(src, scene) {
  this.grid               = new PIXI.Container();
  this.camera             = new Game_Camera(this);
  this.scene              = scene;
  this.tilesets           = [];
  this._expectedAssets    = [];
  this._expectedTilesets  = [];
  this._usedAssets        = [];
  this.width              = 1;
  this.height             = 1;
  this.tileWidth          = 16;
  this.tileHeight         = 16;
  this.background         = null;
  this.needed             = 1;
  this.saved              = 0;
  this.totalLemmings      = 0;
  this.name               = "No Name";
  this.pool               = {};
  this.actions            = {};
  this.maxFallDistance    = 10 * 16;
  this.trackVictoryDefeat = true;
  this.loaded             = false;

  this.onLoad     = new Signal();
  this.onCreate   = new Signal();
  this.onEndOfMap = new Signal();
  this.onLoad.addOnce(this.createLevel, this, [], 5);


  this.baseDir = src.split(/[\/\\]/).slice(0, -1).join("/") + "/";
  var obj = Loader.loadJSON("map", src);
  obj.onComplete.addOnce(this.parseTiledMap, this);
}

Game_Map.prototype.clear = function() {
  this.world              = new Game_World();
  this.tiles              = [];
  this.objects            = [];
  this.trackVictoryDefeat = true;

  this.grid.z = -1500;
  this.grid.visible = false;
  this.world.addChild(this.grid);
}

Game_Map.prototype.updateCameraBounds = function() {
  this.camera.bounds.x = 0;
  this.camera.bounds.y = 0;
  this.camera.bounds.width = this.realWidth;
  this.camera.bounds.height = this.realHeight;
  var scene = SceneManager.current();
  if(scene && scene.panelHeight) this.camera.bounds.height += (scene.panelHeight() / this.world.scale.y);
}

Game_Map.prototype.parseTiledMap = function() {
  this.data = Cache.getJSON("map");
  this.parseMapProperties(this.data.properties);
  // Load Tilesets
  for(var a = 0;a < this.data.tilesets.length;a++) {
    var ts = this.data.tilesets[a];
    var key = "tileset" + a.toString();
    var tsBaseDir = this.baseDir + ts.source.split(/[\/\\]/).slice(0, -1).join("/") + "/";
    var args = [key, ts.firstgid, tsBaseDir, true];

    if(ts.source.split(/[\/\\]/).indexOf("objects") !== -1) args[3] = false;
    this._expectedAssets.push(key);
    var obj = Loader.loadJSON(key, this.baseDir + ts.source);
    obj.onComplete.addOnce(this.parseTilesetData, this, args, 20);
  }
}

Game_Map.prototype.parseMapProperties = function(properties) {
  // Apply Map Properties
  if(properties.needed) this.needed = properties.needed;
  if(properties.name) this.name = properties.name;
  // Load Music
  if(properties.music) {
    var obj = Loader.loadAudio("music", AudioManager.baseDir("bgm") + properties.music + ".ogg");
    this._expectedAssets.push("music");
    obj.onComplete.addOnce(function() {
      this.clearAsset("music");
      this._usedAssets.push({ type: "audio", key: "music" });
    }, this, [], 20);
  }
  // Load background
  if(properties.bg) {
    var obj = Loader.loadImage("background", "assets/graphics/backgrounds/" + properties.bg + ".jpg");
    this._expectedAssets.push("background");
    obj.onComplete.addOnce(function() {
      this.clearAsset("background");
      this._usedAssets.push({ type: "image", key: "background" });
    }, this, [], 20);
  }
}

Game_Map.prototype.parseTilesetData = function(key, firstGid, baseDir, loadImage) {
  var tsData = Cache.getJSON(key);
  var ts = new Game_Tileset();
  ts.margin         = tsData.margin;
  ts.spacing        = tsData.spacing;
  ts.tileWidth      = tsData.tilewidth;
  ts.tileHeight     = tsData.tileheight;
  ts.firstGid       = firstGid;
  ts.tileProperties = tsData.tileproperties ? tsData.tileproperties : null;
  ts.tiles          = tsData.tiles ? tsData.tiles : null;

  // Load tileset texture
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

  this._expectedTilesets.push(key);
  this._usedAssets.push({ type: "json", key: key });
  this.clearAsset(key);
}

Game_Map.prototype.parseTileset = function(imageKey, tileset) {
  tileset.texture = Cache.getImage(imageKey);
  this.tilesets.push(tileset);

  this._usedAssets.push({ type: "image", key: imageKey });
  this.clearAsset(imageKey);
}

Game_Map.prototype.loadUsedGameObjectAssets = function() {
  var objects = this.getUsedGameObjects();
  for(var a = 0;a < objects.length;a++) {
    var obj = objects[a];
    var props = this.getObjectProperties(obj);
    if(props && props.type) {
      switch(props.type) {
        case "prop":
          this.loadGameObjectAsset($dataProps[props.key]);
          break;
      }
    }
  }
}

Game_Map.prototype.getUsedGameObjects = function() {
  var result = [];
  for(var a = 0;a < this.data.layers.length;a++) {
    var layer = this.data.layers[a];
    if(layer.type === "objectgroup") {
      for(var b = 0;b < layer.objects.length;b++) {
        var obj = layer.objects[b];
        result.push(obj);
      }
    }
  }
  return result;
}

Game_Map.prototype.loadGameObjectAsset = function(props) {
  // Load files
  for(var assetType in props.assets) {
    for(var assetKey in props.assets[assetType]) {
      var k = Loader.determineKey(props.assets[assetType][assetKey]);
      var file = null;
      switch(assetType) {
        case "audio":
          file = Loader.loadAudio(k, props.assets[assetType][assetKey]);
          break;
        case "textureAtlases":
          file = Loader.loadTextureAtlas(k, props.assets[assetType][assetKey]);
          break;
      }
      if(file !== null) {
        file.onComplete.addOnce(function(file) {
          this.clearAsset(file.key);
          this._usedAssets.push({ type: file.type, key: file.key });
        }, this, [file], 20);
        this._expectedAssets.push(k);
      }
    }
  }
}

Game_Map.prototype.clearAsset = function(key) {
  // Clear tileset
  this.clearTileset(key);
  // Check if done loading, and if so, create level
  var a = this._expectedAssets.indexOf(key);
  if(a !== -1) {
    this._expectedAssets.splice(a, 1);
    if(this._expectedAssets.length === 0) {
      this.tilesets.sort(function(a, b) {
        if(a.firstGid < b.firstGid) return -1;
        if(a.firstGid > b.firstGid) return 1;
        return 0;
      });
      this.loaded = true;
      this.onLoad.dispatch();
    }
  }
}

Game_Map.prototype.clearTileset = function(key) {
  var a = this._expectedTilesets.indexOf(key);
  if(a !== -1) {
    this._expectedTilesets.splice(a, 1);
    if(this._expectedTilesets.length === 0) {
      this.loadUsedGameObjectAssets();
    }
  }
}

Game_Map.prototype.getTileset = function(uid) {
  for(var a = this.tilesets.length - 1;a >= 0;a--) {
    var ts = this.tilesets[a];
    if(uid >= ts.firstGid) return ts;
  }
  return null;
}

Game_Map.prototype.createLevel = function() {
  this.clear();
  // Apply actions
  for(var a in $dataActions) {
    var action = $dataActions[a];
    if(this.data.properties[action.key]) this.actions[a] = { amount: this.data.properties[action.key] };
  }
  // Apply basic map data
  this.width = this.data.width;
  this.height = this.data.height;
  this.tileWidth = this.data.tilewidth;
  this.tileHeight = this.data.tileheight;
  this.updateCameraBounds();
  this.addBackground();
  // Set initial camera position
  if(this.data.properties.initialCameraPos) {
    if(this.data.properties.initialCameraPos.match(/([0-9]+)[,]([0-9]+)/)) {
      this.camera.setPosition(new Point(
        parseInt(RegExp.$1) * this.tileWidth,
        parseInt(RegExp.$2) * this.tileHeight
      ), new Point(0.5, 0.5));
    }
  }
  // Resize
  while(this.tiles.length < this.width * this.height) {
    this.tiles.push(null);
  }
  // Parse Tile layer(s)
  var arr = this.data.layers.filter(function(layer) { return (layer.name.toUpperCase() === "TILES"); });
  for(var a = 0;a < arr.length;a++) {
    var layer = arr[a];
    this.parseTileLayer(layer, "tiles");
  }
  // Parse Tile Modifier layer(s)
  var arr = this.data.layers.filter(function(layer) { return (layer.name.match(/modifier[s]?[0-9]?/i)); });
  for(var a = 0;a < arr.length;a++) {
    var layer = arr[a];
    this.parseTileLayer(layer, "modifiers");
  }
  // Parse Object layer(s)
  var arr = this.data.layers.filter(function(layer) { return (layer.name.match(/object[s]?/i)); });
  for(var a = 0;a < arr.length;a++) {
    var layer = arr[a];
    this.parseObjectLayer(layer);
  }
  // Create lemming pool
  this.pool.lemming = new Pool("Game_Lemming", this, [], this.totalLemmings);
  // Add grid
  this.addGrid();

  // Dispatch event
  this.onCreate.dispatch();
}

Game_Map.prototype.parseTileLayer = function(layer, type) {
  for(var a = 0;a < layer.data.length;a++) {
    var uid = layer.data[a];
    if(uid > 0) {
      var pos = this.getTilePosition(a);
      if(type === "tiles") this.addTile(pos.x, pos.y, uid, 0);
      else if(type === "modifiers") this.addTileModifier(pos.x, pos.y, uid);
    }
  }
}

Game_Map.prototype.parseObjectLayer = function(layer) {
  for(var a = 0;a < layer.objects.length;a++) {
    var objData = layer.objects[a];
    // Determine flipping
    objData.flip = {
      horizontal: (objData.gid & Game_Map.TILE_FLIPPED_HORIZONTALLY_FLAG),
      vertical: (objData.gid & Game_Map.TILE_FLIPPED_VERTICALLY_FLAG),
      diagonal: (objData.gid & Game_Map.TILE_FLIPPED_DIAGONALLY_FLAG)
    };
    objData.gid &= ~(
      Game_Map.TILE_FLIPPED_HORIZONTALLY_FLAG |
      Game_Map.TILE_FLIPPED_VERTICALLY_FLAG |
      Game_Map.TILE_FLIPPED_DIAGONALLY_FLAG
    );
    // Get data
    var props = this.getObjectProperties(objData);
    if(props) {
      var obj;
      if(props.type === "prop") {
        obj = this.addProp(objData.x, objData.y, props.key, objData);
      }
    }
  }
}

Game_Map.prototype.getObjectProperties = function(objectData) {
  var gid = objectData.gid & ~(
    Game_Map.TILE_FLIPPED_HORIZONTALLY_FLAG |
    Game_Map.TILE_FLIPPED_VERTICALLY_FLAG |
    Game_Map.TILE_FLIPPED_DIAGONALLY_FLAG
  );
  var ts = this.getTileset(gid);
  if(ts) {
    var props = ts.getTileProperties(gid - ts.firstGid);
    if(props) return props;
  }
  return null;
}

Game_Map.prototype.addGrid = function() {
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

Game_Map.prototype.addProp = function(x, y, key, data) {
  // Create object
  var obj = new Game_Prop(key, this);
  obj.map = this;
  obj.x = x;
  obj.y = y;
  this.objects.push(obj);
  // Rotate
  var src = $dataProps[obj.key];
  var origin = new Point(data.width * src.anchor.x, data.height * src.anchor.y);
  var angle = Math.degtorad(data.rotation);
  origin.rotate(angle);
  obj.rotation = angle;
  // Reposition
  obj.x += origin.x;
  obj.y += origin.y;
  // Apply Properties
  if(data.properties) {
    obj.applyProperties(data.properties);
  }
  // Flip
  if(data.flip.horizontal) {
    obj.flipH();
    obj.x += data.width;
  }
  // Add to world
  this.world.addChild(obj.sprite);
}

Game_Map.prototype.addTile = function(x, y, uid, flags, data) {
  if(!data) data = {};
  if(!flags) flags = 0;
  var ts = this.getTileset(uid);
  if(ts) {
    var index = this.getTileIndex(x, y);
    // Add new tile
    var tile = new Game_Tile(ts.getTileTexture(uid - ts.firstGid));
    tile.x = x * this.tileWidth;
    tile.y = y * this.tileHeight;
    this.world.addChild(tile.sprite);
    // Add properties
    var properties = ts.getTileProperties(uid - ts.firstGid);
    if(properties) {
      for(var a in properties) {
        var property = properties[a];
        // Tile Property
        if(a.match(/PROPERTY_([a-zA-Z0-9]+)/i)) {
          tile.assignProperty(RegExp.$1);
        }
        // Tile Collision
        if(a.match(/COLLISION_([a-zA-Z0-9]+)/i)) {
          tile.collisionFunction = Game_Tile["COLLISIONFUNC_" + RegExp.$1.toUpperCase()];
        }
      }
    }
    // Add extra properties
    var extraProperties = ts.getTileExtraProperties(uid - ts.firstGid);
    if(extraProperties) {
      // Add animation
      if(extraProperties.animation) {
        for(var a = 0;a < extraProperties.animation.length;a++) {
          tile.sprite.addAnimationFrame("idle", ts, extraProperties.animation[a].tileid);
        }
        tile.sprite.playAnimation("idle");
      }
    }
    // Remove old tile
    var oldTile = this.tiles.splice(index, 1, tile)[0];
    if(oldTile instanceof Game_Tile) oldTile.sprite.destroy(true);
  }
}

Game_Map.prototype.addTileModifier = function(x, y, uid) {
  var ts = this.getTileset(uid);
  if(ts) {
    var modProperties = ts.getTileProperties(uid - ts.firstGid);
    var extraProperties = ts.getTileExtraProperties(uid - ts.firstGid);
    var index = this.getTileIndex(x, y);
    var tile = this.tiles[index];
    if(tile) {
      // Add modifier property
      if(modProperties.tile_property) tile.assignProperty(modProperties.tile_property);
      // Add modifier sprite
      var spr = new Sprite_Tile();
      spr.z = -50;
      if(extraProperties.animation) {
        for(var a = 0;a < extraProperties.animation.length;a++) {
          var animSrc = extraProperties.animation[a];
          spr.addAnimationFrame("idle", ts, animSrc.tileid);
        }
      }
      else spr.addAnimationFrame("idle", ts, uid - ts.firstGid);
      spr.playAnimation("idle");
      tile.sprite.addChild(spr);
    }
  }
}

Game_Map.prototype.removeTile = function(x, y) {
  var index = this.getTileIndex(x, y);
  var oldTile = this.tiles.splice(index, 1, null)[0];
  if(oldTile instanceof Game_Tile) {
    this.world.removeChild(oldTile.sprite);
    oldTile.sprite.destroy();
    return true;
  }
  return false;
}

Game_Map.prototype.getTileIndex = function(x, y) {
  return x + (y * this.width);
}

Game_Map.prototype.getTilePosition = function(index) {
  return new Point(
    Math.floor(index % this.width),
    Math.floor(index / this.width)
  );
}

Game_Map.prototype.getTile = function(realX, realY) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return null;
  return this.tiles[this.getTileIndex(realX >> 4, realY >> 4)];
}

Game_Map.prototype.setStage = function(stage) {
  stage.addChild(this.world);
}

Game_Map.prototype.update = function() {
  // Update objects
  var arr = this.objects.slice().filter(function(obj) { return obj.exists; } );
  for(var a = 0;a < arr.length;a++) {
    var o = arr[a];
    o.update();
  }
  // Update tiles
  for(var a = 0;a < this.tiles.length;a++) {
    var tile = this.tiles[a];
    if(tile) tile.update();
  }
  this.world.zOrder();
  this.updateCameraBounds();
  // Track victory/defeat
  if(this.trackVictoryDefeat) {
    var end = true;
    if(this.getLemmings().length > 0) end = false;
    var arr = this.getDoors();
    for(var a = 0;a < arr.length && end;a++) {
      var obj = arr[a];
      if(obj.value > 0) end = false;
    }
    if(end) {
      this.trackVictoryDefeat = false;
      this.onEndOfMap.dispatch();
    }
  }
}

Game_Map.prototype.updateCamera = function() {
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

Game_Map.prototype.getLemmings = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Lemming && obj.exists);
  });
}

Game_Map.prototype.getDoors = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Prop && obj.type === "door" && obj.exists);
  });
}

Game_Map.prototype.getExits = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Prop && obj.type === "exit" && obj.exists);
  });
}

Game_Map.prototype.startMusic = function() {
  AudioManager.playBgm("music");
}

Game_Map.prototype.tileCollision = function(realX, realY, lem) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return Game_Tile.COLLISION_ENDOFMAP;
  var tile = this.getTile(realX, realY);
  if(tile) return tile.collisionFunction.call(lem, realX, realY);
  return Game_Tile.COLLISIONFUNC_AIR.call(lem, realX, realY);
}

Game_Map.prototype.tileHasBlocker = function(realX, realY) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return false;
  var r = new Rect((realX >> 4) << 4, (realY >> 4) << 4, this.tileWidth, this.tileHeight);
  var arr = this.getLemmings().slice().filter(function(lemming) { return lemming.action.current === Game_Lemming.ACTION_BLOCKER; } );
  for(var a = 0;a < arr.length;a++) {
    var lemming = arr[a];
    if(r.contains(lemming.x, lemming.y)) return true;
  }
  return false;
}

Game_Map.prototype.toScreenSpace = function(mapX, mapY) {
  return new Point(
    (mapX - this.camera.rect.left) * this.world.scale.x,
    (mapY - this.camera.rect.top) * this.world.scale.y
  );
}

Game_Map.prototype.replaceTile = function(x, y, tile) {
  var index = this.getTileIndex(x, y);
  if(index >= 0 && index < this.tiles.length) {
    var oldTile = this.tiles.splice(index, 1, tile)[0];
    if(oldTile) oldTile.sprite.destroy(true);
    tile.x = x * this.tileWidth;
    tile.y = y * this.tileHeight;
    this.world.addChild(tile.sprite);
  }
}

Game_Map.prototype.toWorldSpace = function(screenX, screenY) {
  return new Point(
    (screenX / this.world.scale.x) + this.camera.rect.left,
    (screenY / this.world.scale.y) + this.camera.rect.top
  );
}

Game_Map.prototype.addBackground = function() {
  if(Cache.hasImage("background")) {
    // Get Parallax and Tile properties
    var parallax = new Point(0.5, 0.5);
    var tile = { x: true, y: true };
    if(this.data.properties) {
      parallax.x = typeof this.data.properties.parallaxX === "number" ? this.data.properties.parallaxX : 0.5;
      parallax.y = typeof this.data.properties.parallaxY === "number" ? this.data.properties.parallaxY : 0.5;
      tile.x = typeof this.data.properties.tileX === "boolean" ? this.data.properties.tileX : true;
      tile.y = typeof this.data.properties.tileY === "boolean" ? this.data.properties.tileY : true;
    }
    // Create background
    this.background = new Background("background", this.realWidth, this.realHeight, tile, parallax);
    this.world.addChild(this.background);
  }
}

Game_Map.prototype.destroy = function() {
  this.clearLevelAssets();
  Cache.removeJSON("map");
}

Game_Map.prototype.clearLevelAssets = function() {
  while(this._usedAssets.length > 0) {
    var asset = this._usedAssets.pop();
    switch(asset.type) {
      case "json":
        Cache.removeJSON(asset.key);
        break;
      case "audio":
        Cache.removeAudio(asset.key);
        break;
      case "image":
        Cache.removeImage(asset.key);
        break;
      case "textureAtlas":
        Cache.removeTextureAtlas(asset.key);
        break;
      default:
        console.log("Failed to remove asset: " + asset.key);
        break;
    }
  }
}

function Game_Tileset() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Game_Tileset.prototype, {
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

Game_Tileset.prototype.init = function() {
  this.texture = null;
  this.firstGid = 1;
  this.margin = 2;
  this.spacing = 4;
  this.tileWidth = 16;
  this.tileHeight = 16;
  this.tileProperties = null;
}

Game_Tileset.prototype.getCrop = function(index) {
  return new Rect(
    this.margin + (this.tileWidth + this.spacing) * (index % this.width),
    this.margin + (this.tileHeight + this.spacing) * Math.floor(index / this.width),
    this.tileWidth,
    this.tileHeight
  );
}

Game_Tileset.prototype.getTileTexture = function(index) {
  var tex = this.texture.clone();
  tex.frame = this.getCrop(index);
  return tex;
}

Game_Tileset.prototype.getTileProperties = function(index) {
  if(this.tileProperties && this.tileProperties[index.toString()]) return this.tileProperties[index.toString()];
  return null;
}

Game_Tileset.prototype.getTileExtraProperties = function(index) {
  if(this.tiles && this.tiles[index.toString()]) return this.tiles[index.toString()];
  return null;
}

function Game_Tile() {
  this.init.apply(this, arguments);
}

Game_Tile.COLLISION_PASSABLE   = 0;
Game_Tile.COLLISION_IMPASSABLE = 1;
Game_Tile.COLLISION_ENDOFMAP   = 2;
Game_Tile.COLLISION_LIQUID     = 3;

Game_Tile.COLLISIONFUNC_AIR = function(realX, realY) {
  return Game_Tile.COLLISION_PASSABLE;
}
Game_Tile.COLLISIONFUNC_GROUND = function(realX, realY) {
  return Game_Tile.COLLISION_IMPASSABLE;
}
Game_Tile.COLLISIONFUNC_LIQUID = function(realX, realY) {
  return Game_Tile.COLLISION_LIQUID;
}

Game_Tile.PROPERTY_STEEL       = Math.pow(2, 0);
Game_Tile.PROPERTY_DIG_NOLEFT  = Math.pow(2, 1);
Game_Tile.PROPERTY_DIG_NORIGHT = Math.pow(2, 2);
Game_Tile.PROPERTY_DIG_NODOWN  = Math.pow(2, 3);
Game_Tile.PROPERTY_DIG_NOUP    = Math.pow(2, 4);

Object.defineProperties(Game_Tile.prototype, {
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

Game_Tile.prototype.init = function(texture) {
  this.sprite = new Sprite_Tile(texture);
  this.position = new Point();
  this.collisionFunction = Game_Tile.COLLISIONFUNC_GROUND;
  this.property = 0;
}

Game_Tile.prototype.assignProperty = function(name) {
  this.property = this.property | Game_Tile["PROPERTY_" + name.toUpperCase()];
}

Game_Tile.prototype.hasProperty = function(name) {
  return ((this.property & Game_Tile["PROPERTY_" + name.toUpperCase()]) === Game_Tile["PROPERTY_" + name.toUpperCase()]);
}

Game_Tile.prototype.removeProperty = function(name) {
  this.property = this.property & ~(Game_Tile["PROPERTY_" + name.toUpperCase()]);
}

Game_Tile.prototype.update = function() {
  this.sprite.update();
}

function Game_World() {
  this.init.apply(this, arguments);
}

Game_World.prototype = Object.create(PIXI.Container.prototype);
Game_World.prototype.constructor = Game_World;

Game_World.prototype.init = function() {
  PIXI.Container.prototype.constructor.call(this);
  this.z = 150;
}

Game_World.prototype.zOrder = function() {
  this.children.sort(function(a, b) {
    return b.z - a.z;
  });
}

function Game_Camera() {
  this.init.apply(this, arguments);
}

Game_Camera.prototype.init = function(map) {
  this.baseRect = new Rect(0, 0, 640, 360);
  this.rect = new Rect(this.baseRect.x, this.baseRect.y, this.baseRect.width, this.baseRect.height);
  this.map = map;
  this.bounds = new Rect(0, 0, this.map.realWidth, this.map.realHeight);
}

Game_Camera.prototype.update = function() {
  this.map.world.scale.x = Core.resolution.x / this.rect.width;
  this.map.world.scale.y = Core.resolution.y / this.rect.height;
  this.map.world.position.x = -(this.rect.x * this.map.world.scale.x);
  this.map.world.position.y = -(this.rect.y * this.map.world.scale.y);
}

Game_Camera.prototype.setPosition = function(position, anchor) {
  // Gather data
  var oldPos = new Point(this.rect.x, this.rect.y);
  var mapPos = new Point(
    Math.max(this.bounds.x, Math.min(this.bounds.right - this.rect.width, position.x - (this.rect.width * anchor.x))),
    Math.max(this.bounds.y, Math.min(this.bounds.bottom - this.rect.height, position.y - (this.rect.height * anchor.y)))
  );
  // Move
  this.rect.x = mapPos.x;
  this.rect.y = mapPos.y;
  // Update background
  if(this.map.background) this.map.background.refresh();
  // Return data
  var diff = new Point(oldPos.x - this.rect.x, oldPos.y - this.rect.y);
  return diff;
}

Game_Camera.prototype.move = function(x, y) {
  return this.setPosition(new Point(this.rect.x + x, this.rect.y + y), new Point(0, 0));
}

Game_Camera.prototype.contains = function(spr) {
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
    },
    configurable: true
  },
  x: {
    get: function() { return this._x; },
    set: function(value) {
      this._x = value;
      if(this.sprite) this.sprite.x = value;
    },
    configurable: true
  },
  y: {
    get: function() { return this._y; },
    set: function(value) {
      this._y = value;
      if(this.sprite) this.sprite.y = value;
    },
    configurable: true
  },
  rotation: {
    get: function() { return this._rotation; },
    set: function(value) {
      this._rotation = value;
      if(this.sprite) this.sprite.rotation = value;
    },
    configurable: true
  }
});

Game_Base.prototype.init = function() {
  this._exists = true;
  this._x = 0;
  this._y = 0;
  this._rotation = 0;
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

Object.defineProperties(Game_Lemming.prototype, {
  rotation: {
    get: function() { return Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").get.call(this); },
    set: function(value) {
      var old = this._rotation;
      Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").set.call(this, value);
      this._rotation = value;
      for(var a in this.offsetPoint) {
        this.offsetPoint[a].rotate(value - old);
      }
      for(var a in this.offsetRect) {
        this.offsetRect[a].rotate(value - old);
      }
    },
    configurable: true
  }
});

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

Game_Lemming.DIGSUCCESS_AIR    = 0;
Game_Lemming.DIGSUCCESS_NORMAL = 1;
Game_Lemming.DIGSUCCESS_STEEL  = 2;

Game_Lemming.COLOR_HAIR1 = 0x00b000;
Game_Lemming.COLOR_HAIR2 = 0x057000;
Game_Lemming.COLOR_BODY1 = 0x5f60ff;
Game_Lemming.COLOR_BODY2 = 0x2025ff;


Game_Lemming.prototype.init = function() {
  Game_Base.prototype.init.call(this);
  this.sprite           = new Sprite_Lemming();
  this.velocity         = new Point();
  this.rotation         = 0;
  this.dir              = Game_Lemming.DIR_RIGHT;
  this.property         = 0;
  this.action           = { current: Game_Lemming.ACTION_FALL };
  this.requestAnimation = "fall";
  this.fallDistance     = 0;
  this.onGround         = false;
  this.dead             = false;
  this.interactive      = true;
  this.physicsEnabled   = true;
  this.disabled         = false;

  this.offsetPoint = {
    floor: new Point(0, 1),
    ceiling: new Point(0, -17),
    moveOutOfGround: new Point(0, -1),
    slopeCheck: new Point(0, -16),
    fallSpeed: new Point(0, 1),
    walkSpeed: new Point(0.5, 0),
    climbSpeed: new Point(0, -0.25),
    floatSpeed: new Point(0, 0.5),
    right: new Point(1, 0),
    down: new Point(0, 1)
  };

  this.offsetRect = {
    blockRect: new Rect(-6, -12, 12, 13),
    clickArea: new Rect(-8, -16, 16, 16)
  };

  this.bomber = { count: -1, label: new Text() };
  this.bomber.label.style.fontSize = 10;
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
  this.initTriggers();
  this.initFilters();
}

Game_Lemming.prototype.spawn = function(x, y) {
  Game_Base.prototype.spawn.call(this, x, y);
  this.dir                  = Game_Lemming.DIR_RIGHT;
  this.rotation             = 0;
  this.sprite.scale.x       = 1;
  this.sprite.playAnimation("fall");
  this.property             = 0;
  this.onGround             = false;
  this.stopAction();
  this.fallDistance         = 0;
  this.dead                 = false;
  this.interactive          = true;
  this.physicsEnabled       = true;
  this.disabled             = false;
  this.bomber.label.visible = false;
  this.bomber.count = -1;
}

Game_Lemming.prototype.initTriggers = function() {
  this.sprite.animations["fall-death"].onEnd.add(this.remove, this);
  this.sprite.animations["explode"].onEnd.add(this.explode, this);
  this.sprite.animations["float-start"].onEnd.add(this._floatEndAnim, this);
  this.sprite.animations["exit"].onEnd.add(function() {
    this.map.saved++;
    this.exists = false;
  }, this);
  this.sprite.animations["explosion"].onEnd.add(this.remove, this);
  this.sprite.animations["burn"].onEnd.add(this.remove, this);
  this.sprite.animations["drown"].onEnd.add(this.remove, this);
  this.sprite.animations["build-end"].onEnd.add(this._buildEnd, this);
  this.sprite.animations["climb-end"].onEnd.add(this._climbEndAnim, this);
}

Game_Lemming.prototype.initFilters = function() {
  this.sprite.filters = [];
  this.filters = {
    bodyColor: [],
    hairColor: []
  };
}

Game_Lemming.prototype.addFilter = function(filter) {
  var arr = this.sprite.filters.slice();
  arr.push(filter);
  this.sprite.filters = arr;
}

Game_Lemming.prototype.setHairColor_Default = function() {
  var arr = this.sprite.filters.slice();
  while(this.filters.hairColor.length > 0) {
    var filter = this.filters.hairColor.pop();
    var index = arr.indexOf(filter);
    if(index !== -1) arr.splice(index, 1);
  }
  this.sprite.filters = arr;
}

Game_Lemming.prototype.setHairColor = function(c1, c2) {
  this.setHairColor_Default();
  // Color 1
  var filter = new Filter_ColorReplace(Game_Lemming.COLOR_HAIR1, c1);
  this.filters.hairColor.push(filter);
  this.addFilter(filter);
  // Color 2
  var filter = new Filter_ColorReplace(Game_Lemming.COLOR_HAIR2, c2);
  this.filters.hairColor.push(filter);
  this.addFilter(filter);
}

Game_Lemming.prototype.setBodyColor_Default = function() {
  var arr = this.sprite.filters.slice();
  while(this.filters.bodyColor.length > 0) {
    var filter = this.filters.bodyColor.pop();
    var index = arr.indexOf(filter);
    if(index !== -1) arr.splice(index, 1);
  }
  this.sprite.filters = arr;
}

Game_Lemming.prototype.setBodyColor = function(c1, c2) {
  this.setBodyColor_Default();
  // Color 1
  var filter = new Filter_ColorReplace(Game_Lemming.COLOR_BODY1, c1);
  this.filters.bodyColor.push(filter);
  this.addFilter(filter);
  // Color 2
  var filter = new Filter_ColorReplace(Game_Lemming.COLOR_BODY2, c2);
  this.filters.bodyColor.push(filter);
  this.addFilter(filter);
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
  // this.shaderCount += 0.01;
  // this.shader.uniforms.time = this.shaderCount;
  // Do physics
  if(this.physicsEnabled) {
    if(!this.dead) this.preMove();
    if(!this.dead) this.move();
    if(!this.dead) this.postMove();
  }
  // Evals
  this.bomber.label.scale.x = 1 / this.sprite.scale.x;
  // Play animation
  this.sprite.playAnimation(this.requestAnimation);
}

Game_Lemming.prototype.preMove = function() {
  var defaultAction = true;
  if(this.action.current === Game_Lemming.ACTION_CLIMBER) {
    defaultAction = false;
  }
  if(defaultAction) {
    // Check for ground
    var col = this.map.tileCollision(this.x + this.offsetPoint.floor.x, this.y + this.offsetPoint.floor.y, this);
    if(col === Game_Tile.COLLISION_PASSABLE) {
      this.onGround = false;
      if(!this.dead) this.fall();
    }
    else if(col === Game_Tile.COLLISION_IMPASSABLE) {
      if(!this.onGround) {
        if(this.offsetPoint.down.x > 0) this.x = (((this.x + this.offsetPoint.floor.x) >> 4) << 4) + this.offsetPoint.moveOutOfGround.x;
        else if(this.offsetPoint.down.x < 0) this.x = (((this.x + 16 + this.offsetPoint.floor.x) >> 4) << 4);
        if(this.offsetPoint.down.y > 0) this.y = (((this.y + this.offsetPoint.floor.y) >> 4) << 4) + this.offsetPoint.moveOutOfGround.y;
        else if(this.offsetPoint.down.y < 0) this.y = (((this.y + 16 + this.offsetPoint.floor.y) >> 4) << 4);
      }
      this.onGround = true;
      this.checkFallDeath();
      if(!this.dead) this.walk();
    }
  }
}

Game_Lemming.prototype.move = function() {
  var defaultAction = true;
  // Check for special tiles
  var col = this.map.tileCollision(this.x, this.y, this);
  if(col === Game_Tile.COLLISION_ENDOFMAP) {
    this.die(Game_Lemming.DEATH_ENDOFMAP);
  }
  else if(col === Game_Tile.COLLISION_LIQUID) {
    this.disable();
    this.requestAnimation = "drown";
    AudioManager.playSound("sndDrown");
  }
  // Evals
  if(this.action.current === Game_Lemming.ACTION_CLIMBER) {
    defaultAction = false;
    // Check for ceiling
    if(this.map.tileCollision(this.x + this.offsetPoint.ceiling.x, this.y + this.offsetPoint.ceiling.y, this) === Game_Tile.COLLISION_IMPASSABLE) {
      this.fall();
      this.changeDirection();
      defaultAction = true;
    }
    // Check for ledge
    else if(this.map.tileCollision(this.x + (this.offsetPoint.right.x * this.dir) - (this.offsetPoint.down.x * 8),
      this.y + (this.offsetPoint.right.y * this.dir) - (this.offsetPoint.down.y * 8), this) !== Game_Tile.COLLISION_IMPASSABLE) {
      this.velocity.set(0);
      this.requestAnimation = 'climb-end';
    }
    else {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
  }
  // Default move
  if(defaultAction) {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
  // Update fall time
  if(this.action.current === Game_Lemming.ACTION_FALL) {
    this.fallDistance += Math.abs(this.velocity.y);
    this.fallDistance += Math.abs(this.velocity.x);
  }
  else this.fallDistance = 0;
}

Game_Lemming.prototype.postMove = function() {
  // React to ground
  if(this.map.tileCollision(this.x, this.y, this) === Game_Tile.COLLISION_IMPASSABLE) {
    // Slope check
    if(this.map.tileCollision(this.x + this.offsetPoint.slopeCheck.x, this.y + this.offsetPoint.slopeCheck.y) === Game_Tile.COLLISION_PASSABLE &&
      !this.map.tileHasBlocker(this.x + this.offsetPoint.slopeCheck.x, this.y + this.offsetPoint.slopeCheck.y)) {
      var defaultAction = true;
      // Evals
      if(this.action.current === Game_Lemming.ACTION_CLIMBER) defaultAction = false;
      // Align to slope
      if(defaultAction) {
        this.x += this.offsetPoint.slopeCheck.x;
        this.y += this.offsetPoint.slopeCheck.y;
      }
    }
    else {
      var defaultAction = true;
      // Evals
      if(this.hasProperty("CLIMBER") && this.onGround) {
        defaultAction = false;
        if(this.action.current !== Game_Lemming.ACTION_CLIMBER) {
          this.action.current = Game_Lemming.ACTION_CLIMBER;
          this.requestAnimation = "climb";
          if(this.offsetPoint.right.x > 0) this.x = (((this.x + (this.dir === Game_Lemming.DIR_LEFT ? 16 : 0)) >> 4) << 4) - (this.dir === Game_Lemming.DIR_RIGHT ? this.offsetPoint.right.x : 0);
          else if(this.offsetPoint.right.x < 0) this.x = (((this.x + (this.dir === Game_Lemming.DIR_RIGHT ? 16 : 0)) >> 4) << 4) + (this.dir === Game_Lemming.DIR_LEFT ? this.offsetPoint.right.x : 0);
          if(this.offsetPoint.right.y > 0) this.y = (((this.y + (this.dir === Game_Lemming.DIR_LEFT ? 16 : 0)) >> 4) << 4) - (this.dir === Game_Lemming.DIR_RIGHT ? this.offsetPoint.right.y : 0);
          else if(this.offsetPoint.right.y < 0) this.y = (((this.y + (this.dir === Game_Lemming.DIR_RIGHT ? 16 : 0)) >> 4) << 4) + (this.dir === Game_Lemming.DIR_LEFT ? this.offsetPoint.right.y : 0);
          this.velocity.x = this.offsetPoint.climbSpeed.x;
          this.velocity.y = this.offsetPoint.climbSpeed.y;
        }
      }
      // Turn around
      if(defaultAction) {
        this.x -= this.velocity.x;
        this.y -= this.velocity.y;
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
    this.velocity.x = this.offsetPoint.floatSpeed.x;
    this.velocity.y = this.offsetPoint.floatSpeed.y;
  }
  // Default action
  if(defaultAction) {
    this.action.current   = Game_Lemming.ACTION_FALL;
    this.requestAnimation = "fall";
    this.velocity.x       = this.offsetPoint.fallSpeed.x;
    this.velocity.y       = this.offsetPoint.fallSpeed.y;
  }
}

Game_Lemming.prototype.walk = function() {
  var defaultAction = true;
  // Evals
  if(this.action.current === Game_Lemming.ACTION_CLIMBER) defaultAction = false;
  else if(this.action.current === Game_Lemming.ACTION_BOMBER) {
    defaultAction = false;
    this.velocity.set(0);
  }
  if(this.action.current === Game_Lemming.ACTION_BLOCKER) {
    defaultAction = false;
    this.velocity.set(0);
  }
  else if(this.onGround) {
    var arr = this.map.getLemmings();
    for(var a = 0;a < arr.length;a++) {
      var lemming = arr[a];
      if(lemming !== this && lemming.action.current === Game_Lemming.ACTION_BLOCKER &&
        !lemming.offsetRect.blockRect.contains(this.x - lemming.x, this.y - lemming.y) && lemming.offsetRect.blockRect.contains((this.x + this.velocity.x) - lemming.x, (this.y + this.velocity.y) - lemming.y)) {
        this.changeDirection(); break;
      }
    }
  }
  if(this.action.current === Game_Lemming.ACTION_BUILDER || this.action.current === Game_Lemming.ACTION_BASHER ||
    this.action.current === Game_Lemming.ACTION_MINER || this.action.current === Game_Lemming.ACTION_DIGGER) {
    defaultAction = false;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }
  // Default action
  if(defaultAction) {
    this.action.current   = Game_Lemming.ACTION_WALK;
    this.requestAnimation = "walk";
    this.velocity.x       = this.offsetPoint.walkSpeed.x * this.dir;
    this.velocity.y       = this.offsetPoint.walkSpeed.y * this.dir;
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
  if(Input.mouse.position.world.x >= this.x + this.offsetRect.clickArea.x && Input.mouse.position.world.x < this.x + this.offsetRect.clickArea.width &&
    Input.mouse.position.world.y >= this.y + this.offsetRect.clickArea.y && Input.mouse.position.world.y < this.y + this.offsetRect.clickArea.height) return true;
  return false;
}

Game_Lemming.prototype.build = function(offsetX, offsetY) {
  var xTo = (this.x + offsetX) >> 4;
  var yTo = (this.y + offsetY) >> 4;
  var oldTile = this.map.getTile(xTo << 4, yTo << 4);
  if(oldTile === null) {
    var tile = new Game_Tile(Core.tileset.generic.getTileTexture(0));
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
    this.nuke();
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
    this.alarms.action.baseTime = 150;
    this.alarms.action.start();
    this.action.builder.value = 5;
    return true;
  }
  else if(actionName === "BASHER") {
    this.action.current = Game_Lemming.ACTION_BASHER;
    this.requestAnimation = "bash";
    this.alarms.action.baseTime = 90;
    this.alarms.action.start();
    return true;
  }
  else if(actionName === "MINER") {
    this.action.current = Game_Lemming.ACTION_MINER;
    this.requestAnimation = "mine";
    this.alarms.action.baseTime = 150;
    this.alarms.action.start();
    return true;
  }
  else if(actionName === "DIGGER") {
    this.action.current = Game_Lemming.ACTION_DIGGER;
    this.requestAnimation = "dig";
    this.alarms.action.baseTime = 90;
    this.alarms.action.start();
    return true;
  }
  // Was not able to assign action
  return false;
}

Game_Lemming.prototype.nuke = function() {
  this.bomber.count = 5;
  this.bomber.label.text = this.bomber.count.toString();
  this.bomber.label.visible = true;
  this.alarms.bomber.time = this.alarms.bomber.baseTime;
}

Game_Lemming.prototype.explode = function() {
  this.disable();
  this.alarms.bomber.stop();
  this.bomber.label.visible = false;
  this.interactive = false;
  AudioManager.playSound("sndLemmingExplode");
  var digPoints = [];
  for(var a = -1;a < 2;a++) {
    for(var b = -1;b < 2;b++) {
      digPoints.push(new Point(a * this.map.tileWidth, b * this.map.tileHeight));
    }
  }
  for(var a = 0;a < digPoints.length;a++) {
    var pt = digPoints[a];
    var tile = this.map.getTile(this.x + pt.x, this.y + pt.y);
    if(tile && !tile.hasProperty("STEEL")) {
      this.map.removeTile((this.x + pt.x) >> 4, (this.y + pt.y) >> 4);
    }
  }
  this.requestAnimation = "explosion";
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
  this.x += (this.offsetPoint.right.x * this.dir) - (this.offsetPoint.down.x * 8);
  this.y += (this.offsetPoint.right.y * this.dir) - (this.offsetPoint.down.y * 8);
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
    AudioManager.playSound("sndOhNo");
    this.action.current = Game_Lemming.ACTION_BOMBER;
    this.disable();
    this.requestAnimation = "explode";
  }
}

Game_Lemming.prototype.cancelBomber = function() {
  this.alarms.bomber.stop();
  this.bomber.label.visible = false;
}

Game_Lemming.prototype._actionTimer = function() {
  if(this.action.current === Game_Lemming.ACTION_BUILDER) this._buildUpdate();
  else if(this.action.current === Game_Lemming.ACTION_BASHER) this._bashUpdate();
  else if(this.action.current === Game_Lemming.ACTION_MINER) this._mineUpdate();
  else if(this.action.current === Game_Lemming.ACTION_DIGGER) this._digUpdate();
}

Game_Lemming.prototype._buildUpdate = function() {
  var blockedRight = (this.map.tileCollision(this.x + (16 * this.dir), this.y, this) === Game_Tile.COLLISION_IMPASSABLE);
  var blockedTopRight = (this.map.tileCollision(this.x + (16 * this.dir), this.y - 16, this) === Game_Tile.COLLISION_IMPASSABLE);
  if(blockedRight || blockedTopRight) {
    this.changeDirection();
    this.alarms.action.stop();
    this._buildEnd();
  }
  else {
    if(this.map.tileHasBlocker(this.x + ((this.offsetPoint.right.x * 16) * this.dir), this.y + ((this.offsetPoint.right.y * 16) * this.dir)) ||
      this.map.tileHasBlocker(this.x + ((this.offsetPoint.right.x * 16) * this.dir) - (this.offsetPoint.down.x * 16),
      this.y + ((this.offsetPoint.right.y * 16) * this.dir) - (this.offsetPoint.down.y * 16))) {
      this.changeDirection();
    }
    this.build((this.offsetPoint.right.x * 16 * this.dir), (this.offsetPoint.right.y * 16 * this.dir), true);
    this.x = (Math.floor(this.x / 16) + this.dir) * 16 + 8;
    this.y += (this.offsetPoint.right.y * 16 * this.dir) - (this.offsetPoint.down.y * 16);
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
  var success = this.dig([new Point(this.offsetPoint.right.x * 16 * this.dir, this.offsetPoint.right.y * 16 * this.dir)],
    new Point(this.offsetPoint.right.x * 16 * this.dir, this.offsetPoint.right.y * 16 * this.dir),
    [this.dir === Game_Lemming.DIR_RIGHT ? "right" : "left"]);
  if(success !== Game_Lemming.DIGSUCCESS_NORMAL) this.stopAction();
}

Game_Lemming.prototype._mineUpdate = function() {
  var success = this.dig([
    new Point(this.offsetPoint.right.x * 16 * this.dir, this.offsetPoint.right.y * 16 * this.dir),
    new Point((this.offsetPoint.right.x * 16 * this.dir) + (this.offsetPoint.down.x * 16), (this.offsetPoint.right.y * 16 * this.dir) + (this.offsetPoint.down.y * 16))
  ], new Point((this.offsetPoint.right.x * 16 * this.dir) + (this.offsetPoint.down.x * 16), (this.offsetPoint.right.y * 16 * this.dir) + (this.offsetPoint.down.y * 16)),
  ["down", this.dir === Game_Lemming.DIR_RIGHT ? "right" : "left"]);
  if(success === Game_Lemming.DIGSUCCESS_STEEL) this.stopAction();
}

Game_Lemming.prototype._digUpdate = function() {
  var success = this.dig([new Point(this.offsetPoint.down.x * 16, this.offsetPoint.down.y * 16)], new Point(this.offsetPoint.down.x * 16, this.offsetPoint.down.y * 16), ["down"]);
  if(success !== Game_Lemming.DIGSUCCESS_NORMAL) this.stopAction();
}

Game_Lemming.prototype.dig = function(targetPoints, adjustMovement, dirs) {
  if(!adjustMovement) adjustMovement = new Point(0, 0);
  var success = Game_Lemming.DIGSUCCESS_NORMAL;
  var airTiles = 0;
  // Check for blockers
  var blocked = false;
  for(var a = 0;a < targetPoints.length && !blocked;a++) {
    var pt = targetPoints[a];
    blocked = this.map.tileHasBlocker(this.x + pt.x, this.y + pt.y);
  }
  if(blocked) {
    this.changeDirection();
    adjustMovement.x = -adjustMovement.x;
    for(var a = 0;a < targetPoints.length;a++) {
      var pt = targetPoints[a];
      pt.x = -pt.x;
    }
  }
  // Remove tile(s)
  for(var a = 0;a < targetPoints.length;a++) {
    var target  = targetPoints[a];
    var tile    = this.map.getTile(this.x + target.x, this.y + target.y);
    var col     = this.map.tileCollision(this.x + target.x, this.y + target.y);
    // Hit steel
    if(tile && col === Game_Tile.COLLISION_IMPASSABLE) {
      if(tile.hasProperty("STEEL") ||
      (dirs.indexOf("right") !== -1 && tile.hasProperty("DIG_NORIGHT")) ||
      (dirs.indexOf("left") !== -1 && tile.hasProperty("DIG_NOLEFT")) ||
      (dirs.indexOf("down") !== -1 && tile.hasProperty("DIG_NODOWN")) ||
      (dirs.indexOf("up") !== -1 && tile.hasProperty("DIG_NOUP"))
    ) {
        success = Game_Lemming.DIGSUCCESS_STEEL;
        AudioManager.playSound("sndChink");
      }
      else this.map.removeTile((this.x + target.x) >> 4, (this.y + target.y) >> 4);
    }
    // Hit air
    else {
      airTiles++;
    }
  }
  if(airTiles === targetPoints.length && success === Game_Lemming.DIGSUCCESS_NORMAL) success = false;
  // Move in place
  if(success !== Game_Lemming.DIGSUCCESS_STEEL) {
    this.x += adjustMovement.x;
    this.y += adjustMovement.y;
  }
  return success;
}

Game_Lemming.prototype.exit = function() {
  this.requestAnimation = "exit";
  this.disable();
}

Game_Lemming.prototype.canExit = function() {
  if(this.dead) return false;
  if(this.disabled) return false;
  if(!this.physicsEnabled) return false;
  if(this.sprite.isAnimationPlaying("explode")) return false;
  if(!this.onGround) return false;
  return true;
}

Game_Lemming.prototype.disable = function() {
  this.cancelBomber();
  this.disabled = true;
  this.interactive = false;
  this.physicsEnabled = false;
}

function Game_Prop() {
  this.init.apply(this, arguments);
}

Game_Prop.prototype = Object.create(Game_Base.prototype);
Game_Prop.prototype.constructor = Game_Prop;

Object.defineProperties(Game_Prop.prototype, {
  rotation: {
    get: function() { return Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").get.call(this); },
    set: function(value) {
      var old = this._rotation;
      Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").set.call(this, value);
      this._rotation = value;
      for(var a in this.offsetPoint) {
        this.offsetPoint[a].rotate(value - old);
      }
      for(var a in this.offsetRect) {
        this.offsetRect[a].rotate(value - old);
      }
    },
    configurable: true
  }
});

Game_Prop.prototype.init = function(key, map) {
  Game_Base.prototype.init.call(this);
  this.key = key;
  this.map = map;
  this.src = null;
  this.offsetPoint = {};
  this.offsetRect = {};
  this.sprite = new Sprite_Prop();
  this.type = undefined;
  this.applySource();
}

Game_Prop.prototype.applySource = function() {
  this.src = $dataProps[this.key];
  this.type = this.src.type;
  // Initialize animations
  var baseTextureKey = Loader.determineKey(this.src.assets.textureAtlases.base);
  for(var a in this.src.animations) {
    var animSrc = this.src.animations[a];
    var anim = this.sprite.addAnimation(a);
    for(var b = 0;b < animSrc.length;b++) {
      anim.addFrame(baseTextureKey, animSrc[b]);
    }
  }
  // Initialize sounds
  this.sounds = {};
  for(var a in this.src.assets.audio) {
    this.sounds[a] = Loader.determineKey(this.src.assets.audio[a]);
  }

  // TYPE: Door
  if(this.type === "door") {
    this.rate = 50;
    this.value = 0;
    this.sprite.playAnimation("closed");
    this.alarms.door = new Alarm();
    this.offsetPoint.drop = new Point(this.src.dropOffset.x, this.src.dropOffset.y);
  }
  // TYPE: Exit
  else if(this.type === "exit") {
    this.sprite.playAnimation("idle");
    this.offsetRect.hitArea = new Rect(this.src.hitArea.x, this.src.hitArea.y, this.src.hitArea.width, this.src.hitArea.height);
  }
  // TYPE: Trap
  else if(this.type === "trap") {
    this.sprite.playAnimation("idle");
    this.offsetRect.hitArea = new Rect(this.src.hitArea.x, this.src.hitArea.y, this.src.hitArea.width, this.src.hitArea.height);
    if(this.sprite.hasAnimation("kill")) {
      this.sprite.getAnimation("kill").onEnd.add(function() {
        this.sprite.playAnimation("idle");
      }, this);
    }
  }
}

Game_Prop.prototype.applyProperties = function(props) {
  // TYPE: Door
  if(this.type === "door") {
    if(props.value) {
      this.map.totalLemmings += props.value;
      this.value = props.value;
    }
    if(props.rate) this.rate = props.rate;
  }
  // TYPE: Exit
  else if(this.type === "exit") {}
  // TYPE: Trap
  else if(this.type === "trap") {}
}

Game_Prop.prototype.update = function() {
  Game_Base.prototype.update.call(this);
  // TYPE: Exit
  if(this.type === "exit") {
    var arr = this.map.getLemmings();
    for(var a = 0;a < arr.length;a++) {
      var lemming = arr[a];
      if(this.offsetRect.hitArea.contains(lemming.x - this.x, lemming.y - this.y) && (lemming.rotation % (Math.PI * 2)) === (this.rotation % (Math.PI * 2)) && lemming.canExit()) {
        // Lemming exit
        if(this.sounds.exit) AudioManager.playSound(this.sounds.exit);
        lemming.exit();
      }
    }
  }
  // TYPE: Trap
  else if(this.type === "trap" && !this.sprite.isAnimationPlaying("kill")) {
    var arr = this.map.getLemmings();
    for(var a = 0;a < arr.length;a++) {
      var lemming = arr[a];
      if(this.offsetRect.hitArea.contains(lemming.x - this.x, lemming.y - this.y) && !lemming.disabled) {
        // Kill lemming
        if(this.sounds.kill) AudioManager.playSound(this.sounds.kill);
        // Animation
        if(this.src.deathAnimation) {
          lemming.disable();
          lemming.requestAnimation = this.src.deathAnimation;
        }
        else if(this.sprite.hasAnimation("kill")) {
          lemming.exists = false;
          this.sprite.playAnimation("kill");
        }
      }
    }
  }
}

Game_Prop.prototype.flipH = function() {
  this.sprite.scale.x = -this.sprite.scale.x;
  if(this.offsetRect.hitArea) {
    this.offsetRect.hitArea.x = -(this.offsetRect.hitArea.x + this.offsetRect.hitArea.width);
  }
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
    var lemming = this.map.pool.lemming.spawn(this.x + this.offsetPoint.drop.x, this.y + this.offsetPoint.drop.y);
    lemming.rotation = this.rotation;
    // Lemming colors
    var colors = this.src.lemmingColor;
    if(colors) {
      lemming.setHairColor(eval("0x" + colors.hair[0]), eval("0x" + colors.hair[1]));
      lemming.setBodyColor(eval("0x" + colors.body[0]), eval("0x" + colors.body[1]));
    } else {
      lemming.setHairColor_Default();
      lemming.setBodyColor_Default();
    }
    // Stop spawning eventually
    if(this.value === 0) this.alarms.door.stop();
  }
}

window.addEventListener("load", Core.start.bind(Core));
