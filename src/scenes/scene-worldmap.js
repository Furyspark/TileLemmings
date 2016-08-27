function Scene_WorldMap() {
  this.init.apply(this, arguments);
}

Scene_WorldMap.prototype = Object.create(Scene_MenuBase.prototype);
Scene_WorldMap.prototype.constructor = Scene_WorldMap;

Scene_WorldMap.CONTENT_OFFSET     = new Point(120, 40);
Scene_WorldMap.CONTENT_BUTTONSIZE = new Point(128, 128);
Scene_WorldMap.CONTENT_DATASIZE   = new Point(8, 5);
Scene_WorldMap.CONTENT_PADDING    = 8;


Scene_WorldMap.prototype.init = function() {
  Scene_MenuBase.prototype.init.call(this);
  this.current = "root";
  this.clearData();
  this.volatileGraphics = [];

  if(Cache.hasJSON("world")) Cache.removeJSON("world");
  var obj = Loader.loadJSON("world", "assets/data/world.json");
  obj.onComplete.addOnce(this.start, this);
}

Scene_WorldMap.prototype.start = function() {
  this.worldData = Cache.getJSON("world");
  this.generateContent(this.current);
  this.fadeIn();
}

Scene_WorldMap.prototype.continue = function() {
  Scene_MenuBase.prototype.continue.call(this);
  this.generateContent(this.current);
  this.fadeIn();
}

Scene_WorldMap.prototype.clearData = function() {
  this.data = [];
  this.data.width = Scene_WorldMap.CONTENT_DATASIZE.x;
  this.data.height = Scene_WorldMap.CONTENT_DATASIZE.y;
  while(this.data.length < this.data.width * this.data.height) {
    this.data.push(null);
  }
  // Function: Replace
  this.data.replace = function(x, y, obj) {
    var index = (x * this.width) + y;
    return this.splice(index, 1, obj)[0];
  }
}

Scene_WorldMap.prototype.getDir = function(key) {
  return this.worldData[key];
}

Scene_WorldMap.prototype.generateContent = function(key) {
  // Remove old content
  this.clear();

  var dir = this.getDir(key);
  // Create back button
  var elem = this.createBackButton();
  elem.onClick.add(this.fadeOut, this, [function() {
    this.goBack();
  }.bind(this)]);
  // Create content
  for(var a = 0;a < dir.contents.length;a++) {
    var content = dir.contents[a];
    this.createWorldButton(content);
  }
  this.parseWorldButtonRequirements();
}

Scene_WorldMap.prototype.createWorldButton = function(src) {
  // Determine position
  var pos = new Point(
    Scene_WorldMap.CONTENT_OFFSET.x + ((Scene_WorldMap.CONTENT_BUTTONSIZE.x + Scene_WorldMap.CONTENT_PADDING) * src.position.x),
    Scene_WorldMap.CONTENT_OFFSET.y + ((Scene_WorldMap.CONTENT_BUTTONSIZE.y + Scene_WorldMap.CONTENT_PADDING) * src.position.y)
  );
  // Create button
  var btn = new UI_WorldButton(pos, UI_WorldButton["TYPE_" + src.type.toUpperCase()], [src.icon]);
  btn.key = src.key;
  // Add event
  btn.onClick.add(this.fadeOut, this, [function(type, key) {
    this.enterWorld(btn, type, key);
  }.bind(this, src.type, src.key)]);
  // Add to UI list
  this.addUI(btn);
  // Add to data list
  this.data.replace(src.position.x, src.position.y, btn);
  return btn;
}

Scene_WorldMap.prototype.parseWorldButtonRequirements = function() {
  var dir = this.getDir(this.current);
  for(var a = 0;a < dir.contents.length;a++) {
    var src = dir.contents[a];
    var btn = this.getWorldButton(src.key);
    // Map already completed
    if(SaveManager.getMapCompletion(this.current, src.key)) {
      btn.setCompletion(UI_WorldButton.COMPLETE_COMPLETE);
    }
    // Determine requirements
    else {
      var meetsRequirements = true;
      // Determine requirements
      if(btn && src && src.require) {
        for(var a = 0;a < src.require.length;a++) {
          var requirement = src.require[a];
          // Map completion
          if(requirement.type === "map-completion") {
            var result = this.parseWorldButtonRequirement_MapCompletion(btn, requirement);
            if(meetsRequirements === true) meetsRequirements = result;
          }
        }
      }
      // Set map completion
      if(meetsRequirements) btn.setCompletion(UI_WorldButton.COMPLETE_INCOMPLETE);
      else btn.setCompletion(UI_WorldButton.COMPLETE_LOCKED);
    }
  }
}

Scene_WorldMap.prototype.parseWorldButtonRequirement_MapCompletion = function(btn, requirement) {
  if(requirement.dir === this.current) {
    var btnTo = this.getWorldButton(requirement.key);
    var arrow = this.createArrow(btn.centerPos, btnTo.centerPos, 0x0000ff, 0x0000aa);
  }
  if(SaveManager.getMapCompletion(requirement.dir, requirement.key)) return true;
  return false;
}

Scene_WorldMap.prototype.createArrow = function(fromPos, toPos, lineColor, arrowColor) {
  var gfx = new PIXI.Graphics();
  var len = fromPos.distanceTo(toPos);
  var arrowHeadSize = 24;
  var arrowHeadWidth = 36;
  gfx.beginFill(lineColor)
    .drawRect(0, -3, len - arrowHeadSize, 6)
    .endFill()
    .beginFill(arrowColor)
    .drawPolygon([
      new Point((len - arrowHeadSize), -(arrowHeadWidth / 2)),
      new Point((len - arrowHeadSize), (arrowHeadWidth / 2)),
      new Point(len, 0)
    ])
    .endFill();
  gfx.rotation = fromPos.rotationTo(toPos);
  gfx.position.set(fromPos.x, fromPos.y);
  gfx.z = 10;
  this.volatileGraphics.push(gfx);
  this.stage.addChild(gfx);
  return gfx;
}

Scene_WorldMap.prototype.getWorldButton = function(key) {
  for(var a = 0;a < this.data.length;a++) {
    var obj = this.data[a];
    if(obj && obj.key === key) return obj;
  }
  return null;
}

Scene_WorldMap.prototype.createBackButton = function() {
  var elem = new UI_MenuButton(new Point(40, 40), "Back");
  this.addUI(elem);
  return elem;
}

Scene_WorldMap.prototype.clear = function() {
  this.clearData();
  while(this.ui.length > 0) {
    var elem = this.ui.pop();
    if(elem.sprite) this.stage.removeChild(elem.sprite);
  }
  while(this.volatileGraphics.length > 0) {
    var elem = this.volatileGraphics.pop();
    elem.destroy();
  }
}

Scene_WorldMap.prototype.goBack = function() {
  var dir = this.getDir(this.current);
  if(dir.previous === null) {
    SceneManager.pop();
  }
  else {
    this.current = dir.previous;
    this.generateContent(this.current);
    this.fadeIn();
  }
}

Scene_WorldMap.prototype.enterWorld = function(btn, type, key) {
  if(type === "world") {
    this.current = key;
    this.generateContent(this.current);
    this.fadeIn();
  }
  else if(type === "map") {
    $gameTemp.currentMap = { world: this.current, key: key };
    SceneManager.push(new Scene_PreGame("assets/levels/" + this.current + "/" + key));
  }
}
