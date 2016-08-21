$dataActions.climber = {
  key: "action_climber",
  button: {
    up: ["Btn_Climber_0.png"],
    down: ["Btn_Climber_1.png"]
  },
  temp: {}
};

Game_Lemming.ACTION_CLIMB = { name: "Climber" };


$dataActions.climber.temp.Sprite_Lemming_initAnimations = Sprite_Lemming.prototype.initAnimations;
Sprite_Lemming.prototype.initAnimations = function() {
  $dataActions.climber.temp.Sprite_Lemming_initAnimations.call(this);
  this.addAnimationExt("atlLemming", "climb", 8, "sprLemming_Climb_%s.png");
  this.addAnimationExt("atlLemming", "climb-end", 8, "sprLemming_Climb_End_%s.png");
}

Game_Lemming.prototype._climbEndAnim = function() {
  this.y -= 8;
  this.action = Game_Lemming.ACTION_WALK;
  this.requestAnimation = "walk";
}
