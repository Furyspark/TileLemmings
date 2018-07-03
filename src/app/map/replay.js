function Replay() {
  this.initialize.apply(this, arguments);
};

Replay.prototype.initialize = function(map) {
  this._map = map;
  this._frames = {};
  this._active = true;
};

Replay.prototype.addAction = function(frame) {
  if(!this._frames[frame]) this._frames[frame] = [];
  let action = new ReplayAction(this);
  this._frames[frame].push(action);
  return action;
};

Replay.prototype.performActions = function() {
  let frameActions = this._frames[this._map.frame];
  if(frameActions == null) return;
  frameActionsCopy = frameActions.slice();
  while(frameActionsCopy.length > 0) {
    let frameAction = frameActionsCopy.splice(0, 1)[0];
    frameAction.performAction();
  }
};

Replay.prototype.stop = function() {
  this._active = false;
  this.cutFromFrame(this._map.frame);
};

Replay.prototype.isActive = function() {
  return this._active;
};

Replay.prototype.cutFromFrame = function(frame) {
  for(let frameIndex in this._frames) {
    if(parseInt(frameIndex) > frame) delete this._frames[frameIndex];
  }
};

Replay.prototype.getLastFrame = function() {
  let highest = -1;
  for(let frameIndex in this._frames) {
    if(parseInt(frameIndex) > highest) highest = parseInt(frameIndex);
  }
  return highest;
};

Replay.prototype.hasActionsRemaining = function() {
  let lastFrame = this.getLastFrame();
  return (lastFrame >= this._map.frame);
};
