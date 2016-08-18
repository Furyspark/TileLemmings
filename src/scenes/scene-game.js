function Scene_Game() {
  this.init.apply(this, arguments);
}

Scene_Game.prototype = Object.create(Scene_Base.prototype);
Scene_Game.prototype.constructor = Scene_Game;

Scene_Game.prototype.init = function() {
  Scene_Base.prototype.init.call(this);
  this.alarm = {
    doors: new Alarm()
  };
  this.stage.addChild($gameMap.world);
}

Scene_Game.prototype.create = function() {
  this.startMap();
}

Scene_Game.prototype.update = function() {
  Scene_Base.prototype.update.call(this);
  // Update alarms
  for(var a in this.alarm) {
    this.alarm[a].update();
  }
  // Move camera
  this.controlCamera();
  // Update map
  $gameMap.update();
}

Scene_Game.prototype.controlCamera = function() {
  var camSpeed = 3;
  if(Input.key.SHIFT.down) camSpeed *= 2;

  if(Input.isDown("camLeft")) {
    $gameMap.camera.move(-camSpeed, 0);
  }
  else if(Input.isDown("camRight")) {
    $gameMap.camera.move(camSpeed, 0);
  }
  if(Input.isDown("camUp")) {
    $gameMap.camera.move(0, -camSpeed);
  }
  else if(Input.isDown("camDown")) {
    $gameMap.camera.move(0, camSpeed);
  }
}

Scene_Game.prototype.startMap = function() {
  var snd = AudioManager.playSound("sndLetsGo");
  snd.audio.once("end", this._openDoors.bind(this));
}

Scene_Game.prototype._openDoors = function() {
  this.alarm.doors.time = 30;
  this.alarm.doors.onExpire.addOnce(function () {
    var arr = $gameMap.getDoors();
    if(arr.length > 0) {
      var obj = arr[0];
      if(obj.src.audio && obj.src.audio.open) AudioManager.playSound(obj.src.audio.open);
      obj.doorOpen();
    }
  }, this);
}
