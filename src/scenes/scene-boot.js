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
  Loader.onComplete.addOnce(this.start, this);
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
}

Scene_Boot.prototype.start = function() {
  Core.tileset.generic = new Game_Tileset();
  Core.tileset.generic.texture = Cache.getImage("tsGeneric");
  SceneManager.push(new Scene_PreGame("assets/levels/testlevel.json"));
}
