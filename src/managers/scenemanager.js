function SceneManager() {}

SceneManager._stack = [];

SceneManager.push = function(scene) {
  this._stack.push(scene);
  scene.create();
}

SceneManager.pop = function() {
  this._stack.pop();
}

SceneManager.current = function() {
  if(this._stack.length === 0) return null;
  return this._stack.slice(-1)[0];
}

SceneManager.update = function() {
  if(this.current()) this.current().update();
}

SceneManager.render = function() {
  if(this.current()) this.current().render();
}
