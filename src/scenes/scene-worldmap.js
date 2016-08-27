function Scene_WorldMap() {
  this.init.apply(this, arguments);
}

Scene_WorldMap.prototype = Object.create(Scene_MenuBase.prototype);
Scene_WorldMap.prototype.constructor = Scene_WorldMap;

Scene_WorldMap.CONTENT_OFFSET     = new Point(120, 40);
Scene_WorldMap.CONTENT_BUTTONSIZE = new Point(128, 128);
Scene_WorldMap.CONTENT_PADDING    = 8;


Scene_WorldMap.prototype.init = function() {
  Scene_MenuBase.prototype.init.call(this);
  this.current = "root";

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
  this.fadeIn();
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
    var pos = new Point(
      Scene_WorldMap.CONTENT_OFFSET.x + ((Scene_WorldMap.CONTENT_BUTTONSIZE.x + Scene_WorldMap.CONTENT_PADDING) * content.position.x),
      Scene_WorldMap.CONTENT_OFFSET.y + ((Scene_WorldMap.CONTENT_BUTTONSIZE.y + Scene_WorldMap.CONTENT_PADDING) * content.position.y)
    );
    var btn = new UI_WorldButton(pos, UI_WorldButton["TYPE_" + content.type.toUpperCase()], [content.icon]);
    btn.onClick.add(this.fadeOut, this, [function(type, key) {
      this.enterWorld(type, key);
    }.bind(this, content.type, content.key)]);
    this.addUI(btn);
  }
}

Scene_WorldMap.prototype.createBackButton = function() {
  var elem = new UI_MenuButton(new Point(40, 40), "Back");
  this.addUI(elem);
  return elem;
}

Scene_WorldMap.prototype.clear = function() {
  while(this.ui.length > 0) {
    var elem = this.ui.pop();
    if(elem.sprite) this.stage.removeChild(elem.sprite);
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

Scene_WorldMap.prototype.enterWorld = function(type, key) {
  if(type === "world") {
    this.current = key;
    this.generateContent(this.current);
    this.fadeIn();
  }
  else if(type === "map") {
    SceneManager.push(new Scene_PreGame("assets/levels/" + this.current + "/" + key));
  }
}
