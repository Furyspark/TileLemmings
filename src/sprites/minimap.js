function Minimap() {
  this.init.apply(this, arguments);
}

Minimap.prototype = Object.create(PIXI.Container.prototype);
Minimap.prototype.constructor = Minimap;

Minimap.prototype.init = function(options) {
  PIXI.Container.prototype.constructor.call(this);
  this.interactive = false;
  this.tiles = [];

  if(options) {
    if(options.addCameraView) {
      this.addCameraView();
      this.updateCameraView();
      if(options.interactive) {
        this.addInteractivity();
      }
    }
  }

  this.background = new PIXI.Graphics();
  this.background.beginFill(0x0);
  this.background.drawRect(0, 0, $gameMap.width * 16, $gameMap.height * 16);
  this.background.endFill();
  this.background.z = 100;
  this.addChild(this.background);
}

Minimap.prototype.update = function() {
  if($gameMap) {
    // Clear and fill tiles array if necessary
    if(this.tiles.length !== $gameMap.tiles.length) {
      this.tiles = [];
      while(this.tiles.length < $gameMap.tiles.length) this.tiles.push(null);
    }
    // Replace tiles
    var minimapSprites = Cache.getTextureAtlas("atlMinimap");
    for(var a = 0;a < $gameMap.tiles.length;a++) {
      var myTile = this.tiles[a];
      var mapTile = $gameMap.tiles[a];
      var pos = $gameMap.getTilePosition(a);
      var realPos = new Point(pos.x * $gameMap.tileWidth, pos.y * $gameMap.tileHeight);

      // Remove tile
      if(mapTile === null && myTile !== null) {
        var spr = this.tiles.splice(a, 1, 0)[0];
        this.removeChild(spr);
      }
      // Add tile
      else if(mapTile !== null && myTile === null) {
        var spr = new Sprite_MinimapTile();
        spr.position.set(realPos.x, realPos.y);
        this.updateTile(mapTile, spr);
        this.tiles.splice(a, 1, spr);
        this.addChild(spr);
      }
      else if(mapTile !== null && myTile !== null) {
        this.updateTile(mapTile, myTile);
      }
    }
  }
  // Apply Z-Ordering
  this.children.sort(function(a, b) {
    if(a.z > b.z) return -1;
    if(a.z < b.z) return 1;
    return 0;
  });
  if(this.minimapView) this.updateCameraView();
}

Minimap.prototype.updateTile = function(mapTile, myTile) {
  myTile.playAnimation("ground");
  if(mapTile.hasProperty("STEEL")) myTile.playAnimation("steel");
}

Minimap.prototype.addCameraView = function() {
  this.minimapView = new PIXI.Graphics();
  this.minimapView.z = -100;
  this.addChild(this.minimapView);
}

Minimap.prototype.updateCameraView = function() {
  this.minimapView.lineStyle(2, 0x00ff00, 1);
  this.minimapView.drawRect(0, 0, $gameMap.camera.width, $gameMap.camera.height);
}

Minimap.prototype.addInteractivity = function() {
}
