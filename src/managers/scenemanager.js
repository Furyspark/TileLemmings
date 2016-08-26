function SceneManager() {}

SceneManager._stack = [];

SceneManager.push = function(scene) {
  var currentScene = this.current();
  if(currentScene) currentScene.leave();
  this._stack.push(scene);
  scene.create();
}

SceneManager.pop = function() {
  var scene = this._stack.pop();
  scene.leave();
  scene.end();
  this.current().continue();
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
