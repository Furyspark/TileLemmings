function Scene_Boot() {
  this.init.apply(this, arguments);
}

Scene_Boot.prototype = Object.create(Scene_Base.prototype);
Scene_Boot.prototype.constructor = Scene_Boot;

Scene_Boot.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
  var obj = Loader.loadJSON("assetList", "assets/asset-list.json");
  obj.onComplete.addOnce(this.loadAssets, this);
}

Scene_Boot.prototype.loadAssets = function() {
  this._loadStage = { assets: false, options: false, save: false };

  Loader.onComplete.addOnce(function() {
    this._loadStage.assets = true;
    this._checkLoadCompletion();
  }, this);
  var assetList = Cache.getJSON("assetList");
  // Load Images
  for(var a = 0;a < assetList.images.length;a++) {
    var asset = assetList.images[a];
    Loader.loadImage(asset.key, asset.src);
  }
  // Load Texture Atlases
  for(var a = 0;a < assetList["texture-atlases"].length;a++) {
    var asset = assetList["texture-atlases"][a];
    Loader.loadTextureAtlas(asset.key, asset.src);
  }
  // Load audio
  for(var a = 0;a < assetList.audio.length;a++) {
    var asset = assetList.audio[a];
    Loader.loadAudio(asset.key, asset.src);
  }
  // Load options
  Options.onLoad.addOnce(function() {
    this._loadStage.options = true;
    this._checkLoadCompletion();
  }, this);
  Options.load();
  // Load save game
  SaveManager.onLoad.addOnce(function() {
    this._loadStage.save = true;
    this._checkLoadCompletion();
  }, this);
  SaveManager.load();
}

Scene_Boot.prototype._checkLoadCompletion = function() {
  for(var a in this._loadStage) {
    if(this._loadStage[a] === false) return;
  }
  this.start();
}

Scene_Boot.prototype.start = function() {
  Core.tileset.generic = new Game_Tileset();
  Core.tileset.generic.texture = Cache.getImage("tsGeneric");
  SceneManager.push(new Scene_MainMenu());
  // SceneManager.push(new Scene_PreGame("assets/levels/testlevel.json"));
}
