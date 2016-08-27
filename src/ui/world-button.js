function UI_WorldButton() {
  this.init.apply(this, arguments);
}

UI_WorldButton.prototype = Object.create(UI_Button.prototype);
UI_WorldButton.prototype.constructor = UI_WorldButton;

UI_WorldButton.TYPE_WORLD = 1;
UI_WorldButton.TYPE_MAP = 2;

UI_WorldButton.COMPLETE_LOCKED     = 1;
UI_WorldButton.COMPLETE_INCOMPLETE = 2;
UI_WorldButton.COMPLETE_COMPLETE   = 3;

Object.defineProperties(UI_WorldButton.prototype, {
  centerPos: {
    get: function() {
      return new Point(this.rect.x + this.rect.width / 2, this.rect.y + this.rect.height / 2);
    }
  }
});


UI_WorldButton.prototype.init = function(position, type, iconFrames, complete) {
  UI_Button.prototype.init.call(this);
  if(!position) position = new Point(0, 0);
  if(!type) type = UI_WorldButton.TYPE_WORLD;
  if(!iconFrames) iconFrames = [];
  if(!complete) complete = UI_WorldButton.COMPLETE_LOCKED;
  this.rect = new Rect();
  this.type = type;
  this.complete = complete;
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
  if(this.complete && this.complete !== UI_WorldButton.COMPLETE_LOCKED) this.onClick.dispatch();
}

UI_WorldButton.prototype.initGraphics = function(iconFrames) {
  // Add background
  this.createBackground();
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
  this.subSprites.icon.z = 0;
  this.sprite.addChild(this.subSprites.icon);
  // Add frame
  this.createFrame();

  this.refresh();
}

UI_WorldButton.prototype.refresh = function() {
  UI_Button.prototype.refresh.call(this);
  // Update Z-Ordering
  this.sprite.children.sort(function(a, b) {
    return b.z - a.z;
  });
  // Update rect
  if(this.rect) {
    this.rect.x = this.x;
    this.rect.y = this.y;
    this.rect.width = this.subSprites.background.width;
    this.rect.height = this.subSprites.background.height;
  }
}

UI_WorldButton.prototype.setCompletion = function(completion) {
  if(this.complete !== completion) {
    this.complete = completion;
    this.sprite.removeChild(this.subSprites.frame);
    this.sprite.removeChild(this.subSprites.background);
    this.createBackground();
    this.createFrame();
    this.refresh();
  }
}

UI_WorldButton.prototype.createBackground = function() {
  if(this.subSprites.background) this.sprite.removeChild(this.subSprites.background);

  var spriteKey = "button-bg_world.png";
  if(this.type === UI_WorldButton.TYPE_MAP) {
    // Locked
    if(this.complete === UI_WorldButton.COMPLETE_LOCKED) spriteKey = "button-bg_level-locked.png";
    // Incomplete
    else if(this.complete === UI_WorldButton.COMPLETE_INCOMPLETE) spriteKey = "button-bg_level-incomplete.png";
    // Complete
    else if(this.complete === UI_WorldButton.COMPLETE_COMPLETE) spriteKey = "button-bg_level.png";
  }

  this.subSprites.background = new Sprite_Base();
  this.subSprites.background.addAnimationExt("atlWorldMap", "idle", 1, spriteKey);
  this.subSprites.background.playAnimation("idle");
  this.subSprites.background.z = 5;
  this.sprite.addChild(this.subSprites.background);
}

UI_WorldButton.prototype.createFrame = function() {
  if(this.subSprites.frame) this.sprite.removeChild(this.subSprites.frame);

  var spriteKey = "button-fg_world.png";
  if(this.type === UI_WorldButton.TYPE_MAP) {
    // Locked
    if(this.complete === UI_WorldButton.COMPLETE_LOCKED) spriteKey = "button-fg_level-locked.png";
    // Incomplete
    else if(this.complete === UI_WorldButton.COMPLETE_INCOMPLETE) spriteKey = "button-fg_level-incomplete.png";
    // Complete
    else if(this.complete === UI_WorldButton.COMPLETE_COMPLETE) spriteKey = "button-fg_level.png";
  }

  this.subSprites.frame = new Sprite_Base();
  this.subSprites.frame.addAnimationExt("atlWorldMap", "idle", 1, spriteKey);
  this.subSprites.frame.playAnimation("idle");
  this.subSprites.frame.z = -5;
  this.sprite.addChild(this.subSprites.frame);
}
