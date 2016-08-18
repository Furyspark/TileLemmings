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
  var addFunc = function(name, frames, str) {
    var anim = this.addAnimation(name);
    for(var a = 0;a < frames;a++) {
      anim.addFrame("atlLemming", str.replace("%s", String(a)));
    }
  }.bind(this);
  addFunc("bash", 32, "sprLemming_Bash_%s.png");
  addFunc("block", 16, "sprLemming_Block_%s.png");
  addFunc("build-end", 10, "sprLemming_BuildEnd_%s.png");
  addFunc("build", 16, "sprLemming_Build_%s.png");
  addFunc("burn", 13, "sprLemming_Burn_%s.png");
  addFunc("climb", 8, "sprLemming_Climb_%s.png");
  addFunc("climb-end", 8, "sprLemming_Climb_End_%s.png");
  addFunc("dig", 8, "sprLemming_Dig_%s.png");
  addFunc("drown", 16, "sprLemming_Drown_%s.png");
  addFunc("exit", 8, "sprLemming_Exit_%s.png");
  addFunc("explode", 16, "sprLemming_Explode_%s.png");
  addFunc("fall-death", 16, "sprLemming_FallDeath_%s.png");
  addFunc("fall", 4, "sprLemming_Fall_%s.png");
  addFunc("float", 4, "sprLemming_Float_%s.png");
  addFunc("float-start", 4, "sprLemming_Float_Start_%s.png");
  addFunc("mine", 24, "sprLemming_Mine_%s.png");
  addFunc("walk", 10, "sprLemming_Move_%s.png");
}
