function SaveManager() {}

SaveManager.data          = null;
SaveManager.onSave        = new Signal();
SaveManager.onLoad        = new Signal();

SaveManager.generate = function() {
  this.data = {};
  this.data.mapCompletion = {};
}

SaveManager.getSaveLocation = function() {
  return Core.getUserDataDir() + "/save.json";
};

SaveManager.addMapCompletion = function(world, key, completion) {
  if(!this.data.mapCompletion[world]) {
    this.data.mapCompletion[world] = {};
  }
  this.data.mapCompletion[world][key] = completion;
  this.save();
}

SaveManager.getMapCompletion = function(world, key) {
  return (this.data.mapCompletion[world] && this.data.mapCompletion[world][key] === true);
}

SaveManager.save = function() {
  var json = JSON.stringify(this.data);
  if(Core.usingElectron) {
    Core.fs.writeFile(SaveManager.getSaveLocation(), json, {}, function() {
      this.onSave.dispatch();
    }.bind(this));
  }
  else {
    localStorage.setItem("save", json);
    this.onSave.dispatch();
  }
}

SaveManager.load = function() {
  this.generate();
  if(Core.usingElectron) {
    Core.fs.readFile(SaveManager.getSaveLocation(), {}, function(err, data) {
      if(!err) this.data = Object.assign(this.data, JSON.parse(data));
      this.onLoad.dispatch();
    }.bind(this));
  }
  else {
    var data = localStorage.getItem("save");
    if(data) this.data = Object.assign(this.data, JSON.parse(data));
    this.onLoad.dispatch();
  }
}
