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
    screenPrev: {
      x: 0,
      y: 0
    },
    world: {
      x: 0,
      y: 0
    },
    worldPrev: {
      x: 0,
      y: 0
    },
    realTime: {
      x: 0,
      y: 0
    }
  };
  this.onMove = new Signal();
  this.onMove.add(this.updatePosition, this, [], 100);
}

Input_Mouse.prototype.update = function() {
  this.position.screenPrev.x = this.position.screen.x;
  this.position.screenPrev.y = this.position.screen.y;
  this.position.screen.x = Math.floor((this.position.realTime.x - Core.rendererLeft) * Core.hRes);
  this.position.screen.y = Math.floor((this.position.realTime.y - Core.rendererTop) * Core.vRes);
  if($gameMap && $gameMap.world) {
    this.position.worldPrev.x = this.position.world.x;
    this.position.worldPrev.y = this.position.world.y;
    this.position.world.x = Math.floor((this.position.realTime.x - Core.rendererLeft) * Core.hRes / $gameMap.world.scale.x) + $gameMap.camera.rect.left;
    this.position.world.y = Math.floor((this.position.realTime.y - Core.rendererTop) * Core.vRes / $gameMap.world.scale.y) + $gameMap.camera.rect.top;
  }
}

Input_Mouse.prototype.updatePosition = function(e) {
  this.position.realTime.x = e.clientX;
  this.position.realTime.y = e.clientY;
}
