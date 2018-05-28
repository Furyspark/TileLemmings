function Options() {}

Options.data          = null;
Options.onSave        = new Signal();
Options.onLoad        = new Signal();

Options.generate = function() {
    this.data = {};
    this.data.audio = {
        volume: {
            bgm: 0.9,
            snd: 0.9
        },
        toggleDuringPause: false
    };
    this.data.gameplay = {
        startWithGrid: false
    };
};

Options.getSaveLocation = function() {
    return Core.getUserDataDir() + "/config.json";
};

Options.save = function() {
    var json = JSON.stringify(this.data);
    if(Core.usingElectron) {
        Core.fs.writeFile(Options.getSaveLocation(), json, {}, function() {
            this.onSave.dispatch();
        }.bind(this));
    }
    else {
        localStorage.setItem("config", json);
        this.onSave.dispatch();
    }
};

Options.load = function() {
    this.generate();
    if(Core.usingElectron) {
        Core.fs.readFile(Options.getSaveLocation(), {}, function(err, data) {
            if(!err) this.data = Object.assign(this.data, JSON.parse(data));
            this.onLoad.dispatch();
        }.bind(this));
    }
    else {
        var data = localStorage.getItem("config");
        if(data) this.data = Object.assign(this.data, JSON.parse(data));
        this.onLoad.dispatch();
    }
};
