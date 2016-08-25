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
}

Scene_PostGame.prototype.start = function() {
  // Add background
  this.bg = new Background("bgMainMenu");
  this.stage.addChild(this.bg);
  // Add status text
  var desc = "You totally stormed that level!\nLet's see if you can storm the next..."
  if(this.saved < this.totalLemmings && this.saved === this.needed) desc = "SPOT ON! You can't get much closer than that.";
  else if(this.saved < this.needed && this.saved > 0) desc = "Total bummer! Try again.";
  else if(this.saved === 0) desc = "ROCK BOTTOM! I hope for your sake you nuked that level.";
  this.text = {
    status: new Text(desc)
  };
  this.stage.addChild(this.text.status);
}
