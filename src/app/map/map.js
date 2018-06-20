function Game_Map() {
  this.init.apply(this, arguments);
}

Game_Map.TILE_FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
Game_Map.TILE_FLIPPED_VERTICALLY_FLAG   = 0x40000000;
Game_Map.TILE_FLIPPED_DIAGONALLY_FLAG   = 0x20000000;

Object.defineProperties(Game_Map.prototype, {
  realWidth: {
    get: function() { return this.width * this.tileWidth; }
  },
  realHeight: {
    get: function() { return this.height * this.tileHeight; }
  }
});

/**
 * @constructor
 */
Game_Map.prototype.init = function(src, scene) {
  this.grid               = new PIXI.Container();
  this.camera             = new Game_Camera(this);
  this.scene              = scene;
  this.tilesets           = [];
  this._expectedAssets    = [];
  this._expectedTilesets  = [];
  this._usedAssets        = [];
  this.width              = 1;
  this.height             = 1;
  this.tileWidth          = 16;
  this.tileHeight         = 16;
  this.background         = null;
  this.needed             = 1;
  this.saved              = 0;
  this.totalLemmings      = 0;
  this.name               = "No Name";
  this.pool               = {};
  this.actions            = {};
  this.maxFallDistance    = 10 * 16;
  this.replay             = null;
  this.trackVictoryDefeat = true;
  this.loaded             = false;
  this.layers = {
    tile: []
  };

  this.onLoad     = new Signal();
  this.onCreate   = new Signal();
  this.onEndOfMap = new Signal();
  this.onLoad.addOnce(this.createLevel, this, [], 5);


  this.baseDir = src.split(/[\/\\]/).slice(0, -1).join("/") + "/";
  var obj = Loader.loadJSON("map", src);
  obj.onComplete.addOnce(this.parseTiledMap, this);
}

/**
 * Clears the map data to defaults.
 */
Game_Map.prototype.clear = function() {
  this.frame              = 0;
  this.world              = new Game_World();
  this.tiles              = null;
  this.objects            = [];
  this.trackVictoryDefeat = true;

  if(this.grid != null) this.world.removeChild(this.grid);
  this.grid.z = -1500;
  this.grid.visible = false;
  this.world.addChild(this.grid);
}

/**
 * Updates the boundaries of the camera.
 */
Game_Map.prototype.updateCameraBounds = function() {
  this.camera.bounds.x = 0;
  this.camera.bounds.y = 0;
  this.camera.bounds.width = this.realWidth;
  this.camera.bounds.height = this.realHeight;
  var scene = SceneManager.current();
  if(scene && scene.panelHeight) this.camera.bounds.height += (scene.panelHeight() / this.world.scale.y);
}

/**
 * Setup map from tiled map data.
 */
Game_Map.prototype.parseTiledMap = function() {
  this.data = Cache.getJSON("map");
  // Parse map properties
  this.parseMapProperties(this.data.properties);
  // Load Tilesets
  for(var a = 0;a < this.data.tilesets.length;a++) {
    var ts = this.data.tilesets[a];
    var key = "tileset" + a.toString();
    var tsBaseDir = this.baseDir + ts.source.split(/[\/\\]/).slice(0, -1).join("/") + "/";
    var args = [key, ts.firstgid, tsBaseDir, true];

    if(ts.source.split(/[\/\\]/).indexOf("objects") !== -1) args[3] = false;
    this._expectedAssets.push(key);
    this._expectedTilesets.push(key);
    var obj = Loader.loadJSON(key, this.baseDir + ts.source);
    obj.onComplete.addOnce(this.parseTilesetData, this, args, 20);
  }
}

/**
 * Setup from tiled map properties.
 * @param {object} properties - The tiled map properties.
 */
Game_Map.prototype.parseMapProperties = function(properties) {
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
}

/**
 * Parse a tileset from a tiled map (data only)
 * @param {string} key - The key of the tileset's JSON data (as in the cache).
 * @param {number} firstGid - The first GID of the tileset.
 * @param {string} baseDir - The base directory in which the tileset resides.
 * @param {boolean} loadImage - Whether to load the tileset's image.
 */
Game_Map.prototype.parseTilesetData = function(key, firstGid, baseDir, loadImage) {
  var tsData = Cache.getJSON(key);
  var ts = new Game_Tileset();
  ts.margin         = tsData.margin;
  ts.spacing        = tsData.spacing;
  ts.tileWidth      = tsData.tilewidth;
  ts.tileHeight     = tsData.tileheight;
  ts.firstGid       = firstGid;
  ts.tileProperties = tsData.tileproperties ? tsData.tileproperties : null;
  ts.tiles          = tsData.tiles ? tsData.tiles : null;

  // Load tileset texture
  if(loadImage) {
    var imageKey = key + "_image";
    this._expectedAssets.push(imageKey);
    var src = baseDir + tsData.image;
    var obj = Loader.loadImage(imageKey, src);
    obj.onComplete.addOnce(this.parseTilesetImage, this, [imageKey, ts], 20);
  }
  else {
    this.tilesets.push(ts);
  }

  this._usedAssets.push({ type: "json", key: key });
  this.clearAsset(key);
}

/**
 * Parse a tileset image.
 * @param {string} imageKey - The key of the image (as in the cache)
 * @param {Tileset} tileset - The tileset this image belongs to.
 */
Game_Map.prototype.parseTilesetImage = function(imageKey, tileset) {
  tileset.texture = Cache.getImage(imageKey);
  this.tilesets.push(tileset);

  this._usedAssets.push({ type: "image", key: imageKey });
  this.clearAsset(imageKey);
}

/**
 * Loads all used map assets.
 */
Game_Map.prototype.loadUsedGameObjectAssets = function() {
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

/**
 * Lists all used game objects (props etc) in the map.
 * @returns {object[]} All game objects as in a tiled map's JSON structure, from all layers.
 */
Game_Map.prototype.getUsedGameObjects = function() {
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

/**
 * Loads assets used by game objects which are used in this map.
 * @param {object} data - The game object data (from e.g. $dataProps[key]).
 */
Game_Map.prototype.loadGameObjectAsset = function(data) {
  // Load files
  for(var assetType in data.assets) {
    for(var assetKey in data.assets[assetType]) {
      var k = Loader.determineKey(data.assets[assetType][assetKey]);
      var file = null;
      switch(assetType) {
        case "audio":
          file = Loader.loadAudio(k, data.assets[assetType][assetKey]);
          break;
        case "textureAtlases":
          file = Loader.loadTextureAtlas(k, data.assets[assetType][assetKey]);
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

/**
 * Marks an asset as done loading.
 * @param {string} key - The key of the asset.
 */
Game_Map.prototype.clearAsset = function(key) {
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
      this.loaded = true;
      this.onLoad.dispatch();
    }
  }
}

/**
 * Marks a tileset as done loading.
 * @param {string} key - The key of the tileset.
 */
Game_Map.prototype.clearTileset = function(key) {
  var a = this._expectedTilesets.indexOf(key);
  if(a !== -1) {
    this._expectedTilesets.splice(a, 1);
    if(this._expectedTilesets.length === 0) {
      this.loadUsedGameObjectAssets();
    }
  }
}

/**
 * Returns a tileset by a tile UID.
 * @param {number} uid - The UID of the tile to find its tileset.
 * @returns {Tileset} The tileset associated with the UID.
 */
Game_Map.prototype.getTileset = function(uid) {
  for(var a = this.tilesets.length - 1;a >= 0;a--) {
    var ts = this.tilesets[a];
    if(uid >= ts.firstGid) return ts;
  }
  return null;
}

/**
 * Sets up the level after all assets have been loaded.
 */
Game_Map.prototype.createLevel = function() {
  this.clear();
  // Apply actions
  for(var a in $dataActions) {
    var action = $dataActions[a];
    if(this.data.properties[action.key]) this.actions[a] = { amount: this.data.properties[action.key] };
  }
  // Apply basic map data
  this.width = this.data.width;
  this.height = this.data.height;
  this.tileWidth = this.data.tilewidth;
  this.tileHeight = this.data.tileheight;
  this.updateCameraBounds();
  this.addBackground();
  // Set initial camera position
  if(this.data.properties.initialCameraPos) {
    if(this.data.properties.initialCameraPos.match(/([0-9]+)[,]([0-9]+)/)) {
      this.camera.setPosition(new Point(
        parseInt(RegExp.$1) * this.tileWidth,
        parseInt(RegExp.$2) * this.tileHeight
      ), new Point(0.5, 0.5));
    }
  }
  for(let a = 0;a < this.data.layers.length;a++) {
    let layerSrc = this.data.layers[a];
    // Background layer
    if(layerSrc.name.match(/BACKGROUND[S]?[0-9]?/i)) {
      this.parseTileLayer(layerSrc, "background");
    }
    // Tile layer
    else if(layerSrc.name.toUpperCase() === "TILES") {
      this.parseTileLayer(layerSrc, "tiles");
    }
    // Tile modifier layer
    else if(layerSrc.name.match(/MODIFIER[S]?[0-9]?/i)) {
      this.parseTileLayer(layerSrc, "modifiers");
    }
    // Object layer
    else if(layerSrc.name.match(/OBJECT[S]?/i)) {
      this.parseObjectLayer(layerSrc);
    }
  }
  // Create lemming pool
  this.pool.lemming = new Pool("Game_Lemming", this, [], this.totalLemmings);
  // Add grid
  this.addGrid();

  // Dispatch event
  this.onCreate.dispatch();
}

/**
 * Creates a tile layer from a tiled map layer.
 * @param {object} layerSrc - The tiled map layer data.
 * @param {string} type - The type of tileset to parse. Either 'tiles', 'modifiers' or 'background'.
 */
Game_Map.prototype.parseTileLayer = function(layerSrc, type) {
  // Add layer
  let layer = new Layer_Tile(this);
  this.layers.tile.push(layer);
  // Set primary tile layer
  if(type === "tiles") {
    this.tiles = layer;
  }
  // Add tiles
  for(var a = 0;a < layerSrc.data.length;a++) {
    var uid = layerSrc.data[a];
    let z = 0;
    if(layerSrc.properties && layerSrc.properties.z) z = layerSrc.properties.z;
    if(uid > 0) {
      var pos = this.getTilePosition(a);
      if(type === "tiles") this.addTile(layer, pos, uid, z);
      else if(type === "modifiers") this.addTileModifier(layer, pos, uid);
      else if(type === "background") this.addBackgroundTile(layer, pos, uid, z);
    }
  }
}

/**
 * Creates objects from a tiled map object layer.
 * @param {object} layerSrc - The tiled map layer data.
 */
Game_Map.prototype.parseObjectLayer = function(layerSrc) {
  for(var a = 0;a < layerSrc.objects.length;a++) {
    var objData = layerSrc.objects[a];
    // Determine flipping
    objData.flip = {
      horizontal: (objData.gid & Game_Map.TILE_FLIPPED_HORIZONTALLY_FLAG),
      vertical: (objData.gid & Game_Map.TILE_FLIPPED_VERTICALLY_FLAG),
      diagonal: (objData.gid & Game_Map.TILE_FLIPPED_DIAGONALLY_FLAG)
    };
    // Get data
    var props = this.getObjectProperties(objData);
    if(props) {
      var obj;
      if(props.type === "prop") {
        obj = this.addProp(objData.x, objData.y, props.key, objData);
      }
    }
  }
}

/**
 * Lists tileset properties of an object.
 * @param {object} objectData - The object as in a tiled map object layer's object.
 * @returns {object} The object properties as in its tileset.
 */
Game_Map.prototype.getObjectProperties = function(objectData) {
  var gid = objectData.gid & ~(
    Game_Map.TILE_FLIPPED_HORIZONTALLY_FLAG |
    Game_Map.TILE_FLIPPED_VERTICALLY_FLAG |
    Game_Map.TILE_FLIPPED_DIAGONALLY_FLAG
  );
  var ts = this.getTileset(gid);
  if(ts) {
    var props = ts.getTileProperties(gid - ts.firstGid);
    if(props) return props;
  }
  return null;
}

/**
 * Adds grid to the map.
 */
Game_Map.prototype.addGrid = function() {
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

/**
 * Adds a prop to the map.
 * @param {number} x - The x-position of the prop.
 * @param {number} y - The y-position of the prop.
 * @param {string} key - The key of the prop, as in $dataProps.
 * @param {object} data - The object's data as in a tiled map object layer's object.
 */
Game_Map.prototype.addProp = function(x, y, key, data) {
  // Create object
  var obj = new Game_Prop(key, this);
  obj.map = this;
  obj.x = x;
  obj.y = y;
  this.objects.push(obj);
  // Rotate
  var src = $dataProps[obj.key];
  var origin = new Point(data.width * src.anchor.x, data.height * src.anchor.y);
  var angle = Math.degtorad(data.rotation);
  origin.rotate(angle);
  obj.rotation = angle;
  // Reposition
  obj.x += origin.x;
  obj.y += origin.y;
  // Apply Properties
  if(data.properties) {
    obj.applyProperties(data.properties);
  }
  // Flip
  if(data.flip.horizontal) {
    obj.flipH();
    obj.x += data.width;
  }
  // Add to world
  this.world.addChild(obj.sprite);
}

/**
 * Adds a tile to the map.
 * @param {Layer_Tile} layer - The tile layer to add a tile to.
 * @param {Point} pos - The position (in tile space) to add the tile to.
 * @param {number} uid - The UID of the tile.
 * @param {number} z - The z-index of the tile.
 */
Game_Map.prototype.addTile = function(layer, pos, uid, z) {
  var ts = this.getTileset(uid);
  if(ts) {
    var index = this.getTileIndex(pos.x, pos.y);
    // Add new tile
    var tile = new Game_Tile(ts.getTileTexture(uid - ts.firstGid));
    tile.sprite.z = z;
    layer.addTile(tile, layer.getIndex(pos));
    // Add properties
    var properties = ts.getTileProperties(uid - ts.firstGid);
    if(properties) {
      for(var a in properties) {
        var property = properties[a];
        // Tile Property
        if(a.match(/PROPERTY_([a-zA-Z0-9]+)/i)) {
          tile.assignProperty(RegExp.$1);
        }
        // Tile Collision
        if(a.match(/COLLISION_([a-zA-Z0-9]+)/i)) {
          tile.collisionFunction = Game_Tile["COLLISIONFUNC_" + RegExp.$1.toUpperCase()];
        }
      }
    }
    // Add extra properties
    var extraProperties = ts.getTileExtraProperties(uid - ts.firstGid);
    if(extraProperties) {
      // Add animation
      if(extraProperties.animation) {
        for(var a = 0;a < extraProperties.animation.length;a++) {
          tile.sprite.addAnimationFrame("idle", ts, extraProperties.animation[a].tileid);
        }
        tile.sprite.playAnimation("idle");
      }
    }
  }
}

/**
 * Adds a background tile to a tile layer.
 * @param {Layer_Tile} layer - The tile layer to add a background tile to.
 * @param {Point} pos - The position (in tile space) to add the tile to.
 * @param {number} uid - The UID of the tile to add.
 * @param {number} z - The z-index of the tile.
 */
Game_Map.prototype.addBackgroundTile = function(layer, pos, uid, z) {
  let ts = this.getTileset(uid);
  if(ts != null) {
    let index = this.getTileIndex(pos.x, pos.y);
    // Add new tile
    let tile = new Game_Tile(ts.getTileTexture(uid - ts.firstGid));
    tile.sprite.z = z;
    layer.addTile(tile, layer.getIndex(pos));
  }
};

/**
 * Adds a tile modifier.
 * @param {number} x - The x-position (in tile space) to add the modifier to.
 * @param {number} y - The y-position (in tile space) to add the modifier to.
 * @param {number} uid - The UID of the tile modifier to add.
 */
Game_Map.prototype.addTileModifier = function(x, y, uid) {
  var ts = this.getTileset(uid);
  if(ts) {
    var modProperties = ts.getTileProperties(uid - ts.firstGid);
    var extraProperties = ts.getTileExtraProperties(uid - ts.firstGid);
    var index = this.getTileIndex(x, y);
    var tile = this.tiles.getTileByIndex(index);
    if(tile) {
      // Add modifier property
      if(modProperties.tile_property) tile.assignProperty(modProperties.tile_property);
      // Add modifier sprite
      var spr = new Sprite_Tile();
      spr.z = -50;
      if(extraProperties.animation) {
        for(var a = 0;a < extraProperties.animation.length;a++) {
          var animSrc = extraProperties.animation[a];
          spr.addAnimationFrame("idle", ts, animSrc.tileid);
        }
      }
      else spr.addAnimationFrame("idle", ts, uid - ts.firstGid);
      spr.playAnimation("idle");
      tile.sprite.addChild(spr);
    }
  }
}

/**
 * Removes a tile from the main tile layer.
 * @param {number} x - The x-position (in tile space) to remove a tile from.
 * @param {number} y - The y-position (in tile space) to remove a tile from.
 */
Game_Map.prototype.removeTile = function(x, y) {
  return this.tiles.removeTile(this.tiles.getIndex(new Point(x, y)));
}

/**
 * Calculates an index from a position.
 * @param {number} x - The x-position (in tile space) of the tile.
 * @param {number} y - The y-position (in tile space) of the tile.
 * @returns {number} The calculated index for the position.
 */
Game_Map.prototype.getTileIndex = function(x, y) {
  return x + (y * this.width);
}

/**
 * Calculates a position from a tile index.
 * @param {number} index - The index in tile space to calculate a position for.
 * @returns {Point} The calculated position for the given index.
 */
Game_Map.prototype.getTilePosition = function(index) {
  return new Point(
    Math.floor(index % this.width),
    Math.floor(index / this.width)
  );
}

/**
 * Finds a tile from the main tile layer at the given position.
 * @param {number} realX - The x-position (in world space).
 * @param {number} realY - The y-position (in world space).
 * @returns {Tile} The tile at the position.
 */
Game_Map.prototype.getTile = function(realX, realY) {
  let pos = new Point(
    Math.floor(realX / this.tileWidth),
    Math.floor(realY / this.tileHeight)
  );
  let index = this.tiles.getIndex(pos);
  return this.tiles.getTileByIndex(index);
}

/**
 * Sets the world stage.
 * @param {PIXI.Group} stage - The scene's stage to add this map's world to.
 */
Game_Map.prototype.setStage = function(stage) {
  stage.addChild(this.world);
}

/**
 * Updates map animations.
 */
Game_Map.prototype.update = function() {
  // Update object animations
  var arr = this.objects.slice().filter(function(obj) { return obj.exists; } );
  for(var a = 0;a < arr.length;a++) {
    var o = arr[a];
    o.updateAnimation();
  }
  // Update tiles
  for(let a = 0;a < this.layers.tile.length;a++) {
    let layer = this.layers.tile[a];
    for(let b = 0;b < layer.getSize();b++) {
      let tile = layer.getTileByIndex(b);
      if(tile) tile.updateAnimation();
    }
  }
  this.world.zOrder();
  this.updateCameraBounds();
};

/**
 * Updates map logic.
 */
Game_Map.prototype.updateGameLogic = function() {
  // Update frame
  this.frame++;
  if(!this.replay.hasActionsRemaining()) {
    SceneManager.current().stopReplay();
  }
  else {
    this.replay.performActions();
  }
  // Update objects
  var arr = this.objects.slice().filter(function(obj) { return obj.exists; } );
  for(var a = 0;a < arr.length;a++) {
    var o = arr[a];
    o.update();
  }
  // Update tiles
  for(let a = 0;a < this.layers.tile.length;a++) {
    let layer = this.layers.tile[a];
    for(let b = 0;b < layer.getSize();b++) {
      let tile = layer.getTileByIndex(b);
      if(tile) tile.update();
    }
  }
  // Track victory/defeat
  if(this.trackVictoryDefeat) {
    var end = true;
    if(this.getLemmings().length > 0) end = false;
    var arr = this.getDoors();
    for(var a = 0;a < arr.length && end;a++) {
      var obj = arr[a];
      if(obj.value > 0) end = false;
    }
    if(end) {
      this.trackVictoryDefeat = false;
      this.onEndOfMap.dispatch();
    }
  }
};

/**
 * Updates the camera.
 */
Game_Map.prototype.updateCamera = function() {
  this.camera.update();
  // Update tile visibility
  for(let a = 0;a < this.layers.tile.length;a++) {
    let layer = this.layers.tile[a];
    for(let b = 0;b < layer.getSize();b++) {
      let tile = layer.getTileByIndex(b);
      if(tile) {
        if(this.camera.contains(tile.sprite)) tile.sprite.visible = true;
        else tile.sprite.visible = false;
      }
    }
  }
  // Update object visibility
  var arr = this.objects.slice().filter(function(obj) { return obj.exists; } );
  for(var a = 0;a < arr.length;a++) {
    var o = arr[a];
    if(this.camera.contains(o.sprite) && o.exists) o.sprite.visible = true;
    else o.sprite.visible = false;
  }
}

/**
 * Lists all active lemmings.
 * @returns {Lemming[]} An array of lemmings.
 */
Game_Map.prototype.getLemmings = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Lemming && obj.exists);
  });
}

/**
 * Lists all doors.
 * @returns {Prop[]} An array of door props.
 */
Game_Map.prototype.getDoors = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Prop && obj.type === "door" && obj.exists);
  });
}

/**
 * Lists all exits.
 * @returns {Prop[]} An array of exit props.
 */
Game_Map.prototype.getExits = function() {
  return this.objects.filter(function(obj) {
    return (obj instanceof Game_Prop && obj.type === "exit" && obj.exists);
  });
}

/**
 * Starts the map's music.
 */
Game_Map.prototype.startMusic = function() {
  AudioManager.playBgm("music");
}

/**
 * @param {number} realX - The x-position (in world space) to find a tile collision at.
 * @param {number} realY - The y-position (in world space) to find a tile collision at.
 * @param {Lemming} lem - The lemming to find a tile collision for.
 * @returns {boolean} Whether a collision happens.
 */
Game_Map.prototype.tileCollision = function(realX, realY, lem) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return Game_Tile.COLLISION_ENDOFMAP;
  var tile = this.getTile(realX, realY);
  if(tile) return tile.collisionFunction.call(lem, realX, realY);
  return Game_Tile.COLLISIONFUNC_AIR.call(lem, realX, realY);
}

/**
 * @param {number} realX - The x-position (in world space) to find a blocker at.
 * @param {number} realY - The y-position (in world space) to find a blocker at.
 * @returns {boolean} Whether the tile-space at the given position has a blocker present.
 */
Game_Map.prototype.tileHasBlocker = function(realX, realY) {
  if(realX < 0 || realX >= this.realWidth || realY < 0 || realY >= this.realHeight) return false;
  var r = new Rect((realX >> 4) << 4, (realY >> 4) << 4, this.tileWidth, this.tileHeight);
  var arr = this.getLemmings().slice().filter(function(lemming) { return lemming.action.current === Game_Lemming.ACTION_BLOCKER; } );
  for(var a = 0;a < arr.length;a++) {
    var lemming = arr[a];
    if(r.contains(lemming.x, lemming.y)) return true;
  }
  return false;
}

/**
 * Finds a position relative to the camera.
 * @param {number} mapX - The x-position in the map (world space).
 * @param {number} mapY - The y-position in the map (world space).
 * @returns {Point} The given position relative to the camera's top-left.
 */
Game_Map.prototype.toScreenSpace = function(mapX, mapY) {
  return new Point(
    (mapX - this.camera.rect.left) * this.world.scale.x,
    (mapY - this.camera.rect.top) * this.world.scale.y
  );
}

/**
 * Replaces a tile with another tile.
 * @param {number} x - The x-position (in tile space).
 * @param {number} y - The y-position (in tile space).
 * @param {Tile} tile - The new tile.
 */
Game_Map.prototype.replaceTile = function(x, y, tile) {
  var index = this.getTileIndex(x, y);
  if(index >= 0 && index < this.tiles.getSize()) {
    this.tiles.removeTile(index);
    this.tiles.addTile(tile, index);
  }
}

/**
 * Finds a position in world space.
 * @param {number} screenX - The x-position on the screen.
 * @param {number} screenY - The y-position on the screen.
 * @returns {Point} The given position on the map.
 */
Game_Map.prototype.toWorldSpace = function(screenX, screenY) {
  return new Point(
    (screenX / this.world.scale.x) + this.camera.rect.left,
    (screenY / this.world.scale.y) + this.camera.rect.top
  );
}

/**
 * Adds the map's given background.
 */
Game_Map.prototype.addBackground = function() {
  if(Cache.hasImage("background")) {
    // Get Parallax and Tile properties
    var parallax = new Point(0.5, 0.5);
    var tile = { x: true, y: true };
    if(this.data.properties) {
      parallax.x = typeof this.data.properties.parallaxX === "number" ? this.data.properties.parallaxX : 0.5;
      parallax.y = typeof this.data.properties.parallaxY === "number" ? this.data.properties.parallaxY : 0.5;
      tile.x = typeof this.data.properties.tileX === "boolean" ? this.data.properties.tileX : true;
      tile.y = typeof this.data.properties.tileY === "boolean" ? this.data.properties.tileY : true;
    }
    // Create background
    this.background = new Background("background", this.realWidth, this.realHeight, tile, parallax);
    this.world.addChild(this.background);
  }
}

/**
 * Destroys the map and frees the assets used within.
 */
Game_Map.prototype.destroy = function() {
  this.clearLevelAssets();
  Cache.removeJSON("map");
}

/**
 * Frees all map assets.
 */
Game_Map.prototype.clearLevelAssets = function() {
  while(this._usedAssets.length > 0) {
    var asset = this._usedAssets.pop();
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
      default:
        console.log("Failed to remove asset: " + asset.key);
        break;
    }
  }
}

/**
 * Updates the replay from the last time (from an instance of Scene_PreGame).
 */
Game_Map.prototype.updateReplay = function() {
  // Get replay
  var preGameScene = SceneManager.getSceneByType(Scene_PreGame);
  if(preGameScene != null) {
    this.replay = preGameScene.replay;
  }
  if(this.replay == null) this.replay = new Replay(this);
  preGameScene.replay = this.replay;
  // Set replay map
  this.replay._map = this;
};
