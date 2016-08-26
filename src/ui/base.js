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
  var anchor = new Point(0, 0);
  if(this.sprite.anchor) anchor = this.sprite.anchor;
  if(!r) r = new Rect(this.sprite.x - anchor.x * this.sprite.width, this.sprite.y - anchor.y * this.sprite.height, this.sprite.width, this.sprite.height);
  return (x >= r.left && x < r.right && y >= r.top && y < r.bottom);
}
