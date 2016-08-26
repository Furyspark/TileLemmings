function Game_Camera() {
  this.init.apply(this, arguments);
}

Game_Camera.prototype.init = function(map) {
  this.baseRect = new Rect(0, 0, 640, 360);
  this.rect = new Rect(this.baseRect.x, this.baseRect.y, this.baseRect.width, this.baseRect.height);
  this.map = map;
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
    position.x - (this.rect.width * anchor.x),
    position.y - (this.rect.height * anchor.y)
  );
  // Set bounds
  var scene = SceneManager.current();
  var bottomIncrease = 0;
  if(scene.uiHeight) bottomIncrease = scene.uiHeight / $gameMap.world.scale.y;
  var bounds = new Rect(0, 0, $gameMap.realWidth - this.rect.width, $gameMap.realHeight + bottomIncrease - this.rect.height);
  // Move
  this.rect.x = Math.max(bounds.left, Math.min(bounds.right, mapPos.x));
  this.rect.y = Math.max(bounds.top, Math.min(bounds.bottom, mapPos.y));
  // Update background
  if($gameMap.background.image) {
    $gameMap.background.image.tilePosition.x = this.rect.x * $gameMap.background.parallax.x;
    $gameMap.background.image.tilePosition.y = this.rect.y * $gameMap.background.parallax.y;
  }
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
