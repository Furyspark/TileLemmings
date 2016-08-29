function Game_Lemming() {
  this.init.apply(this, arguments);
}

Game_Lemming.prototype = Object.create(Game_Base.prototype);
Game_Lemming.prototype.constructor = Game_Lemming;

Object.defineProperties(Game_Lemming.prototype, {
  rotation: {
    get: function() { return Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").get.call(this); },
    set: function(value) {
      var old = this._rotation;
      Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").set.call(this, value);
      this._rotation = value;
      for(var a in this.offsetPoint) {
        this.offsetPoint[a].rotate(value - old);
      }
      for(var a in this.offsetRect) {
        this.offsetRect[a].rotate(value - old);
      }
    },
    configurable: true
  }
});

Game_Lemming.DIR_RIGHT          = 1;
Game_Lemming.DIR_LEFT           = -1;
Game_Lemming.ACTION_FALL        = { name: "Faller" };
Game_Lemming.ACTION_WALK        = { name: "Walker" };
Game_Lemming.ACTION_CLIMBER     = { name: "Climber" };
Game_Lemming.ACTION_FLOATER     = { name: "Floater" };
Game_Lemming.ACTION_BOMBER      = { name: "Bomber" };
Game_Lemming.ACTION_BLOCKER     = { name: "Blocker" };
Game_Lemming.ACTION_BUILDER     = { name: "Builder" };
Game_Lemming.ACTION_BASHER      = { name: "Basher" };
Game_Lemming.ACTION_MINER       = { name: "Miner" };
Game_Lemming.ACTION_DIGGER      = { name: "Digger" };
Game_Lemming.ACTION_BASHER      = { name: "Basher" };
Game_Lemming.ACTION_MINER       = { name: "Miner" };
Game_Lemming.ACTION_DIGGER      = { name: "Digger" };
Game_Lemming.ACTION_DEAD        = { name: "Dead" };

Game_Lemming.DEATH_ENDOFMAP = 0;
Game_Lemming.DEATH_FALL     = 1;

Game_Lemming.PROPERTY_CLIMBER = Math.pow(2, 0);
Game_Lemming.PROPERTY_FLOATER = Math.pow(2, 1);

Game_Lemming.DIGSUCCESS_AIR    = 0;
Game_Lemming.DIGSUCCESS_NORMAL = 1;
Game_Lemming.DIGSUCCESS_STEEL  = 2;

Game_Lemming.prototype.init = function() {
  Game_Base.prototype.init.call(this);
  this.sprite           = new Sprite_Lemming();
  this.velocity         = new Point();
  this.rotation         = 0;
  this.dir              = Game_Lemming.DIR_RIGHT;
  this.property         = 0;
  this.action           = { current: Game_Lemming.ACTION_FALL };
  this.requestAnimation = "fall";
  this.fallDistance     = 0;
  this.onGround         = false;
  this.dead             = false;
  this.interactive      = true;
  this.physicsEnabled   = true;
  this.disabled         = false;

  this.offsetPoint = {
    floor: new Point(0, 1),
    ceiling: new Point(0, -17),
    moveOutOfGround: new Point(0, -1),
    slopeCheck: new Point(0, -16),
    fallSpeed: new Point(0, 1),
    walkSpeed: new Point(0.5, 0),
    climbSpeed: new Point(0, -0.25),
    floatSpeed: new Point(0, 0.5),
    right: new Point(1, 0),
    down: new Point(0, 1)
  };

  this.offsetRect = {
    blockRect: new Rect(-6, -12, 12, 13),
    clickArea: new Rect(-8, -16, 16, 16)
  };

  this.bomber = { count: -1, label: new Text() };
  this.bomber.label.style.fontSize = 10;
  this.sprite.addChild(this.bomber.label);
  this.bomber.label.position.set(0, -16);
  this.bomber.label.anchor.set(0.5, 1);
  this.bomber.label.visible = false;
  this.alarms.bomber = new Alarm();
  this.alarms.bomber.baseTime = 60;
  this.alarms.bomber.onExpire.add(this._bomberTimer, this);

  this.alarms.action = new Alarm();
  this.alarms.action.onExpire.add(this._actionTimer, this);
  this.alarms.action.baseTime = 90;
  this.action.builder = { value: 0 };
  this.initTriggers();
}

Game_Lemming.prototype.spawn = function(x, y) {
  Game_Base.prototype.spawn.call(this, x, y);
  this.dir                  = Game_Lemming.DIR_RIGHT;
  this.rotation             = 0;
  this.sprite.scale.x       = 1;
  this.property             = 0;
  this.onGround             = false;
  this.stopAction();
  this.fallDistance         = 0;
  this.dead                 = false;
  this.interactive          = true;
  this.physicsEnabled       = true;
  this.disabled             = false;
  this.bomber.label.visible = false;
  this.bomber.count = -1;
}

Game_Lemming.prototype.initTriggers = function() {
  this.sprite.animations["fall-death"].onEnd.add(this.remove, this);
  this.sprite.animations["explode"].onEnd.add(this.explode, this);
  this.sprite.animations["float-start"].onEnd.add(this._floatEndAnim, this);
  this.sprite.animations["exit"].onEnd.add(function() {
    this.map.saved++;
    this.exists = false;
  }, this);
  this.sprite.animations["explosion"].onEnd.add(this.remove, this);
  this.sprite.animations["burn"].onEnd.add(this.remove, this);
  this.sprite.animations["drown"].onEnd.add(this.remove, this);
  this.sprite.animations["build-end"].onEnd.add(this._buildEnd, this);
  this.sprite.animations["climb-end"].onEnd.add(this._climbEndAnim, this);
}

Game_Lemming.prototype.actionInitEval = function(key) {
  for(var a in $dataActions) {
    var action = $dataActions[a];
    if(action.initEval) eval(action.initEval);
  }
}

Game_Lemming.prototype.actionSpawnEval = function() {
  for(var a in $dataActions) {
    var action = $dataActions[a];
    if(action.spawnEval) eval(action.spawnEval);
  }
}

Game_Lemming.prototype.changeDirection = function() {
  if(this.dir === Game_Lemming.DIR_RIGHT) {
    this.dir = Game_Lemming.DIR_LEFT;
    this.sprite.scale.x = -1;
  }
  else if(this.dir === Game_Lemming.DIR_LEFT) {
    this.dir = Game_Lemming.DIR_RIGHT;
    this.sprite.scale.x = 1;
  }
}

Game_Lemming.prototype.update = function() {
  Game_Base.prototype.update.call(this);
  // Do physics
  if(this.physicsEnabled) {
    if(!this.dead) this.preMove();
    if(!this.dead) this.move();
    if(!this.dead) this.postMove();
  }
  // Evals
  this.bomber.label.scale.x = 1 / this.sprite.scale.x;
  // Play animation
  this.sprite.playAnimation(this.requestAnimation);
}

Game_Lemming.prototype.preMove = function() {
  var defaultAction = true;
  if(this.action.current === Game_Lemming.ACTION_CLIMBER) {
    defaultAction = false;
  }
  if(defaultAction) {
    // Check for ground
    var col = this.map.tileCollision(this.x + this.offsetPoint.floor.x, this.y + this.offsetPoint.floor.y, this);
    if(col === Game_Tile.COLLISION_PASSABLE) {
      this.onGround = false;
      if(!this.dead) this.fall();
    }
    else if(col === Game_Tile.COLLISION_IMPASSABLE) {
      if(!this.onGround) {
        if(this.offsetPoint.down.x > 0) this.x = (((this.x + this.offsetPoint.floor.x) >> 4) << 4) + this.offsetPoint.moveOutOfGround.x;
        else if(this.offsetPoint.down.x < 0) this.x = (((this.x + 16 + this.offsetPoint.floor.x) >> 4) << 4);
        if(this.offsetPoint.down.y > 0) this.y = (((this.y + this.offsetPoint.floor.y) >> 4) << 4) + this.offsetPoint.moveOutOfGround.y;
        else if(this.offsetPoint.down.y < 0) this.y = (((this.y + 16 + this.offsetPoint.floor.y) >> 4) << 4);
      }
      this.onGround = true;
      this.checkFallDeath();
      if(!this.dead) this.walk();
    }
  }
}

Game_Lemming.prototype.move = function() {
  var defaultAction = true;
  // Check for special tiles
  var col = this.map.tileCollision(this.x, this.y, this);
  if(col === Game_Tile.COLLISION_ENDOFMAP) {
    this.die(Game_Lemming.DEATH_ENDOFMAP);
  }
  else if(col === Game_Tile.COLLISION_LIQUID) {
    this.disable();
    this.requestAnimation = "drown";
    AudioManager.playSound("sndDrown");
  }
  // Evals
  if(this.action.current === Game_Lemming.ACTION_CLIMBER) {
    defaultAction = false;
    // Check for ceiling
    if(this.map.tileCollision(this.x + this.offsetPoint.ceiling.x, this.y + this.offsetPoint.ceiling.y, this) === Game_Tile.COLLISION_IMPASSABLE) {
      this.fall();
      this.changeDirection();
      defaultAction = true;
    }
    // Check for ledge
    else if(this.map.tileCollision(this.x + (this.offsetPoint.right.x * this.dir) - (this.offsetPoint.down.x * 8),
      this.y + (this.offsetPoint.right.y * this.dir) - (this.offsetPoint.down.y * 8), this) !== Game_Tile.COLLISION_IMPASSABLE) {
      this.velocity.set(0);
      this.requestAnimation = 'climb-end';
    }
    else {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
  }
  // Default move
  if(defaultAction) {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
  // Update fall time
  if(this.action.current === Game_Lemming.ACTION_FALL) {
    this.fallDistance += Math.abs(this.velocity.y);
    this.fallDistance += Math.abs(this.velocity.x);
  }
  else this.fallDistance = 0;
}

Game_Lemming.prototype.postMove = function() {
  // React to ground
  if(this.map.tileCollision(this.x, this.y, this) === Game_Tile.COLLISION_IMPASSABLE) {
    // Slope check
    if(this.map.tileCollision(this.x + this.offsetPoint.slopeCheck.x, this.y + this.offsetPoint.slopeCheck.y) === Game_Tile.COLLISION_PASSABLE &&
      !this.map.tileHasBlocker(this.x + this.offsetPoint.slopeCheck.x, this.y + this.offsetPoint.slopeCheck.y)) {
      var defaultAction = true;
      // Evals
      if(this.action.current === Game_Lemming.ACTION_CLIMBER) defaultAction = false;
      // Align to slope
      if(defaultAction) {
        this.x += this.offsetPoint.slopeCheck.x;
        this.y += this.offsetPoint.slopeCheck.y;
      }
    }
    else {
      var defaultAction = true;
      // Evals
      if(this.hasProperty("CLIMBER") && this.onGround) {
        defaultAction = false;
        if(this.action.current !== Game_Lemming.ACTION_CLIMBER) {
          this.action.current = Game_Lemming.ACTION_CLIMBER;
          this.requestAnimation = "climb";
          if(this.offsetPoint.right.x > 0) this.x = (((this.x + (this.dir === Game_Lemming.DIR_LEFT ? 16 : 0)) >> 4) << 4) - (this.dir === Game_Lemming.DIR_RIGHT ? this.offsetPoint.right.x : 0);
          else if(this.offsetPoint.right.x < 0) this.x = (((this.x + (this.dir === Game_Lemming.DIR_RIGHT ? 16 : 0)) >> 4) << 4) + (this.dir === Game_Lemming.DIR_LEFT ? this.offsetPoint.right.x : 0);
          if(this.offsetPoint.right.y > 0) this.y = (((this.y + (this.dir === Game_Lemming.DIR_LEFT ? 16 : 0)) >> 4) << 4) - (this.dir === Game_Lemming.DIR_RIGHT ? this.offsetPoint.right.y : 0);
          else if(this.offsetPoint.right.y < 0) this.y = (((this.y + (this.dir === Game_Lemming.DIR_RIGHT ? 16 : 0)) >> 4) << 4) + (this.dir === Game_Lemming.DIR_LEFT ? this.offsetPoint.right.y : 0);
          this.velocity.x = this.offsetPoint.climbSpeed.x;
          this.velocity.y = this.offsetPoint.climbSpeed.y;
        }
      }
      // Turn around
      if(defaultAction) {
        this.x -= this.velocity.x;
        this.y -= this.velocity.y;
        this.changeDirection();
      }
    }
  }
}

Game_Lemming.prototype.fall = function() {
  var defaultAction = true;
  // Evals
  if(this.hasProperty("FLOATER")) {
    defaultAction = false;
    this.action.current = Game_Lemming.ACTION_FLOATER;
    this.requestAnimation = "float-start";
    if(this.sprite.isAnimationPlaying("float")) this.requestAnimation = "float";
    this.velocity.x = this.offsetPoint.floatSpeed.x;
    this.velocity.y = this.offsetPoint.floatSpeed.y;
  }
  // Default action
  if(defaultAction) {
    this.action.current   = Game_Lemming.ACTION_FALL;
    this.requestAnimation = "fall";
    this.velocity.x       = this.offsetPoint.fallSpeed.x;
    this.velocity.y       = this.offsetPoint.fallSpeed.y;
  }
}

Game_Lemming.prototype.walk = function() {
  var defaultAction = true;
  // Evals
  if(this.action.current === Game_Lemming.ACTION_CLIMBER) defaultAction = false;
  else if(this.action.current === Game_Lemming.ACTION_BOMBER) {
    defaultAction = false;
    this.velocity.set(0);
  }
  if(this.action.current === Game_Lemming.ACTION_BLOCKER) {
    defaultAction = false;
    this.velocity.set(0);
  }
  else if(this.onGround) {
    var arr = this.map.getLemmings();
    for(var a = 0;a < arr.length;a++) {
      var lemming = arr[a];
      if(lemming !== this && lemming.action.current === Game_Lemming.ACTION_BLOCKER &&
        !lemming.offsetRect.blockRect.contains(this.x - lemming.x, this.y - lemming.y) && lemming.offsetRect.blockRect.contains((this.x + this.velocity.x) - lemming.x, (this.y + this.velocity.y) - lemming.y)) {
        this.changeDirection(); break;
      }
    }
  }
  if(this.action.current === Game_Lemming.ACTION_BUILDER || this.action.current === Game_Lemming.ACTION_BASHER ||
    this.action.current === Game_Lemming.ACTION_MINER || this.action.current === Game_Lemming.ACTION_DIGGER) {
    defaultAction = false;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }
  // Default action
  if(defaultAction) {
    this.action.current   = Game_Lemming.ACTION_WALK;
    this.requestAnimation = "walk";
    this.velocity.x       = this.offsetPoint.walkSpeed.x * this.dir;
    this.velocity.y       = this.offsetPoint.walkSpeed.y * this.dir;
  }
}

Game_Lemming.prototype.checkFallDeath = function() {
  if(this.fallDistance >= this.map.maxFallDistance) this.die(Game_Lemming.DEATH_FALL);
}

Game_Lemming.prototype.die = function(deathType) {
  this.interactive = false;
  this.dead = true;
  this.action.current = Game_Lemming.prototype.ACTION_DEAD;
  switch(deathType) {
    case Game_Lemming.DEATH_FALL:
      AudioManager.playSound("sndLemmingDeath_Fall");
      this.requestAnimation = "fall-death";
      break;
    case Game_Lemming.DEATH_ENDOFMAP:
    default:
      AudioManager.playSound("sndDie");
      this.remove();
      break;
  }
}

Game_Lemming.prototype.mouseOver = function() {
  if(Input.mouse.position.world.x >= this.x + this.offsetRect.clickArea.x && Input.mouse.position.world.x < this.x + this.offsetRect.clickArea.width &&
    Input.mouse.position.world.y >= this.y + this.offsetRect.clickArea.y && Input.mouse.position.world.y < this.y + this.offsetRect.clickArea.height) return true;
  return false;
}

Game_Lemming.prototype.build = function(offsetX, offsetY) {
  var xTo = (this.x + offsetX) >> 4;
  var yTo = (this.y + offsetY) >> 4;
  var oldTile = this.map.getTile(xTo << 4, yTo << 4);
  if(oldTile === null) {
    var tile = new Game_Tile(Core.tileset.generic.getTileTexture(0));
    this.map.replaceTile(xTo, yTo, tile);
  }
}

Game_Lemming.prototype.assignAction = function(actionName) {
  actionName = actionName.toUpperCase();
  if(actionName === "CLIMBER") {
    this.assignProperty("CLIMBER");
    return true;
  }
  else if(actionName === "FLOATER") {
    this.assignProperty("FLOATER");
    return true;
  }
  else if(actionName === "BOMBER") {
    this.nuke();
    return true;
  }
  else if(actionName === "BLOCKER") {
    this.action.current = Game_Lemming.ACTION_BLOCKER;
    this.requestAnimation = 'block';
    return true;
  }
  else if(actionName === "BUILDER") {
    this.action.current = Game_Lemming.ACTION_BUILDER;
    this.requestAnimation = "build";
    this.alarms.action.baseTime = 150;
    this.alarms.action.start();
    this.action.builder.value = 5;
    return true;
  }
  else if(actionName === "BASHER") {
    this.action.current = Game_Lemming.ACTION_BASHER;
    this.requestAnimation = "bash";
    this.alarms.action.baseTime = 90;
    this.alarms.action.start();
    return true;
  }
  else if(actionName === "MINER") {
    this.action.current = Game_Lemming.ACTION_MINER;
    this.requestAnimation = "mine";
    this.alarms.action.baseTime = 150;
    this.alarms.action.start();
    return true;
  }
  else if(actionName === "DIGGER") {
    this.action.current = Game_Lemming.ACTION_DIGGER;
    this.requestAnimation = "dig";
    this.alarms.action.baseTime = 90;
    this.alarms.action.start();
    return true;
  }
  // Was not able to assign action
  return false;
}

Game_Lemming.prototype.nuke = function() {
  this.bomber.count = 5;
  this.bomber.label.text = this.bomber.count.toString();
  this.bomber.label.visible = true;
  this.alarms.bomber.time = this.alarms.bomber.baseTime;
}

Game_Lemming.prototype.explode = function() {
  AudioManager.playSound("sndLemmingExplode");
  var digPoints = [];
  for(var a = -1;a < 2;a++) {
    for(var b = -1;b < 2;b++) {
      digPoints.push(new Point(a * this.map.tileWidth, b * this.map.tileHeight));
    }
  }
  for(var a = 0;a < digPoints.length;a++) {
    var pt = digPoints[a];
    var tile = this.map.getTile(this.x + pt.x, this.y + pt.y);
    if(tile && !tile.hasProperty("STEEL")) {
      this.map.removeTile((this.x + pt.x) >> 4, (this.y + pt.y) >> 4);
    }
  }
  this.requestAnimation = "explosion";
}

Game_Lemming.prototype.assignProperty = function(name) {
  this.property = this.property | Game_Lemming["PROPERTY_" + name.toUpperCase()];
}

Game_Lemming.prototype.hasProperty = function(name) {
  return ((this.property & Game_Lemming["PROPERTY_" + name.toUpperCase()]) === Game_Lemming["PROPERTY_" + name.toUpperCase()]);
}

Game_Lemming.prototype.removeProperty = function(name) {
  this.property = this.property & ~(Game_Lemming["PROPERTY_" + name.toUpperCase()]);
}

Game_Lemming.prototype.stopAction = function() {
  this.action.current = Game_Lemming.ACTION_WALK;
  this.requestAnimation = "walk";
  if(this.onGround) {
    this.action.current = Game_Lemming.ACTION_FALL;
    this.requestAnimation = "fall";
  }
  this.alarms.action.stop();
}

Game_Lemming.prototype._climbEndAnim = function() {
  this.x += (this.offsetPoint.right.x * this.dir) - (this.offsetPoint.down.x * 8);
  this.y += (this.offsetPoint.right.y * this.dir) - (this.offsetPoint.down.y * 8);
  this.action.current = Game_Lemming.ACTION_WALK;
  this.requestAnimation = "walk";
}

Game_Lemming.prototype._floatEndAnim = function() {
  this.sprite.playAnimation("float");
}

Game_Lemming.prototype._bomberTimer = function() {
  if(this.bomber.count >= 0) {
    this.bomber.count--;
    if(this.bomber.count === 0) {
      this._bomberStartExplode();
    }
    else {
      this.bomber.label.text = this.bomber.count.toString();
    }
  }
}

Game_Lemming.prototype._bomberStartExplode = function() {
  if(!this.onGround) this.explode();
  else {
    this.alarms.bomber.stop();
    this.bomber.label.visible = false;
    this.interactive = false;
    AudioManager.playSound("sndOhNo");
    this.action.current = Game_Lemming.ACTION_BOMBER;
    this.disable();
    this.requestAnimation = "explode";
  }
}

Game_Lemming.prototype.cancelBomber = function() {
  this.alarms.bomber.stop();
  this.bomber.label.visible = false;
}

Game_Lemming.prototype._actionTimer = function() {
  if(this.action.current === Game_Lemming.ACTION_BUILDER) this._buildUpdate();
  else if(this.action.current === Game_Lemming.ACTION_BASHER) this._bashUpdate();
  else if(this.action.current === Game_Lemming.ACTION_MINER) this._mineUpdate();
  else if(this.action.current === Game_Lemming.ACTION_DIGGER) this._digUpdate();
}

Game_Lemming.prototype._buildUpdate = function() {
  if(this.map.tileCollision(this.x - (this.offsetPoint.down.x * 16), this.y - (this.offsetPoint.down.y * 16), this) === Game_Tile.COLLISION_IMPASSABLE ||
  this.map.tileCollision(this.x + (this.offsetPoint.right.x * 16 * this.dir), this.y + (this.offsetPoint.right.y * 16 * this.dir), this) === Game_Tile.COLLISION_IMPASSABLE) {
    this.changeDirection();
    this.alarms.action.stop();
    this._buildEnd();
  }
  else {
    if(this.map.tileHasBlocker(this.x + ((this.offsetPoint.right.x * 16) * this.dir), this.y + ((this.offsetPoint.right.y * 16) * this.dir)) ||
      this.map.tileHasBlocker(this.x + ((this.offsetPoint.right.x * 16) * this.dir) - (this.offsetPoint.down.x * 16),
      this.y + ((this.offsetPoint.right.y * 16) * this.dir) - (this.offsetPoint.down.y * 16))) {
      this.changeDirection();
    }
    this.build((this.offsetPoint.right.x * 16 * this.dir), (this.offsetPoint.right.y * 16 * this.dir), true);
    this.x += (this.offsetPoint.right.x * 16 * this.dir) - (this.offsetPoint.down.x * 16);
    this.y += (this.offsetPoint.right.y * 16 * this.dir) - (this.offsetPoint.down.y * 16);
    this.action.builder.value--;
    if(this.action.builder.value < 2) {
      AudioManager.playSound('sndBuildEnding');
      if(this.action.builder.value === 0) {
        this.alarms.action.stop();
        this.requestAnimation = 'build-end';
      }
    }
  }
}

Game_Lemming.prototype._buildEnd = function() {
  this.action.current = Game_Lemming.ACTION_WALK;
  this.requestAnimation = 'walk';
}

Game_Lemming.prototype._bashUpdate = function() {
  var success = this.dig([new Point(this.offsetPoint.right.x * 16 * this.dir, this.offsetPoint.right.y * 16 * this.dir)],
    new Point(this.offsetPoint.right.x * 16 * this.dir, this.offsetPoint.right.y * 16 * this.dir));
  if(success !== Game_Lemming.DIGSUCCESS_NORMAL) this.stopAction();
}

Game_Lemming.prototype._mineUpdate = function() {
  var success = this.dig([
    new Point(this.offsetPoint.right.x * 16 * this.dir, this.offsetPoint.right.y * 16 * this.dir),
    new Point((this.offsetPoint.right.x * 16 * this.dir) + (this.offsetPoint.down.x * 16), (this.offsetPoint.right.y * 16 * this.dir) + (this.offsetPoint.down.y * 16))
  ], new Point((this.offsetPoint.right.x * 16 * this.dir) + (this.offsetPoint.down.x * 16), (this.offsetPoint.right.y * 16 * this.dir) + (this.offsetPoint.down.y * 16)));
  if(success === Game_Lemming.DIGSUCCESS_STEEL) this.stopAction();
}

Game_Lemming.prototype._digUpdate = function() {
  var success = this.dig([new Point(this.offsetPoint.down.x * 16, this.offsetPoint.down.y * 16)], new Point(this.offsetPoint.down.x * 16, this.offsetPoint.down.y * 16));
  if(success !== Game_Lemming.DIGSUCCESS_NORMAL) this.stopAction();
}

Game_Lemming.prototype.dig = function(targetPoints, adjustMovement) {
  if(!adjustMovement) adjustMovement = new Point(0, 0);
  var success = Game_Lemming.DIGSUCCESS_NORMAL;
  var airTiles = 0;
  // Check for blockers
  var blocked = false;
  for(var a = 0;a < targetPoints.length && !blocked;a++) {
    var pt = targetPoints[a];
    blocked = this.map.tileHasBlocker(this.x + pt.x, this.y + pt.y);
  }
  if(blocked) {
    this.changeDirection();
    adjustMovement.x = -adjustMovement.x;
    for(var a = 0;a < targetPoints.length;a++) {
      var pt = targetPoints[a];
      pt.x = -pt.x;
    }
  }
  // Remove tile(s)
  for(var a = 0;a < targetPoints.length;a++) {
    var target  = targetPoints[a];
    var tile    = this.map.getTile(this.x + target.x, this.y + target.y);
    var col     = this.map.tileCollision(this.x + target.x, this.y + target.y);
    // Hit steel
    if(tile && col === Game_Tile.COLLISION_IMPASSABLE) {
      if(tile.hasProperty("STEEL")) {
        success = Game_Lemming.DIGSUCCESS_STEEL;
        AudioManager.playSound("sndChink");
      }
      else this.map.removeTile((this.x + target.x) >> 4, (this.y + target.y) >> 4);
    }
    // Hit air
    else {
      airTiles++;
    }
  }
  if(airTiles === targetPoints.length && success === Game_Lemming.DIGSUCCESS_NORMAL) success = false;
  // Move in place
  if(success !== Game_Lemming.DIGSUCCESS_STEEL) {
    this.x += adjustMovement.x;
    this.y += adjustMovement.y;
  }
  return success;
}

Game_Lemming.prototype.exit = function() {
  this.requestAnimation = "exit";
  this.disable();
}

Game_Lemming.prototype.canExit = function() {
  return (this.physicsEnabled && !this.sprite.isAnimationPlaying("explode"));
}

Game_Lemming.prototype.disable = function() {
  this.cancelBomber();
  this.disabled = true;
  this.interactive = false;
  this.physicsEnabled = false;
}
