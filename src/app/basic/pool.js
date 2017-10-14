function Pool() {
  this.init.apply(this, arguments);
}

Pool.prototype.init = function(type, map, initArgs, startAmount) {
  if(!startAmount && startAmount !== 0) startAmount = 0;
  if(!initArgs) initArgs = [];
  this._type = type;
  this.map = map;
  this._initArgs = initArgs;
  this._objects = [];
  while(this._objects.length < startAmount) {
    this.create();
  }
}

Pool.prototype.spawn = function(x, y, args) {
  var obj = this.getFirstNotExisting();
  if(!obj) obj = this.create();
  obj.x = x;
  obj.y = y;
  obj.exists = true;
  if(obj.spawn) obj.spawn.apply(obj, args);
  return obj;
}

Pool.prototype.create = function() {
  var obj = eval("new " + this._type + "(" + this._initArgs.join(", ") + ");");
  this._objects.push(obj);
  obj.exists = false;
  obj.map = this.map;
  this.map.objects.push(obj);
  if(obj.sprite) this.map.world.addChild(obj.sprite);
  return obj;
}

Pool.prototype.listNotExisting = function() {
  var result = [];
  for(var a = 0;a < this._objects.length;a++) {
    var obj = this._objects[a];
    if(!obj.exists) result.push(obj);
  }
  return result;
}

Pool.prototype.getFirstNotExisting = function() {
  var list = this.listNotExisting();
  if(list.length > 0) return list.slice(0, 1)[0];
  return null;
}
