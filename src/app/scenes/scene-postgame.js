function Scene_PostGame() {
  this.init.apply(this, arguments);
}

Scene_PostGame.prototype = Object.create(Scene_Base.prototype);
Scene_PostGame.prototype.constructor = Scene_PostGame;

Scene_PostGame.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
  this.needed = $gameMap.needed;
  this.saved = $gameMap.saved;
  this.totalLemmings = $gameMap.totalLemmings;
  this.success = this.saved >= this.needed;
  // Save game
  if($gameTemp.currentMap && this.success) {
    SaveManager.addMapCompletion($gameTemp.currentMap.world, $gameTemp.currentMap.key, true);
  }
}

Scene_PostGame.prototype.create = function() {
  // Stop Bgm
  AudioManager.stopBgm();
  // Add background
  this.bg = new Background("bgMainMenu");
  this.stage.addChild(this.bg);
  // Add status text
  var desc = "You totally stormed that level!\n\nLet's see if you can storm the next..."
  if(this.saved < this.totalLemmings && this.saved === this.needed) desc = "SPOT ON!\n\nYou can't get much closer than that.";
  else if(this.saved < this.needed && this.saved > 0) desc = "Total bummer!\n\nTry again.";
  else if(this.saved === 0) desc = "ROCK BOTTOM!\n\nI hope for your sake you nuked that level.";
  this.text = {
    status: new Text(desc)
  };
  this.text.status.style.align = "center";
  this.text.status.position.set(Core.resolution.x / 2, 40);
  this.text.status.anchor.set(0.5, 0);
  this.stage.addChild(this.text.status);
  // Fade in
  this.fadeIn();
  // Add interactivity
  Input.mouse.button.LEFT.onPress.add(this.continueGame, this);
}

Scene_PostGame.prototype.continueGame = function() {
  if(this.success) {
    this.fadeOut(function() {
      while(!(SceneManager.current() instanceof Scene_MainMenu) && !(SceneManager.current() instanceof Scene_WorldMap)) {
        SceneManager.pop();
      }
    }.bind(this));
  }
  else {
    this.fadeOut(function() {
      while(!(SceneManager.current() instanceof Scene_PreGame) && !(SceneManager.current() instanceof Scene_MainMenu) && !(SceneManager.current() instanceof Scene_WorldMap)) {
        SceneManager.pop();
      }
    }.bind(this));
  }
}

Scene_PostGame.prototype.end = function() {
  Input.mouse.button.LEFT.onPress.remove(this.continueGame, this);
}
