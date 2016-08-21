function Game_Base() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Game_Base.prototype, {
  exists: {
    get: function() { return this._exists; },
    set: function(value) {
      this._exists = value;
      if(this.sprite) this.sprite.visible = this._exists;
    }
  },
  x: {
    get: function() { return this._x; },
    set: function(value) {
      this._x = value;
      if(this.sprite) this.sprite.x = value;
    }
  },
  y: {
    get: function() { return this._y; },
    set: function(value) {
      this._y = value;
      if(this.sprite) this.sprite.y = value;
    }
  }
});

Game_Base.prototype.init = function() {
  this._exists = true;
  this._x = 0;
  this._y = 0;
  this.sprite = null;
  this.alarms = {};
  this.map = null;
}

Game_Base.prototype.spawn = function(args) {}

Game_Base.prototype.update = function() {
  // Update sprite
  if(this.sprite && this.sprite.update) this.sprite.update();
  // Update alarms
  for(var a in this.alarms) {
    this.alarms[a].update();
  }
}

Game_Base.prototype.remove = function() {
  this.exists = false;
}
