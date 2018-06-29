function Game_Map_SnapShot_Lemming() {
  this.initialize.apply(this, arguments);
};

Game_Map_SnapShot_Lemming.prototype.initialize = function(lemming) {
  this.recordSnapShot(lemming);
};

Game_Map_SnapShot_Lemming.prototype.clear = function() {
  this.lemming        = null;
  this.x              = 0;
  this.y              = 0;
  this.dir            = 0;
  this.fallDistance   = 0;
  this.property       = 0;
  this.rotation       = 0;
  this.velocity       = new Point();
  this.onGround       = false;
  this.exists         = false;
  this.dead           = false;
  this.interactive    = true;
  this.physicsEnabled = true;
  this.disabled       = false;
  this.bomber = {
    count: 0
  };
  this.sprite = {
    animFrame: 0,
    animSpeed: 0,
    animKey: ""
  };
  this.action = {
    current: null,
    value: 0
  };
  this.alarms = {
    bomber: -1
  };
};

Game_Map_SnapShot_Lemming.prototype.recordSnapShot = function(lemming) {
  this.clear();
  if(lemming == null) return;
  this.lemming          = lemming;
  this.x                = lemming.x;
  this.y                = lemming.y;
  this.dir              = lemming.dir;
  this.fallDistance     = lemming.fallDistance;
  this.property         = lemming.property;
  this.rotation         = lemming.rotation;
  this.velocity.x       = lemming.velocity.x;
  this.velocity.y       = lemming.velocity.y;
  this.onGround         = lemming.onGround;
  this.exists           = lemming.exists;
  this.dead             = lemming.dead;
  this.interactive      = lemming.interactive;
  this.physicsEnabled   = lemming.physicsEnabled;
  this.disabled         = lemming.disabled;
  this.bomber.count     = lemming.bomber.count;
  this.sprite.animFrame = lemming.sprite.animFrame;
  this.sprite.animSpeed = lemming.sprite.animSpeed;
  this.sprite.animKey   = lemming.sprite.animKey;
  this.action.current   = lemming.action.current;
  this.action.value     = lemming.action.value;
  this.alarms.bomber    = lemming.alarms.bomber._time;
  this.alarms.action    = lemming.alarms.action._time;
};

Game_Map_SnapShot_Lemming.prototype.apply = function() {
  if(this.lemming == null) return;
  this.lemming.x                   = this.x;
  this.lemming.y                   = this.y;
  if(this.dir !== this.lemming.dir) this.lemming.changeDirection();
  this.lemming.action              = this.action;
  this.lemming.fallDistance        = this.fallDistance;
  this.lemming.property            = this.property;
  this.lemming.rotation            = this.rotation;
  this.lemming.velocity.x          = this.velocity.x;
  this.lemming.velocity.y          = this.velocity.y;
  this.lemming.onGround            = this.onGround;
  this.lemming.exists              = this.exists;
  this.lemming.dead                = this.dead;
  this.lemming.interactive         = this.interactive;
  this.lemming.physicsEnabled      = this.physicsEnabled;
  this.lemming.disabled            = this.disabled;
  // Set bomber stuff
  this.lemming.bomber.label.scale.x = 1 / this.lemming.sprite.scale.x;
  this.lemming.bomber.count         = this.bomber.count;
  this.lemming.bomber.label.text    = this.bomber.count.toString();
  this.lemming.bomber.label.visible = this.lemming.bomber.count >= 0;
  // Sprite manipulation
  this.lemming.sprite.playAnimation(this.sprite.animKey);
  this.lemming.sprite.setFrame(this.sprite.animFrame);
  this.lemming.sprite.animSpeed    = this.sprite.animSpeed;
  // Set action
  this.lemming.action.current = this.action.current;
  this.lemming.action.value   = this.action.value;
  // Alarms
  for(let a in this.alarms) {
    this.lemming.alarms[a]._time = this.alarms[a];
    if(this.lemming.alarms[a]._time >= 0) this.lemming.alarms[a].start();
  }
};
