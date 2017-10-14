function Alarm() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Alarm.prototype, {
  time: {
    get: function() { return this._time; },
    set: function(value) { this._time = Math.max(-1, Math.floor(value)); }
  },
  baseTime: {
    get: function() { return this._baseTime; },
    set: function(value) {
      this._baseTime = Math.max(-1, Math.floor(value));
      if(this._baseTime === 0) this._baseTime = -1;
    }
  }
});

Alarm.prototype.init = function() {
  this._time = -1;
  this._basetime = -1;
  this.onExpire = new Signal();
}

Alarm.prototype.update = function() {
  this.time--;
  if(this.time === 0) {
    this.onExpire.dispatch();
    if(this.baseTime > 0 && this.time === 0) this.time = this.baseTime;
  }
}

Alarm.prototype.stop = function() {
  this.time = -1;
}

Alarm.prototype.start = function(time) {
  if(!time) time = -1;
  if(time > 0) this.time = time;
  else if(time === -1 && this.baseTime > 0) this.time = this.baseTime;
}
