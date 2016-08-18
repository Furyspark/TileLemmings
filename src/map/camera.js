function Camera() {
  this.init.apply(this, arguments);
}

Camera.prototype.init = function(map) {
  this.rect = new Rect(0, 0, 640, 360);
  this.map = map;
}

Camera.prototype.update = function() {
  this.map.world.scale.x = Core.resolution.x / this.rect.width;
  this.map.world.scale.y = Core.resolution.y / this.rect.height;
  this.map.world.position.x = -(this.rect.x * this.map.world.scale.x);
  this.map.world.position.y = -(this.rect.y * this.map.world.scale.y);
}

Camera.prototype.setPosition = function(position, anchor) {
  var oldPos = new Point(this.rect.x, this.rect.y);
  var mapPos = new Point(
    position.x - (this.rect.width * anchor.x),
    position.y - (this.rect.height * anchor.y)
  );
  var bounds = new Rect(0, 0, $gameMap.realWidth - this.rect.width, $gameMap.realHeight - this.rect.height);
  this.rect.x = Math.max(bounds.left, Math.min(bounds.right, mapPos.x));
  this.rect.y = Math.max(bounds.top, Math.min(bounds.bottom, mapPos.y));
  var diff = new Point(oldPos.x - this.rect.x, oldPos.y - this.rect.y);
  return diff;
}

Camera.prototype.move = function(x, y) {
  return this.setPosition(new Point(this.rect.x + x, this.rect.y + y), new Point(0, 0));
}

Camera.prototype.contains = function(spr) {
  var r = new Rect(spr.x - (spr.width * spr.anchor.x), spr.y - (spr.height * spr.anchor.y), spr.width, spr.height);
  return this.rect.overlap(r);
}
