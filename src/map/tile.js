function Tile() {
  this.init.apply(this, arguments);
}

Tile.COLLISION_PASSABLE   = 0;
Tile.COLLISION_IMPASSABLE = 1;
Tile.COLLISION_ENDOFMAP   = 2;

Tile.COLLISIONFUNC_AIR = function(realX, realY) {
  return Tile.COLLISION_PASSABLE;
}
Tile.COLLISIONFUNC_GROUND = function(realX, realY) {
  return Tile.COLLISION_IMPASSABLE;
}

Tile.PROPERTY_STEEL = Math.pow(2, 0);

Object.defineProperties(Tile.prototype, {
  x: {
    get: function() { return this.position.x; },
    set: function(value) {
      this.position.x = value;
      if(this.sprite) this.sprite.position.x = value;
    }
  },
  y: {
    get: function() { return this.position.y; },
    set: function(value) {
      this.position.y = value;
      if(this.sprite) this.sprite.position.y = value;
    }
  }
});

Tile.prototype.init = function(texture) {
  this.sprite = new Sprite_Tile(texture);
  this.position = new Point();
  this.collisionFunction = Tile.COLLISIONFUNC_GROUND;
  this.property = 0;
}

Tile.prototype.assignProperty = function(name) {
  this.property = this.property | Tile["PROPERTY_" + name.toUpperCase()];
}

Tile.prototype.hasProperty = function(name) {
  return ((this.property & Tile["PROPERTY_" + name.toUpperCase()]) === Tile["PROPERTY_" + name.toUpperCase()]);
}

Tile.prototype.removeProperty = function(name) {
  this.property = this.property & ~(Tile["PROPERTY_" + name.toUpperCase()]);
}
