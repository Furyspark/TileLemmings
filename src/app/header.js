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
