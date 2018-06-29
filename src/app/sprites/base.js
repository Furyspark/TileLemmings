function Sprite_Base() {
  this.init.apply(this, arguments);
}

Sprite_Base.prototype = Object.create(PIXI.Sprite.prototype);
Sprite_Base.prototype.constructor = Sprite_Base;

Object.defineProperties(Sprite_Base.prototype, {
  x: {
    get: function() { return this.position.x; },
    set: function(value) { this.position.x = Math.floor(value); }
  },
  y: {
    get: function() { return this.position.y; },
    set: function(value) { this.position.y = Math.floor(value); }
  }
});

Sprite_Base.prototype.init = function(texture) {
  if(!texture) texture = null;
  PIXI.Sprite.prototype.constructor.call(this, texture);
  this.atlasData  = null;
  this.animations = {};
  this.animFrame  = 0;
  this.animSpeed  = 1;
  this.z          = 0;
  this.animKey    = "";
}

Sprite_Base.prototype.playAnimation = function(key) {
  if(this.animations[key] != null && (this.getCurrentAnimation() == null || (this.getCurrentAnimation() != null && this.getCurrentAnimation().name !== key))) {
    this.animKey = key;
    this.setFrame(0);
    return this.getCurrentAnimation();
  }
  return null;
}

Sprite_Base.prototype.addAnimation = function(name) {
  let anim = new Animation(name);
  this.animations[name] = anim;
  return anim;
}

Sprite_Base.prototype.addAnimationExt = function(atlas, name, frames, str) {
  let anim = this.addAnimation(name);
  for(let a = 0;a < frames;a++) {
    anim.addFrame(atlas, str.replace("%s", String(a)));
  }
}

Sprite_Base.prototype.getAnimation = function(key) {
  return this.animations[key];
}

Sprite_Base.prototype.getCurrentAnimation = function() {
  return this.animations[this.animKey];
};

Sprite_Base.prototype.isAnimationPlaying = function(key) {
  return (this.getCurrentAnimation() === this.animations[key]);
}

Sprite_Base.prototype.hasAnimation = function(key) {
  return (this.animations[key] instanceof Animation);
}

Sprite_Base.prototype.update = function() {
  // Update animation
  this.setFrame(this.animFrame + this.animSpeed);
}

/**
 * Sets the frame of an animation
 * @param {number} [frame=0] - The frame to set to. Rounds down.
 */
Sprite_Base.prototype.setFrame = function(frame) {
  if(!this.getCurrentAnimation()) return;
  if(frame == null) frame = 0;
  this.animFrame = frame % this.getCurrentAnimation().frames.length;
  // Set texture
  let targetTexture = this.getCurrentAnimation().frames[Math.floor(this.animFrame)];
  this.texture = targetTexture;
  // Dispatch alarm
  if(frame >= this.getCurrentAnimation().frames.length) this.getCurrentAnimation().onEnd.dispatch();
};
