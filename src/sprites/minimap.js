function Minimap() {
  this.init.apply(this, arguments);
}

Minimap.prototype = Object.create(PIXI.Container.prototype);
Minimap.prototype.constructor = Minimap;

Minimap.prototype.init = function() {
  PIXI.Container.prototype.constructor.call(this);
  this.interactive = false;
  this.tiles = [];

  this.background = new PIXI.Graphics();
  this.background.beginFill(0x0);
  this.background.drawRect(0, 0, $gameMap.width * 16, $gameMap.height * 16);
  this.background.endFill();
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

      if(mapTile === null && myTile !== null) {
        var spr = this.tiles.splice(a, 1, 0)[0];
        this.removeChild(spr);
      }
      else if(mapTile !== null && myTile === null) {
        var spr = new PIXI.Sprite(minimapSprites["tile.png"]);
        spr.type = 1;
        spr.position.set(realPos.x, realPos.y);
        this.tiles.splice(a, 1, spr);
        this.addChild(spr);
      }
    }
  }
}
