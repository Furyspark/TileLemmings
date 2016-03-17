function Level() {
  this.initialize.apply(this, arguments);
};
Level.prototype = Object.create(Phaser.Group.prototype);
Level.prototype.constructor = Level;

// Define properties
Object.defineProperties(Level.prototype, {
  totalWidth: { get() { return this.baseWidth * GameData.tile.width; } },
  totalHeight: { get() { return this.baseHeight * GameData.tile.height; } }
});

Level.prototype.initialize = function(src, onLoad, onLoadContext, levelFolder, levelObj) {
  Phaser.Group.call(this, game);
  game.world.add(this);
  GameManager.level = this;
  this.levelFolder = levelFolder;
  this.levelObj = levelObj;
  this.initMembers();

  // Create callback
  this.onLoad = new Phaser.Signal();
  this.onLoad.addOnce(onLoad, onLoadContext);

  // Load assets
  this.loadAssets(src);
};

Level.prototype.initMembers = function() {
  this.properties = {};
  this.rawLayers = [];

  this.baseWidth = 1;
  this.baseHeight = 1;
  this.fallDist = (9 * GameData.tile.height);

  this.baseUrl = this.levelFolder.baseUrl;
  this.name = this.levelObj.name;
  this.tileLayer = null;
  this.objectLayer = null;
  this.bg = null;

  // Create groups
  this.lemmingsGroup = game.add.group(this);
  this.actionPreviewGroup = game.add.group(this);
  this.gameLabelGroup = game.add.group(this);

  // Create grid
  this.gridGroup = game.add.group(this);
  this.gridGroup.visible = false;

  // Set more properties
  this.lemmingCount = 0;
  this.lemmingNeed = 1;
  this.actions = {};

  // (Default coordinates for the builder tile)
  this.buildTileRect = new Phaser.Rectangle(
    2,
    2,
    GameData.tile.width,
    GameData.tile.height
  );

  this.started = false;
  this.ended = false;
  this.saved = 0;

  // Keep track of assets
  this.tilesets = [];
  this.expectedAssets = [];
};

/*
  method: loadAssets
  Loads this level's assets (tilesets, music, background)
*/
Level.prototype.loadAssets = function(src) {
  // Create callback
  game.load.onFileComplete.add(function levelLoad(progress, fileKey, success, totalLoadedFiles, totalFiles) {
    if(this.expectedAssets.indexOf(fileKey) !== -1) {
      // Create background
      if(fileKey === "bg") {
        this.createBackground();
      }
      // Splice expectation list
      var a = this.expectedAssets.indexOf(fileKey);
      if(a !== -1) {
        this.expectedAssets.splice(a, 1);
      }
      if(this.expectedAssets.length === 0) {
        game.load.onFileComplete.remove(levelLoad, this);
        this.applySource(src);
      }
    }
  }, this);

  var a, ts;
  // Create tilesets
  for(a = 0;a < src.tilesets.length;a++) {
    this.loadTileset(src.tilesets[a]);
  }
  // Load BGM
  if(src.properties && src.properties.bgm) {
    this.expectedAssets.push("bgm");
    game.load.audio("bgm", "assets/audio/bgm/" + src.properties.bgm);
  }
  // Load Background
  if(src.properties && src.properties.bg) {
    this.expectedAssets.push("bg");
    game.load.image("bg", "assets/gfx/backgrounds/" + src.properties.bg);
  }
};

/*
  method: loadTileset(src)
  Loads a tileset for this map
*/
Level.prototype.loadTileset = function(src) {
  var url = this.baseUrl + src.source;
  var ts;
  this.expectedAssets.push("ts_" + url);
  ts = new Tileset(url, this, src.firstgid);
  this.tilesets.push(ts);
};

/*
  method: applySource(src)
  Applies a source to this level
*/
Level.prototype.applySource = function(src) {
  // Set size
  this.baseWidth = src.width;
  this.baseHeight = src.height;

  // Generate grid
  var a, b, gridTile;
  for(a = 0;a < this.baseWidth;a++) {
    for(b = 0;b < this.baseHeight;b++) {
      gridTile = game.add.image(a * GameData.tile.width, b * GameData.tile.height, "misc", "gridTile.png", this.gridGroup);
    }
  }

  // Create layers
  var layer, tempLayer;
  for(a = 0;a < src.layers.length;a++) {
    layer = src.layers[a];
    this.addLayer(layer);
  }

  // Apply tile modifiers
  var tileMod, tile;
  if(this.tileLayer) {
    for(a = 0;a < this.rawLayers.length;a++) {
      layer = this.rawLayers[a];
      if(layer.type == Layer.TILE_LAYER && layer !== this.tileLayer) {
        for(b = 0;b < layer.tileMods.length;b++) {
          tileMod = layer.tileMods[b];
          if(tileMod) {
            tile = this.tileLayer.tiles[b];
            if(tile) {
              tile.addMod(tileMod, {
                x: layer.indexToCoords(b).x,
                y: layer.indexToCoords(b).y,
                layer: layer
              });
            }
          }
        }
      }
    }
  }

  // Set properties
  if(src.properties.need) {
    this.lemmingNeed = parseInt(src.properties.need);
  }
  // Set actions
  for(a in GameData.actions) {
    if(src.properties[a]) {
      this.actions[a] = parseInt(src.properties[a]);
    }
  }

  // Do callback to the intermission
  this.onLoad.dispatch();
};

/*
  method: addLayer(src)
  Adds a layer to this level
*/
Level.prototype.addLayer = function(src, firstgid) {
  var layer = new Layer(src, this);
  if(layer.name === "tiles") {
    this.tileLayer = layer;
  }
  else if(layer.name === "objects") {
    this.objectLayer = layer;
  }
  this.rawLayers.push(layer);
  this.add(layer);
};

Level.prototype.zOrder = function() {
  var a;
  // Set (z-)order of display objects
  // Background
  if (this.bg) {
    this.bringToTop(this.bg);
  }
  // Objects
  this.bringToTop(this.objectLayer);
  // Main tile layer
  this.bringToTop(this.tileLayer);
  // Tile modifiers
  var a, layer;
  for(a = 0;a < this.rawLayers.length;a++) {
    layer = this.rawLayers[a];
    if(Layer.IDENTIFIER_MOD.test(layer.name)) {
      this.bringToTop(layer);
    }
  }
  // Lemmings
  this.bringToTop(this.lemmingsGroup);
  // Action preview tiles
  this.bringToTop(this.actionPreviewGroup);
  // Grid
  this.bringToTop(this.gridGroup);
  // Labels
  this.bringToTop(this.gameLabelGroup);
  // Selection markers
  var lems = this.lemmings();
  for(a = 0;a < lems.length;a++) {
    obj = lems[a];
    if(obj.cursor.sprite) {
      this.bringToTop(obj.cursor.sprite);
    }
  }
};

/*
  method: createBackground
  Creates a background for this level
*/
Level.prototype.createBackground = function() {
  this.bg = new Background("bg", this);
  this.add(this.bg);
};

/*
  method: toTileSpace(x, y)
*/
Level.prototype.toTileSpace = function(x, y) {
  return {
    x: Math.floor(x / GameData.tile.width),
    y: Math.floor(y / GameData.tile.height)
  };
};

/*
  method: toWorldSpace(x, y)
*/
Level.prototype.toWorldSpace = function(x, y) {
  return {
    x: Math.floor(x * GameData.tile.width),
    y: Math.floor(y * GameData.tile.height)
  };
};

/*
  method: removeTile(tileX, tileY)
  Removes a tile from the main tile layer at the specified coordinates
  force determines whether non-diggable tiles should be removed as well
*/
Level.prototype.removeTile = function(tileX, tileY, force) {
  if(force === undefined) { force = false; }
  var tileType;
  if(this.tileLayer) {
    tileType = this.tileLayer.getTileType(tileX, tileY);
    if(tileType === 1 || force) {
      this.tileLayer.removeTile(tileX, tileY);
      this.tileLayer.setTileType(tileX, tileY, 0);
      return 1;
    }
    else if(tileType === 2) {
      return 2;
    }
  }
  return 0;
};

/*
  method: clearAssets
  Clears the assets used (exclusively) in this level to free memory
*/
Level.prototype.clearAssets = function() {
  // Clear base assets
  if(game.cache.checkSoundKey("bgm")) {
    game.cache.removeSound("bgm");
  }
  if(game.cache.checkImageKey("bg")) {
    game.cache.removeImage("bg", true);
  }
  // Clear tilesets
  var ts;
  while(this.tilesets.length > 0) {
    ts = this.tilesets.splice(0, 1);
    if(game.cache.checkJSONKey(ts.key)) {
      game.cache.removeJSON(ts.key);
    }
    if(game.cache.checkImageKey(ts.imageKey)) {
      game.cache.removeImage(ts.imageKey, true);
    }
  }
};

/*
  method: clearLevel
  Clears the level of its objects
*/
Level.prototype.clearLevel = function() {
  var a, tile, layer;
  // Destroy layers
  for(a in this.rawLayers) {
    layer = this.rawLayers[a];
    // Destroy tiles
    while(layer.tiles.length > 0) {
      tile = layer.tiles.splice(0, 1)[0];
      if(tile) {
        tile.destroy();
      }
    }
    layer.destroy();
  }
  this.rawLayers = {};
};

Level.prototype.lemmings = function() {
  return this.lemmingsGroup.children.filter(function(obj) {
    return obj.exists;
  });
};
