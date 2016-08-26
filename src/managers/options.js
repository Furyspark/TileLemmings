function Options() {}

Options.data          = null;
Options.SAVE_LOCATION = "config.json";

Options.generate = function() {
  this.data = {};
  this.data.audio = {
    volume: {
      bgm: 0.9,
      sfx: 0.9
    },
    toggleDuringPause: false
  };

  this.onLoad = new Signal();
  this.onSave = new Signal();
}

Options.save = function() {
  var json = JSON.stringify(this.data);
  if(Core.usingElectron) {
    Core.fs.writeFile(Options.SAVE_LOCATION, json, {}, function() {
      this.onSave.dispatch();
    }.bind(this));
  }
}

Options.load = function() {
  if(Core.usingElectron) {
    Core.fs.readFile(Options.SAVE_LOCATION, {}, function(err, data) {
      if(!err) this.data = JSON.parse(data);
      else this.generate();
    }.bind(this));
  }
}
