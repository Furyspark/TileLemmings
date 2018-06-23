function Cache() {}

Cache._json = {};
Cache._audio = {};
Cache._images = {};
Cache._textureAtlases = {};

Cache.getJSON = function(key) {
  if(this._json[key]) return this._json[key];
  return null;
}

Cache.addJSON = function(key, obj) {
  this._json[key] = obj;
}

Cache.removeJSON = function(key) {
  delete this._json[key];
}

Cache.hasJSON = function(key) {
  return (this._json[key] !== undefined);
}

Cache.getAudio = function(key) {
  if(this._audio[key]) return this._audio[key];
  return null;
}

Cache.addAudio = function(key, obj) {
  this._audio[key] = obj;
}

Cache.removeAudio = function(key) {
  var howl = this._audio[key];
  howl.unload();
  delete this._audio[key];
}

Cache.hasAudio = function(key) {
  return (this._audio[key] !== undefined);
}

Cache.getImage = function(key) {
  if(this._images[key]) return this._images[key].clone();
  return null;
}

Cache.addImage = function(key, obj) {
  this._images[key] = obj;
}

Cache.removeImage = function(key) {
  var img = this._images[key];
  img.destroy(true);
  delete this._images[key];
}

Cache.hasImage = function(key) {
  return (this._images[key] !== undefined);
}

Cache.getTextureAtlas = function(key) {
  if(this._textureAtlases[key]) return this._textureAtlases[key].cache;
  return null;
}

Cache.addTextureAtlas = function(key, file) {
  let obj = {};
  let dataObj = file.getData();
  for(let a in dataObj.data.frames) {
    let tex = PIXI.utils.TextureCache[a];
    obj[a] = tex;
  }
  this._textureAtlases[key] = { resources: dataObj, cache: obj, file: file };
}

Cache.removeTextureAtlas = function(key) {
  // Gather info
  let obj = this._textureAtlases[key];
  let arr = [];
  for(let a in obj.resources.textures) {
    arr.push(obj.resources.textures[a]);
  }
  // Delete textures
  while(arr.length > 0) {
    let obj = arr.shift();
    let destroyBase = false;
    if(arr.length === 0) destroyBase = true;
    obj.baseTexture.destroy(destroyBase);
    obj.destroy(destroyBase);
  }
  obj.file.loader.reset();
  PIXI.Texture.removeFromCache(obj.file.key + "_image");
  // Delete reference
  delete this._textureAtlases[key];
}

Cache.hasTextureAtlas = function(key) {
  return (this._textureAtlases[key] !== undefined);
}
