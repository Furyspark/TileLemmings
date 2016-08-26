function Input_Mouse() {
  this.init.apply(this, arguments);
}

Input_Mouse.prototype.init = function() {
  this.button = {
    LEFT: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    },
    MIDDLE: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    },
    RIGHT: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    },
    WHEELUP: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    },
    WHEELDOWN: {
      down: false,
      pressed: false,
      released: false,
      onPress: new Signal(),
      onRelease: new Signal()
    }
  };
  this.position = {
    screen: {
      x: 0,
      y: 0
    },
    world: {
      x: 0,
      y: 0
    }
  };
}

Input_Mouse.prototype.updatePosition = function(e) {
  this.position.screen.x = Math.floor(e.clientX * Core.hRes);
  this.position.screen.y = Math.floor(e.clientY * Core.vRes);
  if($gameMap && $gameMap.world) {
    this.position.world.x = Math.floor(e.clientX * Core.hRes / $gameMap.world.scale.x) + $gameMap.camera.rect.left;
    this.position.world.y = Math.floor(e.clientY * Core.vRes / $gameMap.world.scale.y) + $gameMap.camera.rect.top;
  }
}
