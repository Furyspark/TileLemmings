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
  this.actionSelected = "";
  this.paused = false;
  this.fastForward = false;
  this.grid = false;
  this.initUI();
  // Init cursor
  this.cursor = new Sprite_Cursor();
  this.lemmingSelect = null;
  this.stage.addChild(this.cursor);
  // Init action preview
  this.actionPreview = [];
  this.actionPreview = {
    tiles: [],
    alpha: {
      value: 0.9,
      speed: -0.05,
      min: 0.5,
      max: 0.9
    }
  };
  for(var a = 0;a < 5;a++) {
    var spr = new Sprite_Base();
    var anim = spr.addAnimation("idle");
    anim.addFrame("atlMisc", "previewTile.png");
    spr.playAnimation("idle");
    spr.visible = false;
    spr.z = -1510;
    this.actionPreview.tiles.push(spr);
    $gameMap.world.addChild(spr);
  }
}

Scene_Game.prototype.create = function() {
  this.startMap();
  this.initControls();
}

Scene_Game.prototype.update = function() {
  Scene_Base.prototype.update.call(this);
  // Move camera
  this.controlCamera();
  if(!this.paused) {
    // Update alarms
    for(var a in this.alarm) {
      this.alarm[a].update();
    }
    // Update map
    var updateCount = 1;
    if(this.fastForward) updateCount = 4;
    for(var a = 0;a < updateCount;a++) {
      for(var b in this.alarm) {
        this.alarm[b].update();
      }
      $gameMap.update();
    }
  }
  // Lemming control
  this.lemmingSelect = this.getLemmingUnderCursor();
  if(this.lemmingSelect) {
    var pt = $gameMap.toScreenSpace(this.lemmingSelect.x, this.lemmingSelect.y - 8);
    this.cursor.position.set(pt.x, pt.y);
    this.cursor.playAnimation("over");
    this.cursor.visible = true;
  }
  else {
    this.cursor.visible = false;
  }
  this.updateActionPreview();
  this.minimap.update();
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
  $gameMap.updateCamera();
}

Scene_Game.prototype.startMap = function() {
  var snd = AudioManager.playSound("sndLetsGo");
  snd.audio.once("end", this._openDoors.bind(this));
}

Scene_Game.prototype._openDoors = function() {
  this.alarm.doors.time = 30;
  this.alarm.doors.onExpire.addOnce(function () {
    var arr = $gameMap.getDoors();
    var playedSound = false;
    for(var a = 0;a < arr.length;a++) {
      var obj = arr[a];
      if(!playedSound && obj.sounds && obj.sounds.open) {
        AudioManager.playSound(obj.sounds.open);
        playedSound = true;
      }
      obj.doorOpen();
    }
  }, this);
}

Scene_Game.prototype.initUI = function() {
  this.uiHeight = 0;
  this.ui = [];
  this.uiScale = 2;
  this.createPanel();
  var cW = this.createActionButtons();
  this.createExtraButtons(cW);
  this.createMinimap();
}

Scene_Game.prototype.createPanel = function() {
  this.panel = new UI_Base(0, 0, "panel");
  this.panel.sprite.addAnimationExt("atlPanels", "idle", 1, "panel_classic.png");
  this.panel.sprite.playAnimation("idle");
  this.panel.sprite.scale.set(this.uiScale);
  this.panel.y = Core.resolution.y - this.panel.sprite.height;
  this.panel.z = 100;
  this.uiHeight = this.panel.sprite.height;
  this.stage.addChild(this.panel.sprite);
  this.ui.push(this.panel);
}

Scene_Game.prototype.createActionButtons = function() {
  var cA = 0;
  var cW = 0;
  for(var a in $gameMap.actions) {
    var action = $gameMap.actions[a];
    var actionSrc = $dataActions[a];
    var btn = new UI_Button(0, 0, "action" + cA.toString());

    btn.onClick.add(this.selectAction, this, [cA]);
    btn.addAnimation("up", "atlGUI", actionSrc.button.up);
    btn.addAnimation("down", "atlGUI", actionSrc.button.down);
    btn.sprite.scale.set(this.uiScale);
    btn.sprite.playAnimation("up");
    if(cA === 0) {
      this.actionSelected = a;
      btn.sprite.playAnimation("down");
    }
    btn.actionName = a;
    btn.label.text = action.amount.toString();

    btn.x = cW;
    cW += btn.sprite.width;
    btn.y = Core.resolution.y - btn.sprite.height;

    this.ui.push(btn);
    btn.refresh();
    this.stage.addChild(btn.sprite);
    cA++;
  }
  return cW;
}

Scene_Game.prototype.createExtraButtons = function(cW) {
  // Create pause button
  var btn = new UI_Button(0, 0, "pause");
  btn.onClick.add(this.pauseGame, this, [true]);
  btn.addAnimation("up", "atlGUI", ["Btn_Pause_0.png"]);
  btn.addAnimation("down", "atlGUI", ["Btn_Pause_1.png"]);
  btn.sprite.scale.set(this.uiScale);
  btn.sprite.playAnimation("up");
  btn.x = cW;
  cW += btn.sprite.width;
  btn.y = Core.resolution.y - btn.sprite.height;
  this.ui.push(btn);
  btn.refresh();
  this.stage.addChild(btn.sprite);
  // Create fast forward button
  var btn = new UI_Button(0, 0, "fastforward");
  btn.onClick.add(this.toggleFastForward, this, [true]);
  btn.addAnimation("up", "atlGUI", ["Btn_FastForward_0.png"]);
  btn.addAnimation("down", "atlGUI", ["Btn_FastForward_1.png"]);
  btn.sprite.scale.set(this.uiScale);
  btn.sprite.playAnimation("up");
  btn.x = cW;
  cW += btn.sprite.width;
  btn.y = Core.resolution.y - btn.sprite.height;
  this.ui.push(btn);
  btn.refresh();
  this.stage.addChild(btn.sprite);
  // Create grid button
  var btn = new UI_Button(0, 0, "grid");
  btn.onClick.add(this.toggleGrid, this, [true]);
  btn.addAnimation("up", "atlGUI", ["Btn_Grid_0.png"]);
  btn.addAnimation("down", "atlGUI", ["Btn_Grid_1.png"]);
  btn.sprite.scale.set(this.uiScale);
  btn.sprite.playAnimation("up");
  btn.x = cW;
  cW += btn.sprite.width;
  btn.y = Core.resolution.y - btn.sprite.height;
  this.ui.push(btn);
  btn.refresh();
  this.stage.addChild(btn.sprite);
}

Scene_Game.prototype.createMinimap = function() {
  this.minimap = new Minimap({ addCameraView: true, interactive: true });
  this.updateMinimap();
  this.stage.addChild(this.minimap);
}

Scene_Game.prototype.updateMinimap = function() {
  this.minimap.update();
  var maxWidth = 240;
  var maxHeight = this.panel.height - 1;
  this.minimap.height = (this.minimap.height / this.minimap.width) * maxWidth;
  this.minimap.width = maxWidth;
  this.minimap.position.set(Core.resolution.x - this.minimap.width, Core.resolution.y - this.minimap.height);
}

Scene_Game.prototype.initControls = function() {
  Input.mouse.button.LEFT.onPress.add(this._onMouseLeftDown, this);
  // Action select
  Input.key["1"].onPress.add(this.selectAction, this, [0]);
  Input.key["2"].onPress.add(this.selectAction, this, [1]);
  Input.key["3"].onPress.add(this.selectAction, this, [2]);
  Input.key["4"].onPress.add(this.selectAction, this, [3]);
  Input.key["5"].onPress.add(this.selectAction, this, [4]);
  Input.key["6"].onPress.add(this.selectAction, this, [5]);
  Input.key["7"].onPress.add(this.selectAction, this, [6]);
  Input.key["8"].onPress.add(this.selectAction, this, [7]);
  Input.key.F.onPress.add(this.toggleFastForward, this, [true]);
  Input.key[" "].onPress.add(this.pauseGame, this, [true]);
  Input.key.G.onPress.add(this.toggleGrid, this, [true]);
}

Scene_Game.prototype.releaseControls = function() {
  Input.mouse.button.LEFT.onPress.remove(this._onMouseLeftDown, this);
  Input.key["1"].onPress.remove(this.selectAction, this);
  Input.key["2"].onPress.remove(this.selectAction, this);
  Input.key["3"].onPress.remove(this.selectAction, this);
  Input.key["4"].onPress.remove(this.selectAction, this);
  Input.key["5"].onPress.remove(this.selectAction, this);
  Input.key["6"].onPress.remove(this.selectAction, this);
  Input.key["7"].onPress.remove(this.selectAction, this);
  Input.key["8"].onPress.remove(this.selectAction, this);
  Input.key.F.onPress.remove(this.toggleFastForward, this);
  Input.key[" "].onPress.remove(this.pauseGame, this);
  Input.key.G.onPress.remove(this.toggleGrid, this, [true]);
}

Scene_Game.prototype._onMouseLeftDown = function() {
  var elem = this.mouseOverUI();
  if(elem && elem.click) elem.click();
  else if(!elem && this.lemmingSelect) {
    if(this.actionSelected !== "" && $gameMap.actions[this.actionSelected]) {
      if($gameMap.actions[this.actionSelected].amount > 0) {
        var result = this.lemmingSelect.assignAction(this.actionSelected);
        if(result) {
          AudioManager.playSound("sndAction");
          $gameMap.actions[this.actionSelected].amount--;
          var elem = this.getActionButton(this.actionSelected);
          if(elem) {
            elem.label.text = $gameMap.actions[this.actionSelected].amount.toString();
            elem.refresh();
          }
        }
      }
    }
  }
}

Scene_Game.prototype.mouseOverUI = function() {
  this.sortUI();
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) return elem;
  }
  return null;
}

Scene_Game.prototype.sortUI = function() {
  this.ui.sort(function(a, b) {
    if(a.z > b.z) return 1;
    if(a.z < b.z) return -1;
    return 0;
  });
}

Scene_Game.prototype.selectAction = function(index) {
  var key = "action" + index.toString();
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.key === key) {
      elem.sprite.playAnimation("down");
      this.actionSelected = elem.actionName;
      AudioManager.playSound("sndUI_Click");
    }
    else if(elem.actionName) {
      elem.sprite.playAnimation("up");
    }
  }
}

Scene_Game.prototype.getUI_Element = function(key) {
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.key === key) return elem;
  }
  return null;
}

Scene_Game.prototype.getActionButton = function(actionName) {
  for(var a = 0;a < this.ui.length;a++) {
    var elem = this.ui[a];
    if(elem.actionName && elem.actionName === actionName) return elem;
  }
  return false;
}

Scene_Game.prototype.pauseGame = function(playSound) {
  this.paused = !this.paused;
  var elem = this.getUI_Element("pause");
  if(this.paused) elem.sprite.playAnimation("down");
  else elem.sprite.playAnimation("up");
  if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.toggleFastForward = function(playSound) {
  this.fastForward = !this.fastForward;
  var elem = this.getUI_Element("fastforward");
  if(this.fastForward) elem.sprite.playAnimation("down");
  else elem.sprite.playAnimation("up");
  if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.toggleGrid = function(playSound) {
  this.grid = !this.grid;
  var elem = this.getUI_Element("grid");
  if(this.grid) {
    elem.sprite.playAnimation("down");
    $gameMap.grid.visible = true;
  }
  else {
    elem.sprite.playAnimation("up");
    $gameMap.grid.visible = false;
  }
  if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.getLemmingUnderCursor = function() {
  var arr = $gameMap.getLemmings();
  // Filters
  if(Input.key.Q.down) arr = arr.filter(function(obj) { return obj.dir === Game_Lemming.DIR_LEFT; } );
  else if(Input.key.E.down) arr = arr.filter(function(obj) { return obj.dir === Game_Lemming.DIR_RIGHT; } );
  arr = arr.filter(function(obj) { return obj.interactive; } );
  // Action filters
  switch(this.actionSelected.toUpperCase()) {
    case "CLIMBER":
      arr = arr.filter(function(lemming) { return (!lemming.hasProperty("CLIMBER")); });
      break;
    case "FLOATER":
      arr = arr.filter(function(lemming) { return (!lemming.hasProperty("FLOATER")); });
      break;
    case "BOMBER":
      arr = arr.filter(function(lemming) { return (lemming.bomber.count === -1); } );
      break;
    case "BLOCKER":
      arr = arr.filter(function(lemming) { return (lemming.action !== Game_Lemming.ACTION_BLOCKER && lemming.onGround); } );
      break;
    case "BUILDER":
      arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_BUILDER || lemming.sprite.isAnimationPlaying('build-end')) && lemming.onGround); } );
      break;
    case "BASHER":
      arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_BASHER) && lemming.onGround); } );
      break;
    case "MINER":
      arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_MINER) && lemming.onGround); } );
      break;
    case "DIGGER":
      arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_DIGGER) && lemming.onGround); } );
      break;
  }
  // Select
  for(var a = 0;a < arr.length;a++) {
    var lem = arr[a];
    if(lem.mouseOver()) return lem;
  }
  return null;
}

Scene_Game.prototype.updateActionPreview = function() {
  // Update all action preview tiles
  this.actionPreview.alpha.value = Math.max(this.actionPreview.alpha.min, Math.min(this.actionPreview.alpha.max, this.actionPreview.alpha.value + this.actionPreview.alpha.speed));
  if(this.actionPreview.alpha.value === this.actionPreview.alpha.min) this.actionPreview.alpha.speed = -this.actionPreview.alpha.speed;
  else if(this.actionPreview.alpha.value === this.actionPreview.alpha.max) this.actionPreview.alpha.speed = -this.actionPreview.alpha.speed;
  for(var a = 0;a < this.actionPreview.tiles.length;a++) {
    var spr = this.actionPreview.tiles[a];
    spr.alpha = this.actionPreview.alpha.value;
    spr.visible = false;
  }
  if(this.lemmingSelect !== null) {
    switch(this.actionSelected) {
      case "blocker":
      case "bomber":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y) >> 4) << 4;
        spr.visible = true;
        break;
      case "builder":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + $gameMap.tileWidth * this.lemmingSelect.dir) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y) >> 4) << 4;
        spr.visible = true;
        break;
      case "basher":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + $gameMap.tileWidth * this.lemmingSelect.dir) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y) >> 4) << 4;
        spr.visible = true;
        break;
      case "miner":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x + $gameMap.tileWidth * this.lemmingSelect.dir) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y) >> 4) << 4;
        spr.visible = true;
        var spr = this.actionPreview.tiles[1];
        spr.x = ((this.lemmingSelect.x + $gameMap.tileWidth * this.lemmingSelect.dir) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + $gameMap.tileHeight) >> 4) << 4;
        spr.visible = true;
        break;
      case "digger":
        var spr = this.actionPreview.tiles[0];
        spr.x = ((this.lemmingSelect.x) >> 4) << 4;
        spr.y = ((this.lemmingSelect.y + $gameMap.tileHeight) >> 4) << 4;
        spr.visible = true;
        break;
    }
  }
}
