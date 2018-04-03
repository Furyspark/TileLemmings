function Game_Tile() {
    this.init.apply(this, arguments);
}

Game_Tile.COLLISION_PASSABLE   = 0;
Game_Tile.COLLISION_IMPASSABLE = 1;
Game_Tile.COLLISION_ENDOFMAP   = 2;
Game_Tile.COLLISION_LIQUID     = 3;

Game_Tile.COLLISIONFUNC_AIR = function(realX, realY) {
    return Game_Tile.COLLISION_PASSABLE;
}
Game_Tile.COLLISIONFUNC_GROUND = function(realX, realY) {
    return Game_Tile.COLLISION_IMPASSABLE;
}
Game_Tile.COLLISIONFUNC_LIQUID = function(realX, realY) {
    return Game_Tile.COLLISION_LIQUID;
}

Game_Tile.PROPERTY_STEEL       = Math.pow(2, 0);
Game_Tile.PROPERTY_DIG_NOLEFT  = Math.pow(2, 1);
Game_Tile.PROPERTY_DIG_NORIGHT = Math.pow(2, 2);
Game_Tile.PROPERTY_DIG_NODOWN  = Math.pow(2, 3);
Game_Tile.PROPERTY_DIG_NOUP    = Math.pow(2, 4);

Object.defineProperties(Game_Tile.prototype, {
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

Game_Tile.prototype.init = function(texture) {
    this.sprite = new Sprite_Tile(texture);
    this.position = new Point();
    this.collisionFunction = Game_Tile.COLLISIONFUNC_GROUND;
    this.property = 0;
}

Game_Tile.prototype.assignProperty = function(name) {
    this.property = this.property | Game_Tile["PROPERTY_" + name.toUpperCase()];
}

Game_Tile.prototype.hasProperty = function(name) {
    return ((this.property & Game_Tile["PROPERTY_" + name.toUpperCase()]) === Game_Tile["PROPERTY_" + name.toUpperCase()]);
}

Game_Tile.prototype.removeProperty = function(name) {
    this.property = this.property & ~(Game_Tile["PROPERTY_" + name.toUpperCase()]);
}

Game_Tile.prototype.updateAnimation = function() {
    this.sprite.update();
};

Game_Tile.prototype.update = function() {
};
