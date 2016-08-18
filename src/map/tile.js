function Tile() {
  this.init.apply(this, arguments);
}

Object.defineProperties(Tile.prototype, {
  x: {
    get: function() { return this._x; },
    set: function(value) {
      this._x = value;
      if(this.sprite) this.sprite.position.x = value;
    }
  },
  y: {
    get: function() { return this._y; },
    set: function(value) {
      this._y = value;
      if(this.sprite) this.sprite.position.y = value;
    }
  }
});

Tile.prototype.init = function(texture) {
  this.sprite = new Sprite_Tile(texture);
  this.x = 0;
  this.y = 0;
}
