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
