function DataManager() {};

DataManager._data = {};

DataManager.addDataType = function(name) {
  if(this._data[name] != null) {
    console.error("Attempt to create data type '" + name + "', but it already exists");
    return;
  }
  this._data[name] = {};
};

DataManager.addDataDescriptor = function(type, obj) {
  let type = arguments[0];
  let parentObj = {};
  if(obj.parent != null) {
    parentObj = this.getDataDescriptor(type, obj.parent);
  }
  this._data[type][obj.name] = Object.assign(parentObj, obj);
};

DataManager.getDataDescriptor = function(type, name) {
  return this._data[type][name];
};

DataManager.getParent = function(type, name) {
  let parent = this._data[type][name].parent;
  if(parent == null) return undefined;
  return this._data[type][parent];
};
