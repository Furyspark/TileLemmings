var state = new Phaser.State();
StateManager.add("boot", state);

state.loadFunction = null;
state.loadSignalAdded = false;

state.create = function() {
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  // Disable context menu (right-click menu for browsers)
  game.canvas.oncontextmenu = function (e) { e.preventDefault(); }

  // Load game
  this.loadGame();

  // Initialize global game properties
  game.tiles = {
    solidTileTypes: [1, 2]
  };

  // Load asset list
  this.loadAssetList("./assets/asset_list.json");
};

state.loadAssetList = function(assetListFilename) {
  // Load asset list
  game.load.json("assetList", assetListFilename);


  this.loadFunction = function(progress, fileKey, success, totalLoadedFiles, totalFiles) {
    if(progress === undefined) {
      progress = -1;
    }

    if(progress >= 0 && totalLoadedFiles >= totalFiles) {
      game.load.onFileComplete.remove(this.loadFunction, this);
      this.loadFunction = null;
      this.loadSignalAdded = false;
      this.loadAssets();
    }
    else if(!this.loadSignalAdded) {
      this.loadSignalAdded = true;
      game.load.onFileComplete.add(this.loadFunction, this);
    }
  }
  this.loadFunction();
  game.load.start();
};

state.loadAssets = function() {
  var assetList = game.cache.getJSON("assetList");

  // Load sprites
  var a, curAsset, curList = assetList.sprites;
  for(a in curList) {
    curAsset = curList[a];
    game.load.spritesheet(curAsset.key, curAsset.url, curAsset.frameWidth, curAsset.frameHeight);
  }

  // Load sprite atlases
  curList = assetList.sprite_atlases;
  for(a in curList) {
    curAsset = curList[a];
    game.load.atlasJSONArray(curAsset.key, curAsset.url, curAsset.atlasUrl);
  }

  // Load images
  curList = assetList.images;
  for(a in curList) {
    curAsset = curList[a];
    game.load.image(curAsset.key, curAsset.url);
  }

  // Load sounds
  curList = assetList.sounds;
  for(a in curList) {
    curAsset = curList[a];
    game.load.audio(curAsset.key, curAsset.url);
  }

  // Load tilemaps
  curList = assetList.tilemaps;
  for(a in curList) {
    curAsset = curList[a];
    game.load.tilemap(curAsset.key, curAsset.url, null, Phaser.Tilemap.TILED_JSON);
  }

  // Load JSON
  curList = assetList.json;
  for(a in curList) {
    curAsset = curList[a];
    game.load.json(curAsset.key, curAsset.url);
  }

  // Add callback for Finish Loading
  this.loadFunction = function(progress, fileKey, success, totalLoadedFiles, totalFiles) {
    if(progress === undefined) {
      progress = -1;
    }

    if(progress >= 0 && totalLoadedFiles >= totalFiles) {
      game.load.onFileComplete.remove(this.loadFunction, this);
      this.loadFunction = null;
      this.loadSignalAdded = false;
      game.state.start("menu");
    }
    else if(!this.loadSignalAdded) {
      this.loadSignalAdded = true;
      game.load.onFileComplete.add(this.loadFunction, this);
    }
  }
  this.loadFunction();
};

state.loadGame = function() {
  // Load progress
  var rawSave = localStorage["tilelemmings.profiles.default.progress"];
  if(rawSave) {
    game.saveFile = JSON.parse(rawSave);
  }
  else {
    game.saveFile = {};
  }

  // Load settings
  GameManager.loadSettings();
};
