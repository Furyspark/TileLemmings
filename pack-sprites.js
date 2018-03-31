var spritesheet = require("spritesheet-js");
var fs = require("fs");

var config = {
    workspacePath: "workspace/sprites",
    outputPath: "app/assets/graphics/sprite-atlases"
};

function Core() {};

Core.start = function() {
    fs.readdir(config.workspacePath, function(err, files) {
        if(err) {
            console.error(err);
        }
        else {
            Core.packSprites(files);
        }
    });
};

Core.packSprites = function(files) {
    var iterateSheets = function(index) {
        if(index >= files.length) {
            return;
        }
        fs.mkdir(config.outputPath + "/" + files[index].toString(), function(err) {
            if(err && err.code !== "EEXIST") {
                console.error(err);
            }
            else {
                var sheetConfig = {
                    format: "json",
                    path: config.outputPath + "/" + files[index].toString(),
                    name: "sprites",
                    trim: true
                };
                console.log(config.workspacePath + "/" + files[index].toString());
                spritesheet(config.workspacePath + "/" + files[index].toString() + "/*.png", sheetConfig, function(err) {
                    if(err) console.error(err);
                    else {
                        iterateSheets(index + 1);
                    }
                });
            }
        });
    };

    iterateSheets(0);
};



Core.start();
