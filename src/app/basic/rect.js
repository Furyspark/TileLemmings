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
