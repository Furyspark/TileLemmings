function Options() {}

Options.data          = null;
Options.SAVE_LOCATION = "config.json";
Options.onSave        = new Signal();
Options.onLoad        = new Signal();

Options.generate = function() {
  this.data = {};
  this.data.audio = {
    volume: {
      bgm: 0.9,
      sfx: 0.9
    },
    toggleDuringPause: false
  };
}

Options.save = function() {
  var json = JSON.stringify(this.data);
  if(Core.usingElectron) {
    Core.fs.writeFile(Options.SAVE_LOCATION, json, {}, function() {
      this.onSave.dispatch();
    }.bind(this));
  }
  else {
    localStorage.setItem("config", json);
    this.onSave.dispatch();
  }
}

Options.load = function() {
  this.generate();
  if(Core.usingElectron) {
    Core.fs.readFile(Options.SAVE_LOCATION, {}, function(err, data) {
      if(!err) this.data = Object.assign(this.data, JSON.parse(data));
      this.onLoad.dispatch();
    }.bind(this));
  }
  else {
    var data = localStorage.getItem("config");
    if(data) this.data = JSON.parse(data);
    this.onLoad.dispatch();
  }
}
