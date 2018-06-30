function Game_Map_SnapShot_Prop() {
  this.initialize.apply(this, arguments);
};

Game_Map_SnapShot_Prop.prototype.initialize = function(prop) {
  this.recordSnapShot(prop);
};

Game_Map_SnapShot_Prop.prototype.clear = function() {
  this.prop     = null;
  this.rotation = 0;
  this.rate     = 0;
  this.value    = 0;
  this.sprite = {
    animFrame: 0,
    animSpeed: 0,
    animKey: ""
  };
  this.alarms = {
    door: -1
  };
};

Game_Map_SnapShot_Prop.prototype.recordSnapShot = function(prop) {
  this.clear();
  if(prop == null) return;
  this.prop             = prop;
  this.rotation         = prop.rotation;
  this.sprite.animFrame = prop.sprite.animFrame;
  this.sprite.animSpeed = prop.sprite.animSpeed;
  this.sprite.animKey   = prop.sprite.animKey;
  if(prop.type === "door") {
    this.alarms.door      = prop.alarms.door._time;
    this.rate             = prop.rate;
    this.value            = prop.value;
  }
};

Game_Map_SnapShot_Prop.prototype.apply = function() {
  this.prop.rotation = this.rotation;
  // Door
  if(this.prop.type === "door") {
    this.prop.rate              = this.rate;
    this.prop.value             = this.value;
    this.prop.alarms.door._time = this.alarms.door;
  }
  // Sprite manipulation
  this.prop.sprite.playAnimation(this.sprite.animKey);
  this.prop.sprite.setFrame(this.sprite.animFrame);
  this.prop.sprite.animSpeed = this.sprite.animSpeed;
};
