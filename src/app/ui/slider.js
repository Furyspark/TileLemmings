function UI_Slider() {
  this.init.apply(this, arguments);
}

UI_Slider.prototype = Object.create(UI_Base.prototype);
UI_Slider.prototype.constructor = UI_Slider;

Object.defineProperties(UI_Slider.prototype, {
  value: {
    get: function() { return this._value; },
    set: function(rate) {
      let valueRange = this.valueMax - this.valueMin;
      let newValue = Math.floor((rate * valueRange) / this.valueInterval) * this.valueInterval + this.valueMin;
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
  this._value = value;

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
  let valueRange = this.valueMax - this.valueMin;
  let valueRate = (this.value - this.valueMin) / valueRange;
  if(this.label) this.label.position.set(this.rect.width / 2, -(this.rect.height / 2));
  if(this.subSprites) this.subSprites.handle.position.x = valueRate * this.length;
}

UI_Slider.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}
