var StateManager = {};

StateManager.states = {};

StateManager.add = function(key, state) {
  this.states[key] = state;
};

StateManager.getState = function(key) {
  return this.states[key];
};

StateManager.init = function() {
  for(var a in this.states) {
    var state = this.states[a];
    game.state.add(a, state);
  }
};
