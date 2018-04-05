function Scene_Base() {
    this.init.apply(this, arguments);
}

Scene_Base.FADEDURATION_DEFAULT = 250;


Scene_Base.prototype.init = function() {
    this.stage = new PIXI.Container();
    this.initFadeScreen();
    this.active = false;
    if(Core.debugMode) {
        this.startDebug();
    }
}

Scene_Base.prototype.update = function(dt) {
    if(Core.debugMode) {
        this.debug.fpsCounter.text = Core.fps.toString();
    }
}

Scene_Base.prototype.render = function(dt) {
    // Depth sorting
    this.stage.children.sort(function(a, b) {
        return b.z - a.z;
    });
    // Render stage
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
