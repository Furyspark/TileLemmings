function Sprite_Lemming() {
  this.init.apply(this, arguments);
}

Sprite_Lemming.prototype = Object.create(Sprite_Base.prototype);
Sprite_Lemming.prototype.constructor = Sprite_Lemming;

Sprite_Lemming.prototype.init = function() {
  Sprite_Base.prototype.init.call(this);
  this.z = -100;
  this.animSpeed = 1 / 4;
  this.anchor.set(0.5);
  this.initAnimations();
}

Sprite_Lemming.prototype.initAnimations = function() {
  this.addAnimationExt("atlLemming", "burn", 13, "sprLemming_Burn_%s.png");
  this.addAnimationExt("atlLemming", "drown", 16, "sprLemming_Drown_%s.png");
  this.addAnimationExt("atlLemming", "exit", 8, "sprLemming_Exit_%s.png");
  this.addAnimationExt("atlLemming", "explode", 16, "sprLemming_Explode_%s.png");
  this.addAnimationExt("atlLemming", "fall-death", 16, "sprLemming_FallDeath_%s.png");
  this.addAnimationExt("atlLemming", "fall", 4, "sprLemming_Fall_%s.png");
  this.addAnimationExt("atlLemming", "walk", 10, "sprLemming_Move_%s.png");
  this.addAnimationExt("atlLemming", "bash", 32, "sprLemming_Bash_%s.png");
  this.addAnimationExt("atlLemming", "block", 16, "sprLemming_Block_%s.png");
  this.addAnimationExt("atlLemming", "build", 16, "sprLemming_Build_%s.png");
  this.addAnimationExt("atlLemming", "build-end", 10, "sprLemming_BuildEnd_%s.png");
  this.addAnimationExt("atlLemming", "dig", 8, "sprLemming_Dig_%s.png");
  this.addAnimationExt("atlLemming", "mine", 24, "sprLemming_Mine_%s.png");
  this.addAnimationExt("atlLemming", "climb", 8, "sprLemming_Climb_%s.png");
  this.addAnimationExt("atlLemming", "climb-end", 8, "sprLemming_Climb_End_%s.png");
  this.addAnimationExt("atlLemming", "float", 4, "sprLemming_Float_%s.png");
  this.addAnimationExt("atlLemming", "float-start", 4, "sprLemming_Float_Start_%s.png");
}
