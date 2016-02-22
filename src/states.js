var $States = {};

$States._states = {};

$States.addState = function(label, state) {
  this._states[label] = state;
};

$States.getState = function(label) {
  return this._states[label];
};

$States.initStates = function() {
  for(var a in this._states) {
    game.state.add(a, this._states[a]);
  }
};
