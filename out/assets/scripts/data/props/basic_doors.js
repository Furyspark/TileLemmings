let parent = DataManager.getDataDescriptor("props", "GenericDoor");

// Cave Door
DataManager.addDataDescriptor("props", Object.assign({}, parent, {
  name: "Door_Cave"
}));
