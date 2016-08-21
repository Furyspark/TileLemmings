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
