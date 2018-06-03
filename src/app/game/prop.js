function Game_Prop() {
  this.initialize.apply(this, arguments);
};

Game_Prop.prototype = Object.create(Game_Base.prototype);
Game_Prop.prototype.constructor = Game_Prop;

Object.defineProperties(Game_Prop.prototype, {
  rotation: {
    get: function() { return Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").get.call(this); },
    set: function(value) {
      let old = this._rotation;
      Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").set.call(this, value);
      this._rotation = value;
      for(let a in this._points) {
        this._points[a].rotate(value - old);
      }
      for(let a in this._areas) {
        this._areas[a].rotate(value - old);
      }
    },
    configurable: true
  }
});

Game_Prop.prototype.initialize = function(key, map) {
  Game_Base.prototype.init.call(this);
  this._key = key;
  this._rotation = 0;
  this._areas = {};
  this._points = {};
  this._sprite = new Sprite_Prop();

  this.runScript("onInitialize");
};

Game_Prop.prototype.getSource = function() {
  return DataManager.getDataDescriptor("props", this._key);
};

Game_Prop.prototype.runScript = function(name) {
  if(this.getSource()[name] == null) return undefined;
  let extraArgs = [];
  for(let a = 1;a < arguments.length;a++) {
    extraArgs.push(arguments[a]);
  }
  // Run script
  return this.getSource()[name].apply(this, [this.getSource()].concat(extraArgs));
};

Game_Prop.prototype.addArea = function(name, area) {
  this._areas[name] = area;
  area.rotate(this._rotation);
};

Game_Prop.prototype.addPoint = function(name, point) {
  this._points[name] = point;
  point.rotate(this._rotation);
};
