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

SceneManager.update = function(dt) {
  if(this.current()) this.current().update(dt);
}

SceneManager.render = function(dt) {
  if(this.current()) this.current().render(dt);
}

SceneManager.getSceneByType = function(type) {
    for(var a = 0;a < this._stack.length;a++) {
        var scene = this._stack[a];
        if(scene instanceof type) return scene;
    }
    return null;
};
