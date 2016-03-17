function ObjectPool() {
  this.initialize.apply(this, arguments);
};
ObjectPool.prototype.constructor = ObjectPool;

ObjectPool.prototype.initialize = function(objectType, objectArgs, initialAmount) {
  this.objectType = objectType;
  this.objectArgs = objectArgs || [];
  this.pool = [];

  if(initialAmount > 0) {
    for(var a = 0;a < initialAmount;a++) {
      this.pool.push($Core.newCall(this.objectType, this.objectArgs));
    }
  }
  return this;
};

ObjectPool.prototype.create = function(x, y, data) {
  var obj = this.getFirstNotExists();
  if(!obj) {
    obj = $Core.newCall(this.objectType, this.objectArgs);
    this.pool.push(obj);
  }

  obj.spawn(x, y, data);
  return obj;
};

ObjectPool.prototype.getFirstNotExists = function() {
  for(var a = 0;a < this.pool;a++) {
    var obj = this.pool[a];
    if(!obj.exists) return obj;
  }
  return null;
};
