function Map() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Map.prototype, {
  realWidth: {
    get: function() { return this.width * this.tileWidth; }
  },
  realHeight: {
    get: function() { return this.height * this.tileHeight; }
  }
});

Map.prototype.init = function(src, scene) {
  this.world             = new World();
  this.grid              = new PIXI.Container();
  this.camera            = new Camera(this);
  this.scene             = scene;
  this.tilesets          = [];
  this._expectedAssets   = [];
  this._expectedTilesets = [];
  this._usedAssets       = [];
  this.width             = 1;
  this.height            = 1;
  this.tileWidth         = 16;
  this.tileHeight        = 16;
  this.tiles             = [];
  this.objects           = [];
  this.background        = { image: null, parallax: new Point(0.5, 0.5), useParallax: true };
  this.needed            = 1;
  this.saved             = 0;
  this.totalLemmings     = 0;
  this.name              = "No Name";
  this.pool              = {};
  this.actions           = {};
  this.maxFallDistance   = 8 * 16;

  this.grid.z = -1500;
  this.grid.visible = false;
  this.world.addChild(this.grid);

  this.onLoad = new Signal();
  this.onCreate = new Signal();
  this.onLoad.addOnce(this.createLevel, this, [], 5);


  this.baseDir = src.split(/[\/\\]/).slice(0, -1).join("/") + "/";
  var obj = Loader.loadJSON("map", src);
  obj.onComplete.addOnce(this.parseTiledMap, this);
}

Map.prototype.parseTiledMap = function() {
  this.data = Cache.getJSON("map");
  this.parseMapProperties(this.data.properties);
  // Load Tilesets
  for(var a = 0;a < this.data.tilesets.length;a++) {
    var ts = this.data.tilesets[a];
    var key = "tileset" + a.toString();
    var tsBaseDir = this.baseDir + ts.source.split(/[\/\\]/).slice(0, -1).join("/") + "/";
    var args = [key, ts.firstgid, tsBaseDir, true];

    if(ts.source.split(/[\/\\]/).indexOf("generic") !== -1) args[3] = false;
    this._expectedAssets.push(key);
    var obj = Loader.loadJSON(key, this.baseDir + ts.source);
    obj.onComplete.addOnce(this.parseTilesetData, this, args, 20);
  }
}

Map.prototype.parseMapProperties = function(properties) {
  // Apply Map Properties
  if(properties.needed) this.needed = properties.needed;
  if(properties.name) this.name = properties.name;
  // Load Music
  if(properties.music) {
    var obj = Loader.loadAudio("music", AudioManager.baseDir("bgm") + properties.music + ".ogg");
    this._expectedAssets.push("music");
    obj.onComplete.addOnce(function() {
      this.clearAsset("music");
      this._usedAssets.push({ type: "audio", key: "music" });
    }, this, [], 20);
  }
  // Load background
  if(properties.bg) {
    var obj = Loader.loadImage("background", "assets/graphics/backgrounds/" + properties.bg + ".jpg");
    this._expectedAssets.push("background");
    obj.onComplete.addOnce(function() {
      this.clearAsset("background");
      this._usedAssets.push({ type: "image", key: "background" });
    }, this, [], 20);
  }
  // Apply actions
  for(var a in $dataActions) {
    var action = $dataActions[a];
    if(properties[action.key]) this.actions[a] = { amount: properties[action.key] };
  }
}

Map.prototype.parseTilesetData = function(key, firstGid, baseDir, loadImage) {
  var tsData = Cache.getJSON(key);
  var ts = new Tileset();
  ts.margin         = tsData.margin;
  ts.spacing        = tsData.spacing;
  ts.tileWidth      = tsData.tilewidth;
  ts.tileHeight     = tsData.tileheight;
  ts.firstGid       = firstGid;
  ts.tileProperties = tsData.tileproperties ? tsData.tileproperties : null;

  // Load tileset texture
  if(loadImage) {
    var imageKey = key + "_image";
    this._expectedAssets.push(imageKey);
    var src = baseDir + tsData.image;
    var obj = Loader.loadImage(imageKey, src);
    obj.onComplete.addOnce(this.parseTileset, this, [imageKey, ts], 20);
  }
  else {
    this.tilesets.push(ts);
  }

  this._expectedTilesets.push(key);
  this._usedAssets.push({ type: "json", key: key });
  this.clearAsset(key);
}

Map.prototype.parseTileset = function(imageKey, tileset) {
  tileset.texture = Cache.getImage(imageKey);
  this.tilesets.push(tileset);

  this._usedAssets.push({ type: "image", key: imageKey });
  this.clearAsset(imageKey);
}

Map.prototype.loadUsedGameObjectAssets = function() {
  var objects = this.getUsedGameObjects();
  for(var a = 0;a < objects.length;a++) {
    var obj = objects[a];
    var props = this.getObjectProperties(obj);
    if(props && props.type) {
      switch(props.type) {
        case "prop":
          this.loadGameObjectAsset($dataProps[props.key]);
          break;
      }
    }
  }
}

Map.prototype.getUsedGameObjects = function() {
  var result = [];
  for(var a = 0;a < this.data.layers.length;a++) {
    var layer = this.data.layers[a];
    if(layer.type === "objectgroup") {
      for(var b = 0;b < layer.objects.length;b++) {
        var obj = layer.objects[b];
        result.push(obj);
      }
    }
  }
  return result;
}

Map.prototype.loadGameObjectAsset = function(props) {
  // Load files
  for(var assetType in props.assets) {
    for(var assetKey in props.assets[assetType]) {
      var k = Loader.determineKey(props.assets[assetType][assetKey]);
      var file = null;
      switch(assetType) {
        case "audio":
          file = Loader.loadAudio(k, props.assets[assetType][assetKey]);
          break;
        case "textureAtlases":
          file = Loader.loadTextureAtlas(k, props.assets[assetType][assetKey]);
          break;
      }
      if(file !== null) {
        file.onComplete.addOnce(function(file) {
          this.clearAsset(file.key);
          this._usedAssets.push({ type: file.type, key: file.key });
        }, this, [file], 20);
        this._expectedAssets.push(k);
      }
    }
  }
}

Map.prototype.clearAsset = function(key) {
  // Clear tileset
  this.clearTileset(key);
  // Check if done loading, and if so, create level
  var a = this._expectedAssets.indexOf(key);
  if(a !== -1) {
    this._expectedAssets.splice(a, 1);
    if(this._expectedAssets.length === 0) {
      this.tilesets.sort(function(a, b) {
        if(a.firstGid < b.firstGid) return -1;
        if(a.firstGid > b.firstGid) return 1;
        return 0;
      });
      this.onLoad.dispatch();
    }
  }
}

Map.prototype.clearTileset = function(key) {
  var a = this._expectedTilesets.indexOf(key);
  if(a !== -1) {
    this._expectedTilesets.splice(a, 1);
    if(this._expectedTilesets.length === 0) {
      this.loadUsedGameObjectAssets();
    }
  }
}

Map.prototype.getTileset = function(uid) {
  for(var a = this.tilesets.length - 1;a >= 0;a--) {
    var ts = this.tilesets[a];
    if(uid >= ts.firstGid) return ts;
  }
  return null;
}

Map.prototype.createLevel = function() {
  this.width = this.data.width;
  this.height = this.data.height;
  this.tileWidth = this.data.tilewidth;
  this.tileHeight = this.data.tileheight;
  this.addBackground();
  // Resize
  while(this.tiles.length < this.width * this.height) {
    this.tiles.push(null);
  }
  // Parse layers
  for(var a = 0;a < this.data.layers.length;a++) {
    var layer = this.data.layers[a];
    // Tile Layer
    if(layer.type === "tilelayer") {
      this.parseTileLayer(layer);
    }
    // Object Layer
    else if(layer.type === "objectgroup") {
      this.parseObjectLayer(layer);
    }
  }
  // Create lemming pool
  this.pool.lemming = new Pool("Game_Lemming", this, [], this.totalLemmings);
  // Add grid
  this.addGrid();

  // Dispatch event
  this.onCreate.dispatch();
}

Map.prototype.parseTileLayer = function(layer) {
  for(var a = 0;a < layer.data.length;a++) {
    var uid = layer.data[a];
    if(uid > 0) {
      var pos = this.getTilePosition(a);
      this.addTile(pos.x, pos.y, uid, 0);
    }
  }
}

Map.prototype.parseObjectLayer = function(layer) {
  for(var a = 0;a < layer.objects.length;a++) {
    var objData = layer.objects[a];
    var props = this.getObjectProperties(objData);
    if(props) {
      var obj;
      if(props.type === "prop") {
        obj = this.addProp(objData.x, objData.y, props.key, objData);
      }
    }
  }
}

Map.prototype.getObjectProperties = function(objectData) {
  var ts = this.getTileset(objectData.gid);
  if(ts) {
    var props = ts.getTileProperties(objectData.gid - ts.firstGid);
    if(props) return props;
  }
  return null;
}

Map.prototype.addGrid = function() {
  for(var a = 0;a < this.width;a++) {
    for(var b = 0;b < this.height;b++) {
      var spr = new Sprite_Base();
      var anim = spr.addAnimation("idle");
      anim.addFrame("atlMisc", "gridTile.png");
      spr.position.set(a * this.tileWidth, b * this.tileHeight);
      spr.playAnimation("idle");
      this.grid.addChild(spr);
    }
  }
}

Map.prototype.addProp = function(x, y, key, data) {
  // Create object
  var obj = new Game_Prop(key, this);
  obj.map = this;
  obj.x = x;
  obj.y = y;
  this.objects.push(obj);
  // Reposition
  var src = $dataProps[obj.key];
  obj.x += (data.width * src.anchor.x);
  obj.y += (data.height * src.anchor.y);
  // Apply Properties
  if(data.properties) {
    obj.applyProperties(data.properties);
    // Door
    if(obj.type === "door") {
      // Value/Lemming Count
      if(data.properties.value) {
        this.totalLemmings += data.properties.value;
        obj.value = data.properties.value;
      }
      // Rate
      if(data.properties.rate) obj.rate = data.properties.rate;
    }
  }
  // Add to world
  this.world.addChild(obj.sprite);
}

Map.prototype.addTile = function(x, y, uid, flags, data) {
  if(!data) data = {};
  if(!flags) flags = 0;
  var ts = this.getTileset(uid);
  if(ts) {
    var index = this.getTileIndex(x, y);
    // Add new tile
    var tile = new Tile(ts.getTileTexture(uid - ts.firstGid));
    tile.x = x * this.tileWidth;
    tile.y = y * this.tileHeight;
    this.world.addChild(tile.sprite);
    // Add properties
    var properties = ts.getTileProperties(uid - ts.firstGid);
    if(properties) {
      for(var a in properties) {
        var property = properties[a];
        if(a.match(/PROPERTY_([a-zA-Z0-9]+)/i)) {
          tile.assignProperty(RegExp.$1);
        }
      }
    }
    // Remove old tile
    var oldTile = this.tiles.splice(index, 1, tile)[0];
    if(oldTile instanceof Tile) oldTile.sprite.destroy(true);
  }
}

Map.prototype.removeTile = function(x, y) {
  var index = this.getTileIndex(x, y);
  var oldTile = this.tiles.splice(index, 1, null)[0];
  if(oldTile instanceof Tile) {
    this.world.removeChild(oldTile.sprite);
    oldTile.sprite.destroy();
    return true;
  }
  return false;
}

Map.prototype.getTileIndex = function(x, y) {
  return x + (y * this.width);
}

Map.prototype.getTilePosition = function(index) {
  return new Point(
    Math.floor(index % this.width),
    Math.floor(index / this.width)
  );
}

Map.prototype.getTile = function(realX, realY) {
  if(realX < 0 || realY >= this.realWidth || realY < 0 || realY >= this.realHeight) return null;
  return this.tiles[this.getTileIndex(realX >> 4, realY >> 4)];
}

Map.prototype.setStage = function(stage) {
  stage.addChild(this.world);
}

Map.prototype.update = function() {
  // Update objects
  var arr = this.objects.slice().filter(function(obj) { return obj.exists; } );
  for(var a = 0;a < arr.length;a++) {
    var o = arr[a];
    o.update();
  }
  // Apply Z-ordering
  this.world.children.sort(function(a, b) {
    if(a.z !== undefined && b.z !== undefined && a.z > b.z) return -1;
    if(a.z !== undefined && b.z !== undefined && a.z < b.z) return 1;
    return 0;
  });
}

Map.prototype.updateCamera = function() {
  this.camera.update();
  // Update tiles
  var arr = this.tiles.slice();
  for(var a = 0;a < arr.length;a++) {
    var t = arr[a];
    if(t) {
      if(this.camera.contains(t.sprite)) t.sprite.visible = true;
      else t.sprite.visible = false;
    }
  }
  // Update objects
  var arr = this.objects.slice().filter(function(obj) { return obj.exists; } );
  for(var a = 0;a < arr.length;a++) {
    var o = arr[a];
    if(this.camera.contains(o.sprite) && o.exists) o.sprite.visible = true;
    else o.sprite.visible = false;
  }
}

Map.prototype.getLemmings = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Lemming && obj.exists);
  });
}

Map.prototype.getDoors = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Prop && obj.type === "door" && obj.exists);
  });
}

Map.prototype.getExits = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Prop && obj.type === "exit" && obj.exists);
  });
}

Map.prototype.startMusic = function() {
  AudioManager.playBgm("music");
}

Map.prototype.tileCollision = function(realX, realY, lem) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return Tile.COLLISION_ENDOFMAP;
  var tile = this.getTile(realX, realY);
  if(tile) return tile.collisionFunction.call(lem, realX, realY);
  return Tile.COLLISIONFUNC_AIR.call(lem, realX, realY);
}

Map.prototype.tileHasBlocker = function(realX, realY) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return false;
  var r = new Rect((realX >> 4) << 4, (realY >> 4) << 4, this.tileWidth, this.tileHeight);
  var arr = this.getLemmings().slice().filter(function(lemming) { return lemming.action.current === Game_Lemming.ACTION_BLOCKER; } );
  for(var a = 0;a < arr.length;a++) {
    var lemming = arr[a];
    if(r.contains(lemming.x, lemming.y)) return true;
  }
  return false;
}

Map.prototype.toScreenSpace = function(mapX, mapY) {
  return new Point(
    (mapX - this.camera.rect.left) * this.world.scale.x,
    (mapY - this.camera.rect.top) * this.world.scale.y
  );
}

Map.prototype.replaceTile = function(x, y, tile) {
  var index = this.getTileIndex(x, y);
  if(index >= 0 && index < this.tiles.length) {
    var oldTile = this.tiles.splice(index, 1, tile)[0];
    if(oldTile) oldTile.sprite.destroy(true);
    tile.x = x * this.tileWidth;
    tile.y = y * this.tileHeight;
    this.world.addChild(tile.sprite);
  }
}

Map.prototype.toWorldSpace = function(screenX, screenY) {
  return new Point(
    (screenX / this.world.scale.x) + this.camera.rect.left,
    (screenY / this.world.scale.y) + this.camera.rect.top
  );
}

Map.prototype.addBackground = function() {
  if(Cache.hasImage("background")) {
    this.background.image = new Sprite_Background(Cache.getImage("background"), this.realWidth, this.realHeight);
    this.world.addChild(this.background.image);
  }
}

Map.prototype.end = function() {
  this.clearLevelAssets();
}

Map.prototype.clearLevelAssets = function() {
  for(var a = 0;a < this._usedAssets.length;a++) {
    var asset = this._usedAssets[a];
    switch(asset.type) {
      case "json":
        Cache.removeJSON(asset.key);
        break;
      case "audio":
        Cache.removeAudio(asset.key);
        break;
      case "image":
        Cache.removeImage(asset.key);
        break;
      case "textureAtlas":
        Cache.removeTextureAtlas(asset.key);
        break;
    }
  }
  this._usedAssets = [];
}
