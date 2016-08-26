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
  this.map.background.refresh();
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
