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
