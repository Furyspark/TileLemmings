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
  this._data[type][obj.name] = Object.assign({}, obj);
};

DataManager.getDataDescriptor = function(type, name) {
  return this._data[type][name];
};
