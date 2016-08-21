function Loader() {}

Loader._loading = [];
Loader.onComplete = new Signal();

Loader.loadJSON = function(key, src) {
  var xobj = new XMLHttpRequest();
  xobj.open("GET", src);
  xobj.onreadystatechange = function() {
    if(xobj.readyState === 4 && xobj.status === 200) { // Done loading
      file.onComplete.dispatch();
    }
    else if(xobj.readyState === 4 && xobj.status !== 200) { // Fail loading
      file.onFail.dispatch();
    }
  }
  xobj.send(null);

  var file = {
    key: key,
    src: src,
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: xobj
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishJSON, this, [file], 10);

  return file;
}

Loader.loadAudio = function(key, src) {
  var file;
  var howl = new Howl({
    src: [src],
    onload: function() {
      file.onComplete.dispatch();
    }
  });

  file = {
    key: key,
    src: src,
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: howl
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishAudio, this, [file], 10);

  return file;
}

Loader.loadImage = function(key, src) {
  var file;
  PIXI.loader.add(key, src);
  PIXI.loader.on("complete", function(loader, resources) {
    for(var a in resources) {
      if(file.key === a) {
        file.dataObject = resources[a].texture;
        file.onComplete.dispatch();
        break;
      }
    }
  });

  file = {
    key: key,
    src: src,
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: null
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishImage, this, [file], 10);
  PIXI.loader.load();

  return file;
}

Loader.loadTextureAtlas = function(key, src) {
  var file;
  // Load JSON Data
  PIXI.loader.add(key, src);
  PIXI.loader.on("complete", function(loader, resources) {
    for(var a in resources) {
      if(a === file.key || a === file.key + "_image") {
        if(a === file.key) file.dataObject.data = resources[a].data;
        else if(a === file.key + "_image") file.dataObject.texture = resources[a].texture;
        file.remaining--;
        if(file.remaining <= 0) file.onComplete.dispatch();
      }
    }
  });

  // Load Image
  file = {
    key: key,
    src: src,
    onComplete: new Signal(),
    onFail: new Signal(),
    dataObject: {
      texture: null,
      data: null
    },
    remaining: 2
  };
  this._loading.push(file);
  file.onComplete.addOnce(this._finishTextureAtlas, this, [file], 10);
  PIXI.loader.load();

  return file;
}

Loader._finishJSON = function(file) {
  Cache.addJSON(file.key, JSON.parse(file.dataObject.responseText));
  this._finishFile(file);
}

Loader._finishAudio = function(file) {
  Cache.addAudio(file.key, file.dataObject);
  this._finishFile(file);
}

Loader._finishImage = function(file) {
  Cache.addImage(file.key, file.dataObject);
  this._finishFile(file);
}

Loader._finishTextureAtlas = function(file) {
  Cache.addTextureAtlas(file.key, file.dataObject);
  this._finishFile(file);
}

Loader._finishFile = function(file) {
  var a = this._loading.indexOf(file);
  if(a !== -1) Loader._loading.splice(a, 1);
  this.checkLoadCompletion();
}

Loader.checkLoadCompletion = function() {
  if(this._loading.length === 0) this.onComplete.dispatch();
}

Loader.determineKey = function(url) {
  return url;
}
