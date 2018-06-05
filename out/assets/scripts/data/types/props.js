DataManager.addDataType("props");

// Generic
DataManager.addDataDescriptor("props", {
  name: "Generic"
});

// Generic Door
DataManager.addDataDescriptor("props", Object.assign({}, DataManager.getDataDescriptor("props", "Generic"), {
  name: "GenericDoor"
}));

// Generic Exit
DataManager.addDataDescriptor("props", Object.assign({}, DataManager.getDataDescriptor("props", "Generic"), {
  name: "GenericExit"
}));
