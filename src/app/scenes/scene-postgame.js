function Scene_PostGame() {
  this.init.apply(this, arguments);
}

Scene_PostGame.prototype = Object.create(Scene_MenuBase.prototype);
Scene_PostGame.prototype.constructor = Scene_PostGame;

Scene_PostGame.prototype.init = function() {
  Scene_MenuBase.prototype.init.call(this);
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
  Scene_MenuBase.prototype.create.call(this);
  // Stop Bgm
  AudioManager.stopBgm();
  // Add background
  this.bg = new Background("bgMainMenu");
  this.stage.addChild(this.bg);
  // Add status text
  let desc = this.getResultText();
  this.text = {
    status: new Text(desc)
  };
  this.text.status.style.align = "center";
  this.text.status.position.set(Core.resolution.x / 2, 40);
  this.text.status.anchor.set(0.5, 0);
  this.stage.addChild(this.text.status);
  // Add replay button
  this.addReplayButton();
  // Add world map button
  this.addWorldMapButton();
  // Fade in
  this.fadeIn();
}

Scene_PostGame.prototype.getResultText = function() {
  if(this.needed < this.totalLemmings && this.saved === this.needed) return "SPOT ON!\n\nYou can't get much closer than that.";
  else if(this.saved < this.needed && this.saved > 0) return "Total bummer!\n\nTry again.";
  else if(this.saved === 0) return "ROCK BOTTOM!\n\nFor your sake, I hope you nuked that level.";
  return "You totally stormed that level!\n\nLet's see if you can storm the next...";
};

Scene_PostGame.prototype.continueGame = function() {
  if(this.success) {
    this.doReturnToWorldMap();
  }
  else {
    this.doRetry();
  }
}

Scene_PostGame.prototype.doReturnToWorldMap = function() {
  this.fadeOut(function() {
    while(!(SceneManager.current() instanceof Scene_MainMenu) && !(SceneManager.current() instanceof Scene_WorldMap)) {
      SceneManager.pop();
    }
  }.bind(this));
};

Scene_PostGame.prototype.doRetry = function() {
  this.fadeOut(function() {
    while(!(SceneManager.current() instanceof Scene_PreGame) && !(SceneManager.current() instanceof Scene_MainMenu) && !(SceneManager.current() instanceof Scene_WorldMap)) {
      SceneManager.pop();
    }
  }.bind(this));
};

Scene_PostGame.prototype.end = function() {
  Scene_MenuBase.prototype.end.call(this);
  Input.mouse.button.LEFT.onPress.remove(this.continueGame, this);
}

Scene_PostGame.prototype.addReplayButton = function() {
  // Create element
  var elem = new UI_MenuButton(new Point(0, 0), "Replay");
  let x = Math.floor(Core.resolution.x * 0.25 - elem.sprite.width / 2);
  let y = Math.floor(Core.resolution.y * 0.75 - elem.sprite.height / 2);
  elem.x = x;
  elem.y = y;
  // Add event
  elem.onClick.add(function() {
    this.doRetry();
  }.bind(this));
  // Add element
  this.addUI(elem);
  // Return element
  return elem;
};

Scene_PostGame.prototype.addWorldMapButton = function() {
  // Create element
  var elem = new UI_MenuButton(new Point(0, 0), "World Map");
  let x = Math.floor(Core.resolution.x * 0.75 - elem.sprite.width / 2);
  let y = Math.floor(Core.resolution.y * 0.75 - elem.sprite.height / 2);
  elem.x = x;
  elem.y = y;
  // Add event
  elem.onClick.add(function() {
    this.doReturnToWorldMap();
  }.bind(this));
  // Add element
  this.addUI(elem);
  // Return element
  return elem;
};
