var data = {
  sources: [
    "src/header.js",

    "src/shaders/color-replace.js",

    "src/basic/point.js",
    "src/basic/rect.js",
    "src/basic/signal.js",
    "src/basic/animation.js",
    "src/basic/pool.js",
    "src/basic/background.js",
    "src/basic/text.js",
    "src/basic/alarm.js",

    "src/loader/cache.js",
    "src/loader/loader.js",

    "src/core.js",

    "src/input/input.js",
    "src/input/input-key.js",
    "src/input/input-mouse.js",

    "src/managers/audiomanager.js",
    "src/managers/scenemanager.js",

    "src/sprites/base.js",
    "src/sprites/lemming.js",
    "src/sprites/tile.js",
    "src/sprites/minimap.js",
    "src/sprites/minimap-tile.js",
    "src/sprites/prop.js",
    "src/sprites/ui.js",
    "src/sprites/cursor.js",
    "src/sprites/background.js",

    "src/scenes/scene-base.js",
    "src/scenes/scene-boot.js",
    "src/scenes/scene-mainmenu.js",
    "src/scenes/scene-pregame.js",
    "src/scenes/scene-game.js",

    "src/ui/base.js",
    "src/ui/button.js",
    "src/ui/minimap.js",

    "src/map/map.js",
    "src/map/tileset.js",
    "src/map/tile.js",
    "src/map/world.js",
    "src/map/camera.js",

    "src/game/base.js",
    "src/game/lemming.js",
    "src/game/prop.js",

    "src/footer.js"
  ],
  target: "lib/game.js"
};

var concat = require("concatenate-files");
concat(data.sources, data.target, { separator: "\n" }, function(err, result) {
  if(err) console.log(err);
} );
