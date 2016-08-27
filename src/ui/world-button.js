function UI_WorldButton() {
  this.init.apply(this, arguments);
}

UI_WorldButton.prototype = Object.create(UI_Button.prototype);
UI_WorldButton.prototype.constructor = UI_WorldButton;

UI_WorldButton.TYPE_WORLD = 1;
UI_WorldButton.TYPE_MAP = 2;

UI_WorldButton.prototype.init = function(position, type, iconFrames) {
  UI_Button.prototype.init.call(this);
  if(!position) position = new Point(0, 0);
  if(!type) type = UI_WorldButton.TYPE_WORLD;
  if(!iconFrames) iconFrames = [];
  this.rect = new Rect();
  this.type = type;
  this.subSprites = {};
  this.initGraphics(iconFrames);
  this.x = position.x;
  this.y = position.y;
  this.onClick.add(this.playSound_Click, this);
}

UI_WorldButton.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}

UI_WorldButton.prototype.click = function() {
  this.onClick.dispatch();
}

UI_WorldButton.prototype.initGraphics = function(iconFrames) {
  var spriteKeys = {
    fg: "button-fg_world.png",
    bg: "button-bg_world.png"
  };
  if(this.type === UI_WorldButton.TYPE_MAP) {
    spriteKeys.fg = "button-fg_level.png";
    spriteKeys.bg = "button-bg_level.png";
  }
  // Add background
  this.subSprites.background = new Sprite_Base();
  this.subSprites.background.addAnimationExt("atlWorldMap", "idle", 1, spriteKeys.bg);
  this.subSprites.background.playAnimation("idle");
  this.sprite.addChild(this.subSprites.background);
  // Add icon
  this.subSprites.icon = new Sprite_Base();
  var anim = this.subSprites.icon.addAnimation("idle");
  for(var a = 0;a < iconFrames.length;a++) {
    var frame = iconFrames[a];
    anim.addFrame("atlWorldMap", frame);
  }
  this.subSprites.icon.playAnimation("idle");
  this.subSprites.icon.anchor.set(0.5);
  this.subSprites.icon.position.set(this.subSprites.background.width / 2, this.subSprites.background.height / 2);
  this.sprite.addChild(this.subSprites.icon);
  // Add frame
  this.subSprites.frame = new Sprite_Base();
  this.subSprites.frame.addAnimationExt("atlWorldMap", "idle", 1, spriteKeys.fg);
  this.subSprites.frame.playAnimation("idle");
  this.sprite.addChild(this.subSprites.frame);

  this.refresh();
}

UI_WorldButton.prototype.refresh = function() {
  UI_Button.prototype.refresh.call(this);
  // Update rect
  if(this.rect) {
    this.rect.x = this.x;
    this.rect.y = this.y;
    this.rect.width = this.subSprites.background.width;
    this.rect.height = this.subSprites.background.height;
  }
}
