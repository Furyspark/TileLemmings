var $gameMap        = null;
PIXI.addons         = {};
PIXI.addons.filters = {};

Math.radtodeg = function(rad) {
  return rad / Math.PI * 180;
}

Math.degtorad = function(deg) {
  return deg * Math.PI / 180;
}

Math.lengthdir_x = function(len, dir) {
  return Math.round((len * 100) * Math.cos(dir)) / 100;
}

Math.lengthdir_y = function(len, dir) {
  return -Math.round((len * 100) * Math.sin(dir)) / 100;
}

Array.prototype.stableSort = function(cmp) {
  cmp = !!cmp ? cmp : (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  };
  let stabilizedThis = this.map((el, index) => [el, index]);
  let stableCmp = (a, b) => {
    let order = cmp(a[0], b[0]);
    if (order != 0) return order;
    return a[1] - b[1];
  }
  stabilizedThis.sort(stableCmp);
  for (let i=0; i<this.length; i++) {
    this[i] = stabilizedThis[i][0];
  }
  return this;
}
