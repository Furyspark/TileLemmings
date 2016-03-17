"use strict";

var GameData = {
	tile: {
		type: {
			AIR: 0,
			TILE: 1,
			STEEL: 2,
			WATER: 3,
			BLOCKER: 4
		},
		width: 16,
		height: 16
	},
	actions: {
		"climber": {},
		"floater": {},
		"exploder": {},
		"blocker": {},
		"builder": {},
		"basher": {},
		"miner": {},
		"digger": {}
	},

  resolution: {
    width: 800,
    height: 600
  }
};

Object.defineProperties(GameData.resolution, {
  aspectRatio: { get: function() { return this.width / this.height; } }
});


GameData.tile.floorTiles = [
	GameData.tile.type.TILE,
	GameData.tile.type.STEEL
];
GameData.tile.wallTiles = [
	GameData.tile.type.TILE,
	GameData.tile.type.STEEL,
	GameData.tile.type.BLOCKER
];
GameData.tile.climbableWallTiles = [
	GameData.tile.type.TILE,
	GameData.tile.type.STEEL
];
