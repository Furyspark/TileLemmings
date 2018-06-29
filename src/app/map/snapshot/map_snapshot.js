function Game_Map_SnapShot() {
  this.initialize.apply(this, arguments);
};

Game_Map_SnapShot.prototype.initialize = function(map) {
  this.recordSnapShot(map);
};

Game_Map_SnapShot.prototype.clear = function() {
  this.lemmings = [];
  this.props    = [];
  this.tiles    = [];
  this.actions  = {};
  this.map      = null;
  this.frame    = 0;
  this.saved    = 0;
};

Game_Map_SnapShot.prototype.recordSnapShot = function(map) {
  this.clear();
  if(map == null) return;
  // Record map
  this.map   = map;
  this.frame = map.frame;
  this.saved = map.saved;
  // Record actions
  for(let a in this.map.actions) {
    let action = this.map.actions[a];
    this.actions[a] = action.amount;
  }
  // Record lemmings
  let lemmings = map.getAllLemmings();
  for(let a = 0;a < lemmings.length;a++) {
    let lemming = lemmings[a];
    this.lemmings.push(new Game_Map_SnapShot_Lemming(lemming));
  }
  // Record props
  let props = map.getAllProps();
  for(let a = 0;a < props.length;a++) {
    let prop = props[a];
    this.props.push(new Game_Map_SnapShot_Prop(prop));
  }
  // Record tiles
  let tiles = map.tiles._data;
  for(let a = 0;a < tiles.length;a++) {
    let tile = tiles[a];
    this.tiles.push(new Game_Map_SnapShot_Tile(tile, a));
  }
};

Game_Map_SnapShot.prototype.apply = function() {
  let scene = SceneManager.current();
  // Apply map properties
  this.map.frame = this.frame;
  this.map.saved = this.saved;
  // Apply actions
  for(let a in this.actions) {
    let amount = this.actions[a];
    this.map.actions[a].amount = amount;
    let elem = scene.getActionButton(a);
    if(elem) {
      elem.label.text = amount.toString();
      elem.refresh();
    }
  }
  // Apply lemmings
  for(let a = 0;a < this.lemmings.length;a++) {
    let lemmingSnapShot = this.lemmings[a];
    lemmingSnapShot.apply();
  }
  // Apply props
  for(let a = 0;a < this.props.length;a++) {
    let propSnapShot = this.props[a];
    propSnapShot.apply();
  }
  // Apply tiles
  for(let a = 0;a < this.tiles.length;a++) {
    let tileSnapShot = this.tiles[a];
    tileSnapShot.apply();
  }
};
