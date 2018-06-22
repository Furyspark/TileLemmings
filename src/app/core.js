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

Core.preStart = function() {
  this.config = null;
  this.initElectron();
  this.ipcRenderer.send("core", ["PRESTART"]);
};

Core.start = function() {
  this.initMembers();
  this.initPixi();
  this.fitToWindow();
  this.startDataObjects();
  this.initExternalLibs();
  this.initWindow();
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
  // Send: Window resize
  window.addEventListener("resize", Core.onResize);
  this.ipcRenderer.on("core", function(ev, args) {
    let cmd = args.splice(0, 1)[0];
    switch(cmd.toUpperCase()) {
        // Listen: Start
      case "START":
        Core.initMainVariables(args[0]);
        Core.config = args[1];
        Core.start();
        break;
        // Listen: Debug mode
      case "DEBUG":
        Core.debugMode = true;
        break;
    }
  });
};

Core.initMainVariables = function(args) {
  this._userDataDir = args.userDataDir;
};

Core.initWindow = function() {
  // Maximize window
  if(this.config.window.maximized) {
    this.ipcRenderer.send("window", ["maximize"]);
  }
  // Set full screen
  if(this.config.window.fullscreen) {
    this.setFullscreen(true);
  }
};

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
}

Core.render = function() {
  // Update FPS
  var nowTime = new Date;
  if(nowTime.getSeconds() !== this.lastTime.getSeconds()) {
    this.fps = Math.floor(1000 / (nowTime - this.lastTime));
  }
  var dt = 100 * ((nowTime - this.lastTime) / 1000);
  this.lastTime = nowTime;
  // Set new timeout
  // requestAnimationFrame(this.render.bind(this));
  setTimeout(this.render.bind(this), Math.max(1, Math.floor(1000 / this.frameRate)));
  // Update scene
  Input.update();
  SceneManager.update(dt);
  Input._refreshButtonStates();
  SceneManager.render(dt);
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
  this.ipcRenderer.send("window", ["fullscreen", state]);
  this.isFullscreen = state;
  // if(state === true) {
    // if(Core.renderer.view.requestFullscreen) Core.renderer.view.requestFullscreen();
    // else if(Core.renderer.view.webkitRequestFullscreen) Core.renderer.view.webkitRequestFullscreen();
    // else if(Core.renderer.view.mozRequestFullScreen) Core.renderer.view.mozRequestFullScreen();
  // }
  // else {
    // if(document.exitFullscreen) document.exitFullscreen();
    // else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
    // else if(document.mozCancelFullScreen) document.mozCancelFullScreen();
  // }
}

Core.getFullscreen = function() {
  return this.isFullscreen;
}

Core.getUserDataDir = function() {
  return this._userDataDir;
};
