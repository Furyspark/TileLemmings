var $Core = {};

$Core.newCall = function(Cls) {
  return new (Function.prototype.bind.apply(Cls, arguments));
};
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
	}
};


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

  return obj.spawn(x, y, data);
};

ObjectPool.prototype.getFirstNotExists = function() {
  for(var a = 0;a < this.pool;a++) {
    var obj = this.pool[a];
    if(!obj.exists) return obj;
  }
  return null;
};
var Camera = function(game) {
	this.scrolling = false;
	Object.defineProperty(this, "gameCamera", {get() {
		return game.camera;
	}});

	Object.defineProperties(this, {
		"width": {
			get() {
				return this.gameCamera.width / this.state.zoom;
			}
		},
		"height": {
			get() {
				return this.gameCamera.height / this.state.zoom;
			}
		},
		"x": {
			get() {
				return this.gameCamera.x / this.state.zoom;
			}
		},
		"y": {
			get() {
				return this.gameCamera.y / this.state.zoom;
			}
		},
		"state": {
			get() {
				return game.state.getCurrentState();
			}
		}
	});

	// Push for a move
	this.move(0, 0, true);
};

Camera.prototype.constructor = Camera;

Camera.prototype.move = function(hor, ver, relative) {
	if(typeof relative === "undefined") {
		relative = true;
	}
	if(relative) {
		this.gameCamera.x += hor;
		this.gameCamera.y += ver;
	}
	else {
		this.gameCamera.x = (hor * this.state.zoom);
		this.gameCamera.y = (ver * this.state.zoom);
	}
	
	// Adjust minimap's viewport frame
	if(this.state.minimap) {
		this.state.minimap.adjustFrame();
	}
	
	// Move grid
	// var grid = this.state.grid.image;
	// if(grid) {
	// 	grid.x = this.gameCamera.x;
	// 	grid.y = this.gameCamera.y;
	// 	grid.tilePosition.x = -this.x;
	// 	grid.tilePosition.y = -this.y;
	// }
};
var Alarm = function(duration, callback, callbackContext, recurring) {
	if(recurring === undefined) {
		recurring = false;
	}

	this.baseDuration = duration;
	this.duration = this.baseDuration;
	this.callback = callback;
	this.callbackContext = callbackContext;
	this.recurring = recurring;

	this.addToGame();
};

Alarm.prototype.constructor = Alarm;

Alarm.prototype.addToGame = function() {
	// Add to alarms list
	GameManager.alarms.data.push(this);
};

Alarm.prototype.update = function() {
	if(GameManager.speedManager.effectiveSpeed > 0 && this.duration > 0) {
		this.duration -= GameManager.speedManager.effectiveSpeed;
		if(this.duration <= 0) {
			if(this.callbackContext !== null) {
				this.fire();
			}
			if(this.recurring) {
				this.duration = this.baseDuration;
			}
			else {
				this.cancel();
			}
		}
	}
};

Alarm.prototype.cancel = function() {
	GameManager.alarms.remove(this);
};

Alarm.prototype.fire = function() {
	this.callback.call(this.callbackContext);
};
var GUI = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);

	// Set references
	this.guiType = "undefined";
	this.subType = "";
	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});
};

GUI.prototype = Object.create(Phaser.Sprite.prototype);
GUI.prototype.constructor = GUI;var GUI_Button = function(game, x, y) {
	GUI.call(this, game, x, y);

	// Load base texture
	this.loadTexture("gui");

	// Initialization
	this.guiType = "button";
	this.subType = "";
	this.actionName = "";
	this.pressed = false;
	this.inputEnabled = true;
	this.doubleTap = {
		enabled: false,
		time: 0
	}

	// Create label
	this.label = game.add.text(0, 0, "", {
		font: "bold 12px Arial",
		fill: "#ffffff",
		boundsAlignH: "center"
	});
	this.addChild(this.label);
	this.label.stroke = "#000000";
	this.label.strokeThickness = 3;
	this.label.owner = this;
	this.label.anchor.set(0.5);
	this.label.reposition = function() {
		this.x = this.owner.x + (this.owner.width / 2);
		this.y = this.owner.y + 10;
	};

	// Create bounding box(for cursor position checking)
	this.bbox = {
		get left() {
			return this.owner.x - Math.abs(this.owner.offsetX);
		},
		get top() {
			return this.owner.y - Math.abs(this.owner.offsetY);
		},
		get right() {
			return this.owner.x + (Math.abs(this.owner.width) - Math.abs(this.owner.offsetX));
		},
		get bottom() {
			return this.owner.y + (Math.abs(this.owner.height) - Math.abs(this.owner.offsetY));
		},
		owner: null
	};
	this.bbox.owner = this;

	this.label.reposition();

	// Set on press action
	this.events.onInputDown.add(function() {
		if(this.doubleTap.enabled && this.doubleTap.time === 0) {
			this.doubleTap.time = GUI_Button.DOUBLETAP_TIME;
		}
		else if(!this.doubleTap.enabled || this.doubleTap.time > 0) {
			this.select(true);
		}
	}, this);
};

GUI_Button.prototype = Object.create(GUI.prototype);
GUI_Button.prototype.constructor = GUI_Button;

GUI_Button.DOUBLETAP_TIME = 15;

GUI_Button.prototype.mouseOver = function() {
	var cursor = this.state.getWorldCursor();
	cursor.x = cursor.x * this.state.zoom;
	cursor.y = cursor.y * this.state.zoom;
	return (cursor.x >= this.bbox.left &&
		cursor.x <= this.bbox.right &&
		cursor.y >= this.bbox.top &&
		cursor.y <= this.bbox.bottom);
};

// Set button type and action
GUI_Button.prototype.set = function(stateObject, action, subType) {
	this.action = action;
	this.subType = subType;

	this.animations.add("up", [stateObject.released], 15, false);
	this.animations.add("down", [stateObject.pressed], 15, false);
	this.animations.play("up");
};

GUI_Button.prototype.update = function() {
	// Reposition label
	// this.label.reposition();
	// Update double tap time
	if(this.doubleTap.enabled && this.doubleTap.time > 0) {
		this.doubleTap.time = Math.max(0, this.doubleTap.time - (1 / GameManager.speedManager.effectiveSpeed));
	}
};

GUI_Button.prototype.select = function(makeSound) {
	this.doubleTap.time = 0;
	makeSound = makeSound || false;

	if (this.subType == "action") {
		this.state.deselectAllActions();

		this.doAction();

		this.pressed = true;
		this.animations.play("down");
	} else {
		this.doAction();
	}

	if (makeSound) {
		GameManager.audio.play("sndUI_Click");
	}
};

GUI_Button.prototype.deselect = function() {
	this.pressed = false;
	this.animations.play("up");
};

GUI_Button.prototype.visualPress = function() {
	this.pressed = true;
	this.animations.play("down");
};

GUI_Button.prototype.visualRelease = function() {
	this.pressed = false;
	this.animations.play("up");
};

GUI_Button.prototype.doAction = function() {
	switch (this.subType) {
		case "action":
			this.state.actionSelect = this.actionName;
			break;
		case "misc":
			switch (this.action) {
				case "pause":
					this.state.pauseGame();
					break;
				case "fastForward":
					this.state.fastForward();
					break;
				case "nuke":
					this.enabled = true;
					this.animations.play("down");
					this.state.nuke();
					break;
				case "grid":
					this.state.toggleGrid();
					break;
			}
			break;
	}
};

GUI_Button.prototype.remove = function() {
	this.label.destroy();
	this.destroy();
};
var GUI_MainMenuButton = function(game, x, y, imageKey) {
	GUI.call(this, game, x, y);

	// Load base texture
	this.loadTexture(imageKey);

	// Initialization
	this.guiType = "button";
	this.pressed = false;
	this.inputEnabled = true;
	this.callback = function() {
		return false;
	};
	this.callbackContext = this;

	// Create label
	this.label = game.add.text(0, 0, "", {
		font: "bold 12px Arial", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle", wordWrap: true
	});
	this.label.stroke = "#000000";
	this.label.strokeThickness = 3;
	this.label.owner = this;
	this.label.reposition = function() {
		this.x = this.owner.x;
		this.y = this.owner.y;
	};

	// Create bounding box(for cursor position checking)
	this.bbox = {
		get left() {
			return this.owner.x - Math.abs(this.owner.offsetX);
		},
		get top() {
			return this.owner.y - Math.abs(this.owner.offsetY);
		},
		get right() {
			return this.owner.x + (Math.abs(this.owner.width) - Math.abs(this.owner.offsetX));
		},
		get bottom() {
			return this.owner.y + (Math.abs(this.owner.height) - Math.abs(this.owner.offsetY));
		},
		get width() {
			return this.right - this.left;
		},
		get height() {
			return this.bottom - this.top;
		},
		owner: null
	};
	this.bbox.owner = this;

	Object.defineProperty(this, "labelText", {get() {
		return this.label.text;
	}, set(val) {
		this.label.text = val;
	}});

	this.label.text = "";
	this.label.reposition();

	// Set on press action
	this.events.onInputDown.add(function() {
		this.select(true);
	}, this);
	this.events.onInputUp.add(function() {
		if(this.pressed) {
			this.callback.call(this.callbackContext);
		}
	}, this);
};

GUI_MainMenuButton.prototype = Object.create(GUI.prototype);
GUI_MainMenuButton.prototype.constructor = GUI_Button;

GUI_MainMenuButton.prototype.mouseOver = function() {
	var cursor = {
		x: game.input.activePointer.worldX,
		y: game.input.activePointer.worldY
	};
	cursor.x = cursor.x;
	cursor.y = cursor.y;
	return (cursor.x >= this.bbox.left &&
		cursor.x <= this.bbox.right &&
		cursor.y >= this.bbox.top &&
		cursor.y <= this.bbox.bottom);
};

// Set button type and action
GUI_MainMenuButton.prototype.set = function(stateObject, callback, callbackContext) {
	this.callback = callback;
	this.callbackContext = callbackContext;

	this.animations.add("up", [stateObject.released], 15, false);
	this.animations.add("down", [stateObject.pressed], 15, false);
	this.animations.play("up");
};

GUI_MainMenuButton.prototype.resize = function(width, height) {
	this.width = width;
	this.height = height;
	this.label.reposition();
	this.label.setTextBounds(0, 0, this.width, this.height);
};

GUI_MainMenuButton.prototype.update = function() {
	this.label.reposition();
	if(this.pressed && (!this.mouseOver() || !game.input.activePointer.isDown)) {
		this.pressed = false;
		this.animations.play("up");
	}
};

GUI_MainMenuButton.prototype.select = function() {
	this.pressed = true;
	this.animations.play("down");
};

GUI_MainMenuButton.prototype.deselect = function() {
	this.pressed = false;
	this.animations.play("up");
};

GUI_MainMenuButton.prototype.remove = function() {
	this.label.destroy();
	this.destroy();
};
var GUI_Slider = function(game, x, y, width, imageKey, linkedVar) {
	GUI.call(this, game, x, y);

	// Set default parameters
	if(width === undefined) {
		width = 128;
	}
	if(imageKey === undefined) {
		imageKey = "mainmenu";
	}
	if(linkedVar === undefined) {
		linkedVar = null;
	}

	// Set appearance
	this.loadTexture(imageKey, "slider_bg.png");

	// Set geometric data
	this.width = width;
	this.anchor.x = 0.5;
	this.anchor.y = 0.5;

	// Set misc data
	this.linkedVar = linkedVar;

	// Create a label
	this.label = game.add.text(x, y - 40, "", {
		font: "bold 12pt Arial",
		fill: "#FFFFFF",
		boundsAlignH: "center",
		stroke: "#000000",
		strokeThickness: 3
	});
	this.label.setTextBounds(-(this.width * 0.5), 0, this.width, 24);

	// Create bar
	this.bar = game.add.image(this.x, this.y, imageKey, "slider.png");
	this.bar.anchor.x = 0.5;
	this.bar.anchor.y = 0.5;
	this.bar.owner = this;

	// Set bar default position
	if(this.linkedVar) {
		var rate = (this.linkedVar.base[this.linkedVar.name] - this.linkedVar.min) / (this.linkedVar.max - this.linkedVar.min);
		this.bar.x = this.left + ((this.right - this.left) * rate);
	}

	// Add event handling for the bar
	this.inputEnabled = true;
	this.hitArea = new Phaser.Rectangle(-(this.width * 0.5), -12, this.width, 24);
	this.events.onInputDown.add(function() {
		this.bar.dragging = true;
	}, this);
	this.events.onInputUp.add(function() {
		this.bar.dragging = false;
	}, this);
	this.bar.update = function() {
		if(this.dragging) {
			var limits = {
				left: this.owner.left,
				right: this.owner.right
			};
			this.x = Math.max(limits.left, Math.min(limits.right, game.input.activePointer.x));
			if(this.owner.linkedVar) {
				var rate = (this.x - limits.left) / (limits.right - limits.left);
				this.owner.linkedVar.base[this.owner.linkedVar.name] = this.owner.linkedVar.min + (rate * (this.owner.linkedVar.max - this.owner.linkedVar.min));
			}
		}
	};

	// Make sure the bar and label are in the same group as this object
	this.events.onAddedToGroup.add(function() {
		this.parent.add(this.bar);
		this.parent.add(this.label);
	}, this);
};

GUI_Slider.prototype = Object.create(GUI.prototype);
GUI_Slider.prototype.constructor = GUI_Slider;

GUI_Slider.prototype.remove = function() {
	this.bar.pendingDestroy = true;
	this.label.pendingDestroy = true;
	this.pendingDestroy = true;
};var GUI_Minimap = function(level) {
	Phaser.Group.call(this, game);
	game.add.existing(this);

	this.level = level;
	// Set state redirect
	Object.defineProperties(this, {
		"state": {
			get() {
				return game.state.getCurrentState();
			}
		}
	});

	// Set basic data
	this.scrolling = false;
	this.limits = {
		size: {
			max: {
				width: 200,
				height: 150
			},
			min: {
				width: 120,
				height: 90
			}
		}
	};

	this.viewFrame = null;

	// Set up layers
	this.bg = null;
	this.layers = {
		tiles: game.add.group(this)
	};

	// Refresh minimap
	this.refresh();
};

GUI_Minimap.prototype = Object.create(Phaser.Group.prototype);
GUI_Minimap.prototype.constructor = GUI_Minimap;

GUI_Minimap.prototype.update = function() {
	if(this.scrolling) {
		this.scroll();
	}
};

GUI_Minimap.prototype.onLevelStart = function() {
	// Create frame/viewport
	this.viewFrame = game.add.image(0, 0, "minimap", "frame.png");
	this.viewFrame.width = this.state.cam.width;
	this.viewFrame.height = this.state.cam.height;
	this.add(this.viewFrame);

	// Add event listener
	// Scroll minimap
	this.bg.inputEnabled = true;
	this.bg.events.onInputDown.add(function() {
		this.scrolling = true;
	}, this);
	this.bg.events.onInputUp.add(function() {
		this.scrolling = false;
	}, this);
};

GUI_Minimap.prototype.refresh = function() {
	// Clear minimap first
	this.clear();

	// Determine data
	var tileLayer = this.level.tileLayer.tileTypes;
	var tileTypeRefs = {
		1: {
			red: 0,
			green: 127,
			blue: 0
		},
		2: {
			red: 127,
			green: 127,
			blue: 127
		},
		3: {
			red: 0,
			green: 0,
			blue: 255
		}
	};

	// Generate background
	this.bg = game.add.image(0, 0, "minimap", "bg.png");
	this.bg.width = this.level.totalWidth;
	this.bg.height = this.level.totalHeight;
	this.add(this.bg);


	// Create tile layer
	var a, 
	    tile,
	    bmd = game.add.bitmapData(this.level.baseWidth, this.level.baseHeight);
	for(a = 0;a < tileLayer.length;a++) {
		tile = tileLayer[a];
		if(tileTypeRefs[tile]) {
			var tileX = (a % this.level.baseWidth);
			var tileY = Math.floor(a / this.level.baseWidth);
			bmd.setPixel(tileX, tileY, tileTypeRefs[tile].red, tileTypeRefs[tile].green, tileTypeRefs[tile].blue);
		}
	}
	var texture = bmd.generateTexture("minimap_tilelayer");
	bmd.destroy(true);
	// Apply tile layer
	var img = game.add.image(0, 0, "minimap_tilelayer");
	img.width = this.level.totalWidth;
	img.height = this.level.totalHeight;
	this.layers.tiles.add(img);

	// Resize self
	this.resize();

	// Reposition self
	this.adjustZOrder();
};

GUI_Minimap.prototype.clear = function() {
	var a, obj;
	// Clear background
	if(this.bg) {
		this.bg.destroy();
	}

	// Clear tile layer
	for(a = 0;a < this.layers.tiles.children.length;a++) {
		obj = this.layers.tiles.children[a];
		if(obj) {
			obj.destroy();
			if(game.cache.checkImageKey("minimap_tilelayer")) {
				game.cache.removeImage("minimap_tilelayer", true);
			}
		}
	}
};

GUI_Minimap.prototype.resize = function() {
	var estimatedSize = {
		width: this.level.baseWidth,
		height: this.level.baseHeight
	}
	this.width = Math.max(this.limits.size.min.width, Math.min(this.limits.size.max.width, estimatedSize.width));
	this.height = Math.max(this.limits.size.min.height, Math.min(this.limits.size.max.height, estimatedSize.height));

	// Resize viewport frame
	if(this.state.cam && this.viewFrame) {
		this.viewFrame.width = this.state.cam.width;
		this.viewFrame.height = this.state.cam.height;
	}

	// Reposition
	this.adjustZOrder();

	// Update hit area
	this.bg.hitArea = new Phaser.Rectangle(0, 0, this.width / this.scale.x, this.height / this.scale.y);
};

GUI_Minimap.prototype.mouseOver = function() {
	var rate = this.getCursorInRate();
	return (rate.x >= 0 && rate.x <= 1 &&
		rate.y >= 0 && rate.y <= 1);
};

GUI_Minimap.prototype.getCursorInRate = function() {
	var cursor = {x: -1, y: -1};
	if(this.state.getScreenCursor) {
		var cursor = this.state.getScreenCursor();
		cursor.x *= 2;
		cursor.y *= 2;
	}
	return {
		x: (cursor.x - this.x) / this.width,
		y: (cursor.y - this.y) / this.height
	};
};

GUI_Minimap.prototype.scroll = function() {
	var rate = this.getCursorInRate();
	rate.x = Math.max(0, Math.min(1, rate.x));
	rate.y = Math.max(0, Math.min(1, rate.y));
	var moveTo = {
		x: Math.floor((rate.x * this.level.totalWidth) - (this.state.cam.width * 0.5)),
		y: Math.floor((rate.y * this.level.totalHeight) - (this.state.cam.height * 0.5))
	};
	this.state.cam.move(moveTo.x, moveTo.y, false);

	this.adjustFrame();
};

/*
	method: adjustFrame
  Adjusts the viewport frame on the minimap
*/
GUI_Minimap.prototype.adjustFrame = function() {
	this.viewFrame.x = this.state.cam.x;
	this.viewFrame.y = this.state.cam.y;
};

GUI_Minimap.prototype.adjustZOrder = function() {
	if(this.bg) {
		this.bringToTop(this.bg);
	}
	if(this.layers.tiles) {
		this.bringToTop(this.layers.tiles);
	}
	if(this.viewFrame) {
		this.bringToTop(this.viewFrame);
	}
};
var Cursor = function(x, y, owner) {
	Phaser.Sprite.call(this, game, x, y, "misc");
	game.add.existing(this);
	this.owner = owner;

	// Define properties
	Object.defineProperties(this, {
		"state": {
			get() {
				return game.state.getCurrentState();
			}
		},
		"level": {
			get() {
				return GameManager.level;
			}
		}
	})

	this.level.add(this);
	this.level.bringToTop(this);

	this.anchor.setTo(0.5, 0.5);
	this.animations.add("hover", ["sprCursor_Open.png"]);
	this.animations.play("hover");
};

Cursor.prototype = Object.create(Phaser.Sprite.prototype);
Cursor.prototype.constructor = Cursor;

Cursor.prototype.reposition = function() {
	this.x = this.owner.x;
	this.y = this.owner.y - 8;
};

Cursor.prototype.remove = function() {
	this.pendingDestroy = true;
};
var GameLabel = function(owner, x, y, offsetObj, defaultText) {
	defaultText = defaultText || "";
	this.owner = owner;
	this.offset = offsetObj;
	this.defaultStyle = {
		font: "bold 12pt Arial",
		fill: "#FFFFFF",
		boundsAlignH: "center",
		stroke: "#000000",
		strokeThickness: 3
	};
	Phaser.Text.call(this, game, x, y, defaultText, this.defaultStyle);
	game.add.existing(this);

	// Define properties
	Object.defineProperties(this, {
		"state": {
			get() {
				return game.state.getCurrentState();
			}
		},
		"level": {
			get() {
				return GameManager.level;
			}
		}
	})

	this.level.gameLabelGroup.add(this);

	this.reposition();
	this.markedForRemoval = false;
};

GameLabel.prototype = Object.create(Phaser.Text.prototype);
GameLabel.prototype.constructor = GameLabel;

GameLabel.prototype.remove = function() {
	this.markedForRemoval = true;
};

GameLabel.prototype.update = function() {
	this.reposition();
	if(this.markedForRemoval) {
		this.pendingDestroy = true;
	}
};

GameLabel.prototype.reposition = function() {
	this.x = this.owner.x + this.offset.x;
	this.y = this.owner.y + this.offset.y;
	this.setTextBounds(-(this.width * 0.5), -(this.height), this.width, this.height);
};
var Background = function(imageKey) {
	Phaser.TileSprite.call(this, game, 0, 0, 800, 600, imageKey);
	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});

	// Set base properties
	this.parallax = {
		x: 0.2,
		y: 0.2
	};
	this.tileScale.setTo(1);
};

Background.prototype = Object.create(Phaser.TileSprite.prototype);
Background.prototype.constructor = Background;

Background.prototype.update = function() {
	if(this.state.cam) {
		this.x = this.state.cam.x;
		this.y = this.state.cam.y;
	}
	this.tilePosition.x = (game.camera.x * this.parallax.x);
	this.tilePosition.y = (game.camera.y * this.parallax.y);
};
function BBox() {
  this.initialize.apply(this, arguments);
};
BBox.prototype.constructor = BBox;

Object.defineProperties(BBox.prototype, {
  spriteLeft: { get: function() { return this.owner.x - Math.abs(this.owner.offsetX); } },
  spriteRight: { get: function() { return this.owner.x + (Math.abs(this.owner.width) - Math.abs(this.owner.offsetX)); } },
  spriteTop: { get: function() { return this.owner.y - Math.abs(this.owner.offsetY); } },
  spriteBottom: { get: function() { return this.owner.y + (Math.abs(this.owner.height) - Math.abs(this.owner.offsetY)); } },
  left: { get: function() { return this.owner.x - 4; } },
  right: { get: function() { return this.owner.x + 4; } },
  top: { get: function() { return this.owner.y - 16; } },
  bottom: { get: function() { return this.owner.y; } }
});

BBox.prototype.initialize = function(owner) {
  this.owner = owner;
  this.initMembers();
};

BBox.prototype.initMembers = function() {
};
var Level = function(src, onLoad, onLoadContext, levelFolder, levelObj) {
	Phaser.Group.call(this, game);
	game.world.add(this);
	GameManager.level = this;
	// Set default properties
	this.properties = {};
	this.rawLayers = [];

	this.baseWidth = 1;
	this.baseHeight = 1;
	this.fallDist = (9 * GameData.tile.height);

	this.levelFolder = levelFolder;
	this.levelObj = levelObj;
	this.baseUrl = this.levelFolder.baseUrl;
	this.name = this.levelObj.name;
	this.tileLayer = null;
	this.objectLayer = null;
	this.bg = null;

	// Create groups
	this.lemmingsGroup = game.add.group(this);
	this.actionPreviewGroup = game.add.group(this);
	this.gameLabelGroup = game.add.group(this);

	// Create grid
	this.gridGroup = game.add.group(this);
	this.gridGroup.visible = false;

	// Set more properties
	this.lemmingCount = 0;
	this.lemmingNeed = 1;
	this.actions = {};

	// (Default coordinates for the builder tile)
	this.buildTileRect = new Phaser.Rectangle(
		2,
		2,
		GameData.tile.width,
		GameData.tile.height
	);

	// Set game stuff
	this.started = false;
	this.ended = false;
	this.saved = 0;

	// Define properties
	Object.defineProperties(this, {
		"totalWidth": {
			get() {
				return this.baseWidth * GameData.tile.width;
			}
		},
		"totalHeight": {
			get() {
				return this.baseHeight * GameData.tile.height;
			}
		}
	});

	// Create callback
	this.onLoad = {
		callback: onLoad,
		context: onLoadContext
	};
	this.tilesets = [];

	// Keep track of assets
	this.expectedAssets = [];

	// Load assets
	this.loadAssets(src);
};
Level.prototype = Object.create(Phaser.Group.prototype);
Level.prototype.constructor = Level;

/*
	method: loadAssets
	Loads this level's assets (tilesets, music, background)
*/
Level.prototype.loadAssets = function(src) {
	// Create callback
	game.load.onFileComplete.add(function levelLoad(progress, fileKey, success, totalLoadedFiles, totalFiles) {
		if(this.expectedAssets.indexOf(fileKey) !== -1) {
			// Create background
			if(fileKey === "bg") {
				this.createBackground();
			}
			// Splice expectation list
			var a = this.expectedAssets.indexOf(fileKey);
			if(a !== -1) {
				this.expectedAssets.splice(a, 1);
			}
			if(this.expectedAssets.length === 0) {
				game.load.onFileComplete.remove(levelLoad, this);
				this.applySource(src);
			}
		}
	}, this);

	var a, ts;
	// Create tilesets
	for(a = 0;a < src.tilesets.length;a++) {
		this.loadTileset(src.tilesets[a]);
	}
	// Load BGM
	if(src.properties && src.properties.bgm) {
		this.expectedAssets.push("bgm");
		game.load.audio("bgm", "assets/audio/bgm/" + src.properties.bgm);
	}
	// Load Background
	if(src.properties && src.properties.bg) {
		this.expectedAssets.push("bg");
		game.load.image("bg", "assets/gfx/backgrounds/" + src.properties.bg);
	}
};

/*
	method: loadTileset(src)
	Loads a tileset for this map
*/
Level.prototype.loadTileset = function(src) {
	var url = this.baseUrl + src.source;
	var ts;
	this.expectedAssets.push("ts_" + url);
	ts = new Tileset(url, this, src.firstgid);
	this.tilesets.push(ts);
};

/*
	method: applySource(src)
	Applies a source to this level
*/
Level.prototype.applySource = function(src) {
	// Set size
	this.baseWidth = src.width;
	this.baseHeight = src.height;

	// Generate grid
	var a, b, gridTile;
	for(a = 0;a < this.baseWidth;a++) {
		for(b = 0;b < this.baseHeight;b++) {
			gridTile = game.add.image(a * GameData.tile.width, b * GameData.tile.height, "misc", "gridTile.png", this.gridGroup);
		}
	}

	// Create layers
	var layer, tempLayer;
	for(a = 0;a < src.layers.length;a++) {
		layer = src.layers[a];
		this.addLayer(layer);
	}

	// Apply tile modifiers
	var tileMod, tile;
	if(this.tileLayer) {
		for(a = 0;a < this.rawLayers.length;a++) {
			layer = this.rawLayers[a];
			if(layer.type == Layer.TILE_LAYER && layer !== this.tileLayer) {
				for(b = 0;b < layer.tileMods.length;b++) {
					tileMod = layer.tileMods[b];
					if(tileMod) {
						tile = this.tileLayer.tiles[b];
						if(tile) {
							tile.addMod(tileMod, {
								x: layer.indexToCoords(b).x,
								y: layer.indexToCoords(b).y,
								layer: layer
							});
						}
					}
				}
			}
		}
	}

	// Set properties
	if(src.properties.need) {
		this.lemmingNeed = parseInt(src.properties.need);
	}
	// Set actions
	for(a in GameData.actions) {
		if(src.properties[a]) {
			this.actions[a] = parseInt(src.properties[a]);
		}
	}

	// Do callback to the intermission
	this.onLoad.callback.call(this.onLoad.context);
};

/*
	method: addLayer(src)
	Adds a layer to this level
*/
Level.prototype.addLayer = function(src, firstgid) {
	var layer = new Layer(src, this);
	if(layer.name === "tiles") {
		this.tileLayer = layer;
	}
	else if(layer.name === "objects") {
		this.objectLayer = layer;
	}
	this.rawLayers.push(layer);
	this.add(layer);
};

Level.prototype.zOrder = function() {
	var a;
	// Set (z-)order of display objects
	// Background
	if (this.bg) {
		this.bringToTop(this.bg);
	}
	// Objects
	this.bringToTop(this.objectLayer);
	// Main tile layer
	this.bringToTop(this.tileLayer);
	// Tile modifiers
	var a, layer;
	for(a = 0;a < this.rawLayers.length;a++) {
		layer = this.rawLayers[a];
		if(Layer.IDENTIFIER_MOD.test(layer.name)) {
			this.bringToTop(layer);
		}
	}
	// Lemmings
	this.bringToTop(this.lemmingsGroup);
	// Action preview tiles
	this.bringToTop(this.actionPreviewGroup);
	// Grid
	this.bringToTop(this.gridGroup);
	// Labels
	this.bringToTop(this.gameLabelGroup);
	// Selection markers
	for(a = 0;a < this.lemmingsGroup.children.length;a++) {
		obj = this.lemmingsGroup.children[a];
		if(obj.cursor.sprite) {
			this.bringToTop(obj.cursor.sprite);
		}
	}
};

/*
	method: createBackground
	Creates a background for this level
*/
Level.prototype.createBackground = function() {
	this.bg = new Background("bg", this);
	this.add(this.bg);
};

/*
	method: toTileSpace(x, y)
*/
Level.prototype.toTileSpace = function(x, y) {
	return {
		x: Math.floor(x / GameData.tile.width),
		y: Math.floor(y / GameData.tile.height)
	};
};

/*
	method: toWorldSpace(x, y)
*/
Level.prototype.toWorldSpace = function(x, y) {
	return {
		x: Math.floor(x * GameData.tile.width),
		y: Math.floor(y * GameData.tile.height)
	};
};

/*
	method: removeTile(tileX, tileY)
	Removes a tile from the main tile layer at the specified coordinates
	force determines whether non-diggable tiles should be removed as well
*/
Level.prototype.removeTile = function(tileX, tileY, force) {
	if(force === undefined) { force = false; }
	var tileType;
	if(this.tileLayer) {
		tileType = this.tileLayer.getTileType(tileX, tileY);
		if(tileType === 1 || force) {
			this.tileLayer.removeTile(tileX, tileY);
			this.tileLayer.setTileType(tileX, tileY, 0);
			return 1;
		}
		else if(tileType === 2) {
			return 2;
		}
	}
	return 0;
};

/*
	method: clearAssets
	Clears the assets used (exclusively) in this level to free memory
*/
Level.prototype.clearAssets = function() {
	// Clear base assets
	if(game.cache.checkSoundKey("bgm")) {
		game.cache.removeSound("bgm");
	}
	if(game.cache.checkImageKey("bg")) {
		game.cache.removeImage("bg", true);
	}
	// Clear tilesets
	var ts;
	while(this.tilesets.length > 0) {
		ts = this.tilesets.splice(0, 1);
		if(game.cache.checkJSONKey(ts.key)) {
			game.cache.removeJSON(ts.key);
		}
		if(game.cache.checkImageKey(ts.imageKey)) {
			game.cache.removeImage(ts.imageKey, true);
		}
	}
};

/*
	method: clearLevel
	Clears the level of its objects
*/
Level.prototype.clearLevel = function() {
	var a, tile, layer;
	// Destroy layers
	for(a in this.rawLayers) {
		layer = this.rawLayers[a];
		// Destroy tiles
		while(layer.tiles.length > 0) {
			tile = layer.tiles.splice(0, 1)[0];
			if(tile) {
				tile.destroy();
			}
		}
		layer.destroy();
	}
	this.rawLayers = {};
};
var Tileset = function(url, level, firstGID) {
	this.rawData = null;
	this.margin = 0;
	this.spacing = 0;
	this.firstGID = firstGID;
	this.tileCount = 0;
	this.tileProperties = {};
	this.tileAnimations = {};
	this.imageWidth = 0;
	this.imageHeight = 0;

	// Define properties
	Object.defineProperties(this, {
		"tileWidth": {
			get() {
				return this.imageWidth / (GameData.tile.width + this.spacing);
			}
		},
		"tileHeight": {
			get() {
				return this.imageHeight / (GameData.tile.height + this.spacing);
			}
		}
	});

	// Set references
	this.level = level;
	this.url = url;
	this.tempUrl = this.url.match(/(.+)\/.+$/)[1] + "/";
	this.imageKey = "";
	this.key = "ts_" + this.url;

	// Load data
	game.load.onFileComplete.add(function tilesetLoad(progress, fileKey, success, totalLoadedFiles, totalFiles) {
		if(fileKey == this.key) {
			game.load.onFileComplete.remove(tilesetLoad, this);
			this.processTileset();
		}
	}, this);
	game.load.json(this.key, this.url);
	game.load.start();
};
Tileset.prototype.constructor = Tileset;

/*
	method: coordsToIndex(x, y)
	Calculates an index based in the size of this tileset image
*/
Tileset.prototype.coordsToIndex = function(x, y) {
	return Math.floor(x % this.tileWidth) + Math.floor(y * this.tileWidth);
};

/*
	method: indexToCoords(index)
	Calculates tile coordinates based on the size of this tileset image
*/
Tileset.prototype.indexToCoords = function(index) {
	return {
		x: Math.floor(index % this.tileWidth),
		y: Math.floor(index / this.tileWidth)
	};
};

/*
	method: getTileCrop(tileX, tileY)
	Returns the cropping of a tile by coordinates
*/
Tileset.prototype.getTileCrop = function(tileX, tileY) {
	var result = new Phaser.Rectangle(
		this.margin + ((GameData.tile.width + this.spacing) * tileX),
		this.margin + ((GameData.tile.height + this.spacing) * tileY),
		GameData.tile.width,
		GameData.tile.height
	);
	return result;
};


/*
	method: processTileset()
	Called after the tileset's JSON is done loading
*/
Tileset.prototype.processTileset = function() {
	this.rawData = game.cache.getJSON(this.key);

	// Set base properties
	this.name = this.rawData.name;
	this.margin = this.rawData.margin;
	this.spacing = this.rawData.spacing;
	this.tileCount = this.rawData.tilecount;
	this.imageWidth = this.rawData.imagewidth;
	this.imageHeight = this.rawData.imageheight;

	// Link tileset to the level based on firstGID and tileCount
	var a;
	for(a = this.firstGID;a < this.firstGID + this.tileCount;a++) {
		this.level.tilesets[a] = this;
	}

	// Set tile properties
	var b;
	for(a in this.rawData.tileproperties) {
		this.tileProperties[a] = {};
		for(b in this.rawData.tileproperties[a]) {
			this.tileProperties[a][b] = this.rawData.tileproperties[a][b];
		}
	}

	// Set tile animations
	var srcAnim, anim;
	if(this.rawData.tiles) {
		for(a in this.rawData.tiles) {
			if(this.rawData.tiles[a].animation) {
				anim = [];
				srcAnim = this.rawData.tiles[a].animation;
				for(b = 0;b < srcAnim.length;b++) {
					anim.push({
						baseGID: srcAnim[b].tileid,
						duration: Math.floor(Math.max(1, ((srcAnim[b].duration * 1000) / 60)))
					});
				}
				this.tileAnimations[a] = anim;
			}
		}
	}

	// Load image
	if(this.rawData.image) {
		this.imageKey = "tsImg_" + this.url
		this.level.expectedAssets.push(this.imageKey);
		game.load.image(this.imageKey, this.tempUrl + this.rawData.image);
	}
};
var Layer = function(src, level) {
	Phaser.Group.call(this, game);

	this.level = level;
	this.name = "";

	// Set default values
	this.baseWidth = 1;
	this.baseHeight = 1;
	this.type = Layer.UNKNOWN_LAYER;

	// Tile layer stuff
	this.tiles = [];
	this.tileTypes = [];
	this.tileMods = [];

	// Object layer stuff
	this.doorGroup = game.add.group(this);
	this.exitGroup = game.add.group(this);
	this.trapGroup = game.add.group(this);

	// Apply source object
	this.applySource(src);
};
Layer.prototype = Object.create(Phaser.Group.prototype);
Layer.prototype.constructor = Layer;

Layer.UNKNOWN_LAYER = 0;
Layer.TILE_LAYER = 1;
Layer.OBJECT_LAYER = 2;

Layer.TILE_FLIP_H = 0x80000000;
Layer.TILE_FLIP_V = 0x40000000;
Layer.TILE_FLIP_HV = 0x20000000;
Layer.TILE_CLEAR_BITMASK = ~(Layer.TILE_FLIP_H | Layer.TILE_FLIP_V | Layer.TILE_FLIP_HV);

Layer.IDENTIFIER_MOD = /^(?:tilemods?)/;

/*
	method: applySource(src)
	Applies a source object to this layer
*/
Layer.prototype.applySource = function(src) {
	this.baseWidth = src.width;
	this.baseHeight = src.height;
	this.name = src.name;

	if(src.data) {
		this.type = Layer.TILE_LAYER;
	}
	else if(src.objects) {
		this.type = Layer.OBJECT_LAYER;
	}

	// Fill tile layer
	if(this.type == Layer.TILE_LAYER) {
		while(this.tiles.length < this.baseWidth * this.baseHeight) {
			this.tiles.push(null);
			this.tileMods.push(null);
			this.tileTypes.push(0);
		}
	}

	// Tile layer
	var a, b, gid, baseGID, tile, ts, animCrops, flip;
	if(this.type == Layer.TILE_LAYER) {
		for(a = 0;a < src.data.length;a++) {
			gid = src.data[a];
			if(gid > 0) {
				// Determine tileset
				ts = this.level.tilesets[gid];
				baseGID = gid - ts.firstGID;
				// Determine animation croppings
				animCrops = [];
				if(ts.tileAnimations[baseGID]) {
					for(b = 0;b < ts.tileAnimations[baseGID].length;b++) {
						animCrops.push(ts.getTileCrop(
							ts.indexToCoords(ts.tileAnimations[baseGID][b].baseGID).x,
							ts.indexToCoords(ts.tileAnimations[baseGID][b].baseGID).y
						));
					}
				}
				else {
					animCrops = [ts.getTileCrop(ts.indexToCoords(baseGID).x, ts.indexToCoords(baseGID).y)];
				}
				// Add tile
				tile = new Tile(this.indexToCoords(a).x * GameData.tile.width, this.indexToCoords(a).y * GameData.tile.height, ts.imageKey, animCrops);
				this.tiles[a] = tile;
				this.add(tile);
				// Set tile type
				if(this.name === "tiles") {
					if(ts.tileProperties[baseGID] && ts.tileProperties[baseGID].tileType) {
						this.setTileType(this.indexToCoords(a).x, this.indexToCoords(a).y, parseInt(ts.tileProperties[baseGID].tileType));
					}
					else {
						this.setTileType(this.indexToCoords(a).x, this.indexToCoords(a).y, 1);
					}
				}
				// Set mod type
				else if(Layer.IDENTIFIER_MOD.test(this.name)) {
					if(ts.tileProperties[baseGID] && ts.tileProperties[baseGID].modType) {
						this.setModType(this.indexToCoords(a).x, this.indexToCoords(a).y, parseInt(ts.tileProperties[baseGID].modType), ts.tileProperties[baseGID]);
					}
				}
			}
		}
	}

	// Object layer
	var obj, srcObj, tsObjSrc, delay, propConfig;
	if(this.type == Layer.OBJECT_LAYER) {
		for(a = 0;a < src.objects.length;a++) {
			srcObj = src.objects[a];
			// Attempt flipping
			flip = {
				h: (srcObj.gid & Layer.TILE_FLIP_H) !== 0,
				v: (srcObj.gid & Layer.TILE_FLIP_V) !== 0,
				hv: (srcObj.gid & Layer.TILE_FLIP_HV) !== 0
			};
			srcObj.gid = srcObj.gid & Layer.TILE_CLEAR_BITMASK;
			// Proceed
			ts = this.level.tilesets[srcObj.gid];
			baseGID = srcObj.gid - ts.firstGID;
			tsObjSrc = ts.tileProperties[baseGID];
			// Create props
			if(tsObjSrc.propType) {
				obj = new Prop(srcObj.x + (srcObj.width * 0.5), srcObj.y, this.level);
				if(flip.h || flip.hv) {
					obj.scale.x = -obj.scale.x;
					obj.x += GameData.tile.width;
				}
				if(flip.v || flip.hv) {
					obj.scale.y = -obj.scale.y;
				}
				switch(tsObjSrc.propType) {
					case "door":
						obj.y -= srcObj.height;
						this.level.lemmingCount += parseInt(srcObj.properties.value);
						delay = 0;
						if(srcObj.delay) {
							delay = srcObj.delay;
						}
						obj.setAsDoor(tsObjSrc.resref, srcObj.properties.value, srcObj.properties.rate, delay);
						this.doorGroup.add(obj);
						break;
					case "exit":
						obj.setAsExit(tsObjSrc.resref);
						this.exitGroup.add(obj);
						break;
					case "trap":
						propConfig = game.cache.getJSON("config").props.traps[tsObjSrc.resref];
						obj.x += ((propConfig.anchor.x - 0.5) * srcObj.width);
						obj.y += ((propConfig.anchor.y - 0.5) * srcObj.height);
						obj.setAsTrap(tsObjSrc.resref);
						this.trapGroup.add(obj);
						break;
				}
			}
		}
	}
};

/*
	method: coordsToIndex(x, y)
	Calculates an index based in the size of this layer
*/
Layer.prototype.coordsToIndex = function(x, y) {
	if(x < 0 || x >= this.baseWidth || y < 0 || y >= this.baseHeight) {
		return -1;
	}
	return Math.floor((x % this.baseWidth) + Math.floor(y * this.baseWidth));
};

/*
	method: indexToCoords(index)
	Calculates tile coordinates based on the size of this layer
*/
Layer.prototype.indexToCoords = function(index) {
	return {
		x: Math.floor(index % this.baseWidth),
		y: Math.floor(index / this.baseWidth)
	};
};

/*
	method: setTileType(tileX, tileY, type)
	Sets the tile type for the given position
*/
Layer.prototype.setTileType = function(tileX, tileY, type) {
	var index = this.coordsToIndex(tileX, tileY);
	if(index >= 0 && index < this.tileTypes.length) {
		this.tileTypes[index] = type;
	}
};

/*
	method: getTileType(tileX, tileY)
	Returns the tile type at the given position(in tile space)
*/
Layer.prototype.getTileType = function(tileX, tileY) {
	var index = this.coordsToIndex(tileX, tileY);
	if(index >= 0 && index < this.tileTypes.length) {
		return this.tileTypes[index];
	}
	return GameData.tile.type.AIR;
};

/*
	method: removeTile(tileX, tileY)
	Removes a tile from this layer without setting the tile type
*/
Layer.prototype.removeTile = function(tileX, tileY) {
	var index = this.coordsToIndex(tileX, tileY);
	if(index >= 0 && index < this.tiles.length) {
		var tile = this.tiles.splice(index, 1, null)[0];
		if(tile) {
			tile.remove();
		}
	}
};

/*
	method: placeTile(tileX, tileY)
	Places a tile at the specified coordinates, removing an older tile if there is one
*/
Layer.prototype.placeTile = function(tileX, tileY, imageKey, cropping) {
	var index = this.coordsToIndex(tileX, tileY);
	if(index >= 0 && index < this.tiles.length) {
		var coord = this.level.toWorldSpace(tileX, tileY);
		var tile = new Tile(coord.x, coord.y, imageKey, [cropping]);
		this.add(tile);
		var oldTile = this.tiles.splice(index, 1, tile)[0];
		if(oldTile) {
			oldTile.remove();
		}
	}
};

/*
	method: setModType(tileX, tileY, modType, modSrc)
	Marks these coordinates as a tile modifier
*/
Layer.prototype.setModType = function(tileX, tileY, modType, modSrc) {
	var index = this.coordsToIndex(tileX, tileY);
	var modObj = {
		type: modType
	};
	this.tileMods.splice(index, 1, modObj);
};

/*
	method: getTile(tileX, tileY)
	Returns the tile object in the specified coordinates in the layer
*/
Layer.prototype.getTile = function(tileX, tileY) {
	if(this.type === Layer.TILE_LAYER) {
		return this.tiles[this.coordsToIndex(tileX, tileY)];
	}
	return null;
};
var Tile = function(x, y, key, animationCrop) {
	Phaser.Image.call(this, game, x, y, key);

	Object.defineProperties(this, {
		"state": {
			get() {
				return game.state.getCurrentState();
			}
		},
		"tileX": {
			get() {
				return Math.floor(this.owner.x / this.owner.state.map.tilewidth);
			}
		},
		"tileY": {
			get() {
				return Math.floor(this.owner.y / this.owner.state.map.tileheight);
			}
		}
	});

	this.markedForRemoval = false;

	// Add animation/cropping
	this.animation = {
		croppings: animationCrop,
		frame: 0,
		fps: 6
	};

	// Set tileMods
	this.tileMods = {};

	// Crop
	this.animAlarm = null;
	this.crop(this.animation.croppings[this.animation.frame], true);

	// Set animation timer(s)
	if(this.animation.croppings.length > 1) {
		this.animAlarm = new Alarm(this.animation.fps, function() {
			this.animate();
		}, this, true);
	}
};
Tile.prototype = Object.create(Phaser.Image.prototype);
Tile.prototype.constructor = Tile;

Tile.MOD_NO_DIG_RIGHT = 1;
Tile.MOD_NO_DIG_LEFT = 2;

/*
	method: update
	Called every frame
*/
Tile.prototype.update = function() {
	var a, mod;
	if(this.markedForRemoval) {
		// Remove mod tiles
		for(a in this.tileMods) {
			mod = this.tileMods[a];
			mod.tileRef.layer.removeTile(mod.tileRef.x, mod.tileRef.y);
		}
		// Remove self
		if(this.animAlarm) {
			this.animAlarm.cancel();
		}
		this.pendingDestroy = true;
	}
};

Tile.prototype.remove = function() {
	this.markedForRemoval = true;
};

/*
	method: animate
	Called by a timer to animate
*/
Tile.prototype.animate = function() {
	this.animation.frame = (this.animation.frame + 1) % this.animation.croppings.length;
	this.crop(this.animation.croppings[this.animation.frame]);
};

/*
	method: addMod(paramsObj)
	Adds a modifier to this tile
	Should only be done for tiles on the level's tileLayer (main tile layer)
	tileRef should be an object containing the following properties:
	 x: the x position in Tile Space for the tileref
	 y: the y position in Tile Space for the tileref
	 layer: the layer object the tileref Tile is in
	paramsObj is only necessary for some modifiers(not yet implemented)
*/
Tile.prototype.addMod = function(modSrc, tileRef) {
	var modObj = {
		tileRef: tileRef,
		mod: modSrc
	};
	this.tileMods[modSrc.type] = modObj;
};
function Lemming() {
	this.initialize.apply(this, arguments);
};
Lemming.prototype = Object.create(Phaser.Sprite.prototype);
Lemming.prototype.constructor = Lemming;

Object.defineProperties(Lemming.prototype, {
	state: { get: function() { return game.state.getCurrentState(); } },
	tileLayer: { get: function() { return this.level.tileLayer; } },
	level: { get: function() { return GameManager.level; } }
});

Lemming.prototype.initialize = function() {
	Phaser.Sprite.call(this, game, 0, 0, "lemming");
	game.add.existing(this);
	GameManager.level.lemmingsGroup.add(this);
	this.initMembers();
	this.anchor.setTo(0.5, 0.5);
	this.addAnimations();
};

Lemming.prototype.spawn = function(x, y) {
	this.x = x;
	this.y = y;
	this.exists = true;
};

Lemming.prototype.initMembers = function() {
	// Set base stats
	this.exists = false;
	this.dead = false;
	this.markedForRemoval = false;
	this.active = true;
	this.animationProperties = {};
	this.initActions();
	this.initAttributes();
	this.gameLabel = null;
	this.dir = 1;
	this.velocity = {
		x: 0,
		y: 0
	};
	this.fallDist = 0;
	this.bbox = new BBox(this);
	this.objectType = "lemming";
	this.cursor = {
		selected: false,
		sprite: null
	};
};

Lemming.prototype.initActions = function() {
	// Set up action
	this.action = {
		name: "",
		value: 0,
		active: false,
		clear: function() {
			this.name = "";
			this.value = 0;
			this.active = false;
		},
		get idle() {
			return (!this.active);
		},
		alarm: null
	};
	// Set up sub action
	this.subaction = {
		name: "",
		value: 0,
		active: false,
		clear: function() {
			this.name = "";
			this.value = 0;
			this.active = false;
		},
		get idle() {
			return (!this.active);
		},
		alarm: null
	};
};

Lemming.prototype.initAttributes = function() {
	this.attributes = {
		floater: false,
		climber: false
	};
};

Lemming.prototype.addAnimations = function() {
	this.addAnim("fall", "Fall", 4, {
		x: 0,
		y: 0
	});
	this.addAnim("move", "Move", 10, {
		x: 0,
		y: 0
	});
	this.addAnim("mine", "Mine", 24, {
		x: 0,
		y: 8
	});
	this.addAnim("build", "Build", 16, {
		x: 0,
		y: 0
	});
	this.addAnim("build_end", "BuildEnd", 10, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("bash", "Bash", 32, {
		x: 0,
		y: 0
	});
	this.addAnim("dig", "Dig", 8, {
		x: 0,
		y: 4
	});
	this.addAnim("splat", "FallDeath", 16, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("block", "Block", 16, {
		x: 0,
		y: 0
	});
	this.addAnim("explode", "Explode", 16, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("exit", "Exit", 8, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("float", "Float", 4, {
		x: 0,
		y: 0
	});
	this.addAnim("float_start", "Float_Start", 4, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("climb", "Climb", 8, {
		x: 0,
		y: 0
	});
	this.addAnim("climb_end", "Climb_End", 8, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("drown", "Drown", 16, {
		x: 0,
		y: 0
	}, false);
	this.addAnim("burn", "Burn", 13, {
		x: 0,
		y: 0
	}, false);
	this.playAnim("fall", 15);
	this.velocity.y = 1;

	// Set animation end callbacks
	// Climb end
	this.animations.getAnimation("climb_end").onComplete.add(function() {
		this.clearAction();
		this.x += (1 * this.dir);
	}, this);
};

Lemming.DEATHTYPE_OUT_OF_ROOM = 0;
Lemming.DEATHTYPE_FALL = 1;
Lemming.DEATHTYPE_DROWN = 2;
Lemming.DEATHTYPE_BURN = 3;
Lemming.DEATHTYPE_INSTANT = 4;

Lemming.prototype.mouseOver = function() {
	var cursor = this.state.getWorldCursor();
	return (cursor.x >= this.bbox.spriteLeft &&
		cursor.x <= this.bbox.spriteRight &&
		cursor.y >= this.bbox.spriteTop &&
		cursor.y <= this.bbox.spriteBottom);
};

Lemming.prototype.cursorDeselect = function() {
	if (this.cursor.selected) {
		// Remove cursor
		this.cursor.selected = false;
		this.state.lemmingSelected = null;
		if (this.cursor.sprite != null) {
			this.cursor.sprite.destroy();
			this.cursor.sprite = null;
		}
		// Remove action preview
		this.removeActionPreview();
	}
};

Lemming.prototype.cursorSelect = function() {
	if (!this.cursor.selected) {
		// Create cursor
		this.cursor.selected = true;
		this.state.lemmingSelected = this;
		if (this.cursor.sprite == null) {
			this.cursor.sprite = new Cursor(this.x, this.y, this);
			this.cursor.sprite.reposition();
		}
		// Create action preview
		this.createActionPreview();
	}
};

Lemming.prototype.createActionPreview = function() {
	var coords = [];
	switch (this.state.actionSelect) {
		case "builder":
			if (this.onFloor()) {
				coords[0] = this.level.toTileSpace(this.x + (GameData.tile.width * this.dir), this.y - 1);
				this.placeActionPreviewTile(coords[0].x, coords[0].y);
			}
			break;
		case "miner":
			if (this.onFloor()) {
				coords = [
					this.level.toTileSpace(this.x + (GameData.tile.width * this.dir), this.y + 1),
					this.level.toTileSpace(this.x + (GameData.tile.width * this.dir), this.y - (GameData.tile.height - 1))
				];
				this.placeActionPreviewTile(coords[0].x, coords[0].y);
				this.placeActionPreviewTile(coords[1].x, coords[1].y);
			}
			break;
		case "digger":
			if (this.onFloor()) {
				coords[0] = this.level.toTileSpace(this.x, this.y+1);
				this.placeActionPreviewTile(coords[0].x, coords[0].y);
			}
			break;
		case "blocker":
			if (this.onFloor()) {
				coords[0] = this.level.toTileSpace(this.x, this.y-1);
				this.placeActionPreviewTile(coords[0].x, coords[0].y);
			}
			break;
	}
};

Lemming.prototype.placeActionPreviewTile = function(tileX, tileY) {
	var gfx = game.add.image(tileX * GameData.tile.width, tileY * GameData.tile.height, "misc", "previewTile.png");
	this.level.actionPreviewGroup.add(gfx);
};

Lemming.prototype.removeActionPreview = function() {
	var grp = this.level.actionPreviewGroup.children;
	while (grp.length > 0) {
		grp[0].destroy();
	}
};

Lemming.prototype.onFloor = function() {
	var coords = [
		this.level.toTileSpace(this.x, this.y),
		this.level.toTileSpace(this.x, this.y-1)
	];
	var checks = [
		this.tileLayer.getTileType(coords[0].x, coords[0].y),
		this.tileLayer.getTileType(coords[1].x, coords[1].y)
	];
	return (GameData.tile.floorTiles.indexOf(checks[0]) !== -1 ||
		GameData.tile.floorTiles.indexOf(checks[1]) !== -1);
};

Lemming.prototype.turnAround = function() {
	this.scale.x = -this.scale.x;
	this.dir = -this.dir;
	this.velocity.x = -this.velocity.x;
	this.x += (this.velocity.x * GameManager.speedManager.effectiveSpeed);
};

Lemming.prototype.update = function() {
	var checks = [], coords = [], a, b, obj, objs, tile, failed, alarm,
		walkedUpRamp = false;

	if (!this.dead && this.active && GameManager.speedManager.effectiveSpeed > 0) {
		this.x += (this.velocity.x * GameManager.speedManager.effectiveSpeed);
		this.y += (this.velocity.y * GameManager.speedManager.effectiveSpeed);

		// Walk
		if (this.onFloor() && this.action.idle) {
			// Fall death
			if (this.fallDist >= this.level.fallDist) {
				this.die(Lemming.DEATHTYPE_FALL);
			} else {
				this.fallDist = 0;
				// Adjust velocity
				this.velocity.x = 0.5;
				if (this.dir === -1) {
					this.velocity.x = -this.velocity.x;
				}
				this.velocity.y = 0;
				// Align to floor
				this.y = Math.floor(this.y / GameData.tile.height) * GameData.tile.height;
				// Play animation
				this.playAnim("move", 15);
				// Check walk up ramp
				coords = [
					this.level.toTileSpace(this.x, this.y - 1),
					this.level.toTileSpace(this.x, (this.y - 1) - GameData.tile.height),
					this.level.toTileSpace(this.x, this.y - 1)
				],
				checks[0] = this.tileLayer.getTileType(coords[0].x, coords[0].y);
				checks[1] = this.tileLayer.getTileType(coords[1].x, coords[1].y);
				checks[2] = this.tileLayer.getTileType(coords[2].x, coords[2].y);
				if (GameData.tile.floorTiles.indexOf(checks[0]) !== -1 &&
					GameData.tile.floorTiles.indexOf(checks[1]) === -1) {
					this.y -= GameData.tile.height;
					coords[0] = this.level.toTileSpace(this.x, this.y - 1);
					coords[1] = this.level.toTileSpace(this.x, (this.y - 1) - GameData.tile.height);
					checks[0] = this.tileLayer.getTileType(coords[0].x, coords[0].y);
					checks[1] = this.tileLayer.getTileType(coords[1].x, coords[1].y);
					walkedUpRamp = true;
				}
				// Check walk against wall
				if ((GameData.tile.wallTiles.indexOf(checks[0]) !== -1 && GameData.tile.wallTiles.indexOf(checks[1]) !== -1) || checks[2] == GameData.tile.type.BLOCKER) {
					// Turn around
					if (!this.attributes.climber ||
						(walkedUpRamp && ((GameData.tile.climbableWallTiles.indexOf(checks[0]) === -1 || GameData.tile.climbableWallTiles.indexOf(checks[1]) === -1) ||
							checks[2] == GameData.tile.type.BLOCKER))) {
						this.turnAround();
					}
					// Start climbing
					else if (this.attributes.climber && GameData.tile.climbableWallTiles.indexOf(checks[0]) !== -1 && GameData.tile.climbableWallTiles.indexOf(checks[1]) !== -1) {
						this.action.name = "climber";
						this.action.active = true;
						this.action.value = 0;
						this.playAnim("climb", 15);
						this.velocity.x = 0;
						this.velocity.y = -0.5;
						// Align to wall
						if (this.dir === 1) {
							this.x = (this.level.toTileSpace(this.x, this.y).x * GameData.tile.width) - 1;
						} else if (this.dir === -1) {
							this.x = (this.level.toTileSpace(this.x, this.y).x * GameData.tile.width) + GameData.tile.width;
						}
					}
				}
			}
		}
		// Bashing
		else if (this.onFloor() && this.action.name === "basher" && !this.action.idle) {
			// Remove tile in front of lemming
			alarm = new Alarm(30, function() {
				if (this.action.name === "basher" && !this.action.idle) {
					this.clearAction();
				}
			}, this);
			coords = [
				this.level.toTileSpace(this.x + ((GameData.tile.width * 0.5) * this.dir), this.y - 1)
			];
			// Check for one-way walls
			tile = this.tileLayer.getTile(coords[0].x, coords[0].y);
			failed = false;
			if(tile && ((this.dir === 1 && tile.tileMods[Tile.MOD_NO_DIG_RIGHT]) ||
				(this.dir === -1 && tile.tileMods[Tile.MOD_NO_DIG_LEFT]))) {
				failed = true;
			}
			// Bash away
			var bashResult = 0;
			if(!failed) {
				bashResult = this.level.removeTile(coords[0].x, coords[0].y);
				coords = [
					this.level.toTileSpace(this.x + ((GameData.tile.width * 0.5) * this.dir), this.y - 1),
					this.level.toTileSpace(this.x + ((GameData.tile.width * 1.5) * this.dir), this.y - 1)
				];
			}
			if (bashResult === 2 || failed) {
				alarm.cancel;
				GameManager.audio.play("sndChink");
				this.clearAction();
			}
			else if (bashResult === 1 ||
				this.tileLayer.getTileType(coords[0].x, coords[0].y) == GameData.tile.type.TILE ||
				this.tileLayer.getTileType(coords[1].x, coords[1].y) == GameData.tile.type.TILE) {
				alarm.cancel();
			}
		}
		// Fall
		else if (!this.onFloor() && !(this.action.name === "climber" && !this.action.idle)) {
			this.velocity.x = 0;
			this.clearAction();
			// Float
			if (this.attributes.floater) {
				this.fallDist = 0;
				if (this.animations.currentAnim.name !== "float" && this.animations.currentAnim.name !== "float_start") {
					this.velocity.y = 1.5;
					this.playAnim("float_start", 15);
					this.animations.currentAnim.onComplete.addOnce(function() {
						this.playAnim("float", 15);
					}, this);
				} else if (this.animations.currentAnim.name === "float") {
					this.velocity.y = 0.75;
				}
			}
			// Fall
			else {
				this.velocity.y = 1.5;
				this.playAnim("fall", 15);
				this.fallDist += Math.abs(this.velocity.y) * GameManager.speedManager.effectiveSpeed;
			}
		}
		// Climb
		else if (this.action.name === "climber" && !this.action.idle) {
			var ceilCheckDepth = Math.ceil(Math.abs(this.velocity.y) + 1) * GameManager.speedManager.effectiveSpeed;
			coords = [
				this.level.toTileSpace(this.x + (1 * this.dir), this.y),
				this.level.toTileSpace(this.x, this.y - ceilCheckDepth)
			];
			var wallTileType = this.tileLayer.getTileType(coords[0].x, coords[0].y);
			var ceilTileType = this.tileLayer.getTileType(coords[1].x, coords[1].y);
			// Hit ceiling
			if (game.tiles.solidTileTypes.indexOf(ceilTileType) !== -1) {
				this.velocity.y = 0;
				this.x -= (1 * this.dir);
				this.y = (((this.y + ceilCheckDepth) / GameData.tile.height) * GameData.tile.height) + 1;
				this.clearAction();
				this.turnAround();
			}
			// Reached top of the cliff
			else if (game.tiles.solidTileTypes.indexOf(wallTileType) === -1) {
				this.velocity.y = 0;
				this.playAnim("climb_end", 15);
			}
		}

		// Detect blockers
		if (this.action.name !== "blocker") {
			var distCheck = Math.ceil((Math.abs(this.velocity.x) * GameManager.speedManager.effectiveSpeed) + 1);

			var objs = [];
			while (distCheck > 0) {
				var group = this.detectByAction(this.x + (distCheck * this.dir), this.y - 1, "blocker");
				for (var a = 0; a < group.length; a++) {
					if (objs.indexOf(group[a]) === -1 && group[a] !== this) {
						objs.push(group[a]);
					}
				}
				distCheck--;
			}
			var turnedAround = false;
			for (a = 0; a < objs.length && !turnedAround; a++) {
				obj = objs[a];
				if ((obj.bbox.left > this.x && this.dir === 1) || (obj.bbox.right < this.x && this.dir === -1)) {
					turnedAround = true;
					this.turnAround();
				}
			}
		}

		// Check for exits
		var exitProp, checkDone;
		if (this.onFloor() && this.active) {
			checkDone = false;
			for (a = 0; a < this.level.objectLayer.exitGroup.children.length && !checkDone; a++) {
				exitProp = this.level.objectLayer.exitGroup.children[a];
				if (exitProp.inPosition(this.x, this.y)) {
					this.checkDone = true;
					this.active = false;
					this.playAnim("exit", 15);
					var sndKey = game.cache.getJSON("config").props.exits[exitProp.type].sound.exit;
					if (sndKey) {
						GameManager.audio.play(sndKey);
					}
					this.velocity.x = 0;
					this.velocity.y = 0;
					this.animations.currentAnim.onComplete.addOnce(function() {
						this.level.saved++;
						this.remove();
					}, this);
				}
			}
		}

		// Die outside room
		if (this.isOutsideLevel()) {
			this.die(Lemming.DEATHTYPE_OUT_OF_ROOM);
		}

		// Drown
		coords[0] = this.level.toTileSpace(this.x, this.y-1);
		if (this.tileLayer.getTileType(coords[0].x, coords[0].y) == GameData.tile.type.WATER) {
			this.die(Lemming.DEATHTYPE_DROWN);
		}
	}

	if (this.markedForRemoval) {
		// Remove label
		if (this.gameLabel) {
			this.gameLabel.remove();
		}
		this.removeActionPreview();
		// Remove from state's group
		this.active = false;
		// Kill self
		this.pendingDestroy = true;
	}
};

Lemming.prototype.addAnim = function(key, animName, numFrames, offsets, loop) {
	if (!offsets) {
		offsets = {
			x: 0,
			y: 0
		};
	}
	if (loop === undefined) {
		loop = true;
	}
	var a, frames = [], anim, numberStr;
	for (a = 0; a < numFrames; a += 1) {
		numberStr = a.toString();
		anim = "sprLemming_" + animName + "_" + numberStr + ".png";
		frames.push(anim);
	}
	this.animations.add(key, frames, 60, loop);
	this.animationProperties[key] = {
		offset: offsets
	};
};

Lemming.prototype.playAnim = function(key, frameRate) {
	this.animations.play(key, frameRate * Math.max(1, GameManager.speedManager.effectiveSpeed));
	// this.anchor.setTo(
	// 	0.5 - (this.animationProperties[key].offset.x / this.width),
	// 	1 - (this.animationProperties[key].offset.y / this.height)
	// );
	if (GameManager.speedManager.effectiveSpeed === 0) {
		this.animations.paused = true;
	}
};

Lemming.prototype.clearAction = function() {
	// Clear action
	this.action.name = "";
	this.action.value = 0;
	this.action.active = false;
	if (this.action.alarm) {
		this.action.alarm.cancel();
	}
};

Lemming.prototype.setAction = function(actionName) {
	// Normal actions
	var actionSuccess = false;
	if ((actionName != this.action.name || (actionName === "builder" && this.animations.currentAnim.name === "build_end")) &&
		(this.action.name !== "blocker" || (this.action.idle && actionName === "blocker")) &&
		!this.dead && this.active) {
		switch (actionName) {
			// SET ACTION: Walk
			case "walker":
				if (this.onFloor()) {
					this.clearAction();
				}
				break;
				// SET ACTION: Build
			case "builder":
				if (this.onFloor()) {
					this.clearAction();
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
					// Set action
					this.action.name = actionName;
					this.action.active = true;
					this.action.value = 5;
					this.playAnim("build", 15);
					// Set velocity
					this.velocity.x = 0;
					// Set timer
					this.action.alarm = new Alarm(120, function() {
						this.proceedBuild();
					}, this);
				}
				break;
				// SET ACTION: Basher
			case "basher":
				if (this.onFloor()) {
					this.clearAction();
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
					// Set action
					this.action.name = actionName;
					this.action.active = true;
					this.action.value = 0;
					this.playAnim("bash", 15);
					// Set velocity
					this.velocity.x = 0.2 * this.dir;
				}
				break;
				// SET ACTION: Digger
			case "digger":
				if (this.onFloor()) {
					this.clearAction();
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
					// Set action
					this.action.name = actionName;
					this.action.active = true;
					this.action.value = 0;
					this.playAnim("dig", 15);
					// Set velocity
					this.velocity.x = 0;
					// Set alarm
					this.action.alarm = new Alarm(120, function() {
						this.proceedDig();
					}, this);
				}
				break;
				// SET ACTION: Miner
			case "miner":
				if (this.onFloor()) {
					this.clearAction();
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
					// Set action
					this.action.name = actionName;
					this.action.active = true;
					this.action.value = 0;
					this.playAnim("mine", 15);
					// Set velocity
					this.velocity.x = 0;
					// Set alarm
					this.action.alarm = new Alarm(150, function() {
						this.proceedMine();
					}, this);
				}
				break;
				// SET ACTION: Blocker
			case "blocker":
				if (this.onFloor()) {
					this.clearAction();
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
					// Set action
					this.action.name = actionName;
					this.action.active = true;
					this.action.value = 0;
					this.playAnim("block", 15);
					// Set velocity
					this.velocity.x = 0;
				}
				break;
				// SET ACTION: Floater
			case "floater":
				if (!this.attributes.floater) {
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
					this.attributes.floater = true;
				}
				break;
				// SET ACTION: Climber
			case "climber":
				if (!this.attributes.climber) {
					this.state.expendAction(actionName, 1);
					actionSuccess = true;
					this.attributes.climber = true;
				}
				break;
		}
	}
	// Sub action
	if (this.subaction.name != actionName) {
		switch (actionName) {
			// SET SUBACTION: Exploder
			case "exploder":
				this.state.expendAction(actionName, 1);
				actionSuccess = true;
				this.setExploder();
				break;
		}
	}
	// Play sound
	if (actionSuccess) {
		GameManager.audio.play("sndAction");
	}
};

Lemming.prototype.setExploder = function() {
	this.subaction.clear();
	// Set action
	this.subaction.name = "exploder";
	this.subaction.active = true;
	this.subaction.value = 5;
	// Create label
	this.gameLabel = new GameLabel(this, this.x, this.y, {
		x: 0,
		y: -((this.bbox.bottom - this.bbox.top) + 8)
	}, "5");
	// Create alarm
	this.subaction.alarm = new Alarm(60, function() {
		this.proceedExplode();
	}, this);
};

Lemming.prototype.proceedBuild = function() {
	if (this.action.name == "builder" && !this.action.idle && !this.dead && this.active) {
		this.action.value--;
		if (this.action.value < 2) {
			GameManager.audio.play("sndBuildEnding");
		}
		var moveTo = {
			x: this.x + (GameData.tile.width * this.dir),
			y: (this.y - GameData.tile.height)
		};
		var locChange = {
			x: this.x + (GameData.tile.width * this.dir),
			y: this.y - 1
		};
		var coords = [
			this.level.toTileSpace(moveTo.x, moveTo.y - 1),
			this.level.toTileSpace(locChange.x, locChange.y),
			this.level.toTileSpace(this.x, this.y - 1)
		];
		var checks = [
			this.tileLayer.getTileType(coords[0].x, coords[0].y),
			this.tileLayer.getTileType(coords[1].x, coords[1].y),
			this.tileLayer.getTileType(coords[2].x, coords[2].y)
		];
		// Turn around at a blocker
		if (checks[0] == GameData.tile.type.BLOCKER || checks[1] == GameData.tile.type.BLOCKER || checks[2] == GameData.tile.type.BLOCKER) {
			// Turn around
			this.turnAround();
			// Re-evaluate checks
			moveTo = {
				x: this.x + (GameData.tile.width * this.dir),
				y: (this.y - GameData.tile.height)
			};
			locChange = {
				x: this.x + (GameData.tile.width * this.dir),
				y: this.y - 1
			};
			coords = [
				this.level.toTileSpace(moveTo.x, moveTo.y - 1),
				this.level.toTileSpace(locChange.x, locChange.y),
				this.level.toTileSpace(this.x, this.y - 1)
			];
			checks = [
				this.tileLayer.getTileType(coords[0].x, coords[0].y),
				this.tileLayer.getTileType(coords[1].x, coords[1].y),
				this.tileLayer.getTileType(coords[2].x, coords[2].y)
			];
		}
		// See whether we can build a step
		if (checks[0] == GameData.tile.type.AIR) {
			// Move to new place
			this.x = moveTo.x;
			this.y = moveTo.y;
			// Build a step
			if (checks[1] == GameData.tile.type.AIR) {
				coords[3] = this.level.toTileSpace(locChange.x, locChange.y);
				if(this.tileLayer.getTileType(coords[3].x, coords[3].y) === GameData.tile.type.AIR) {
					this.tileLayer.placeTile(coords[3].x, coords[3].y, "tilesetPlaceables", this.level.buildTileRect, 1);
					this.tileLayer.setTileType(coords[3].x, coords[3].y, 1);
				}
			}
			// Set alarm
			if (this.action.value === 0) {
				// Stop building
				this.playAnim("build_end", 10);
				this.animations.currentAnim.onComplete.addOnce(function() {
					this.clearAction();
				}, this);
			} else {
				this.action.alarm = new Alarm(120, function() {
					this.proceedBuild();
				}, this);
			}
		}
		// Otherwise turn around and stop building
		else {
			this.setAction("walker");
			this.turnAround();
		}
	}
};

Lemming.prototype.proceedDig = function() {
	var coords = [];
	if (this.action.name == "digger" && !this.action.idle && !this.dead && this.active) {
		coords[0] = this.level.toTileSpace(this.x, this.y+1);
		var result = this.level.removeTile(coords[0].x, coords[0].y);
		if (result === 2) {
			GameManager.audio.play("sndChink");
			this.clearAction();
		} else {
			this.y += GameData.tile.height;
			// Set up new alarm
			this.action.alarm = new Alarm(120, function() {
				this.proceedDig();
			}, this);
		}
	}
};

Lemming.prototype.proceedMine = function() {
	var checks = [], coords = [], result, failed, tile;
	if (this.action.name == "miner" && !this.action.idle && !this.dead && this.active) {
		// Check for blockers
		coords = [
			this.level.toTileSpace(this.x, this.y-1),
			this.level.toTileSpace(this.x + (GameData.tile.width * this.dir), this.y-1),
			this.level.toTileSpace(this.x + (GameData.tile.width * this.dir), this.y + (GameData.tile.height - 1))
		];
		checks = [
			this.tileLayer.getTileType(coords[0].x, coords[0].y),
			this.tileLayer.getTileType(coords[1].x, coords[1].y),
			this.tileLayer.getTileType(coords[2].x, coords[2].y)
		];
		if (checks[0] == GameData.tile.type.BLOCKER || checks[1] == GameData.tile.type.BLOCKER || checks[2] == GameData.tile.type.BLOCKER) {
			this.turnAround();
		}

		// Remove tile(s)
		coords[0] = this.level.toTileSpace(this.x + (GameData.tile.width * this.dir), this.y - 1);
		// Check for one-way tiles
		failed = false;
		tile = this.tileLayer.getTile(coords[0].x, coords[0].y);
		if(tile && ((this.dir === 1 && tile.tileMods[Tile.MOD_NO_DIG_RIGHT]) ||
			(this.dir === -1 && tile.tileMods[Tile.MOD_NO_DIG_LEFT]))) {
			failed = true;
		}
		// Dig
		if(!failed) {
			result = this.level.removeTile(coords[0].x, coords[0].y);
		}
		if (result === 2 || failed) {
			GameManager.audio.play("sndChink");
			this.clearAction();
		}
		else {
			coords[0] = this.level.toTileSpace(this.x + (GameData.tile.width * this.dir), this.y + (GameData.tile.height - 1));
			// Check for one-way tiles
			failed = false;
			tile = this.tileLayer.getTile(coords[0].x, coords[0].y);
			if(tile && ((this.dir === 1 && tile.tileMods[Tile.MOD_NO_DIG_RIGHT]) ||
				(this.dir === -1 && tile.tileMods[Tile.MOD_NO_DIG_LEFT]))) {
				failed = true;
			}
			// Dig
			if(!failed) {
				result = this.level.removeTile(coords[0].x, coords[0].y);
			}
			if (result === 2 || failed) {
				GameManager.audio.play("sndChink");
				this.clearAction();
			}
			else {
				this.x += (GameData.tile.width * this.dir);
				this.y += GameData.tile.height;
				// Set up new alarm
				this.action.alarm = new Alarm(150, function() {
					this.proceedMine();
				}, this);
			}
		}
	}
};

Lemming.prototype.proceedExplode = function() {
	if (this.subaction.name === "exploder" && !this.subaction.idle && !this.dead && this.active) {
		this.subaction.value--;
		if (this.subaction.value <= 0) {
			if (this.gameLabel) {
				this.gameLabel.remove();
			}
			if (this.onFloor()) {
				GameManager.audio.play("sndOhNo");
				this.dead = true;
				this.playAnim("explode", 15);
				this.velocity.x = 0;
				this.animations.currentAnim.onComplete.addOnce(function() {
					this.explode();
				}, this);
			} else {
				this.explode();
			}
		} else {
			this.gameLabel.text = this.subaction.value.toString();
			this.subaction.alarm = new Alarm(60, function() {
				this.proceedExplode();
			}, this);
		}
	}
};

Lemming.prototype.explode = function() {
	GameManager.audio.play("sndPop");
	// Remove 3x3 tiles
	var a, b, coords = [];
	for (a = -1; a <= 1; a++) {
		for (b = -1; b <= 1; b++) {
			coords[0] = this.level.toTileSpace(this.x, this.y - (GameData.tile.height * 0.5));
			coords[0].x += a;
			coords[0].y += b;
			this.level.removeTile(coords[0].x, coords[0].y);
		}
	}
	// Remove self
	this.remove();
};

Lemming.prototype.detectByAction = function(xCheck, yCheck, actionName) {
	var group = this.level.lemmingsGroup.children;
	var result = [];
	if (group) {
		for (var a = 0; a < group.length; a++) {
			var obj = group[a];
			if (xCheck >= obj.bbox.left && xCheck <= obj.bbox.right &&
				yCheck >= obj.bbox.top && yCheck <= obj.bbox.bottom &&
				obj.action.name == actionName && !obj.action.idle) {
				result.push(obj);
			}
		}
	}
	return result;
};

Lemming.prototype.isOutsideLevel = function() {
	return (this.x < 0 || this.x > this.level.totalWidth ||
		this.y < 0 || this.y > this.level.totalHeight);
};

Lemming.prototype.die = function(deathType) {
	if (this.gameLabel) {
		this.gameLabel.remove();
	}
	// Set states
	this.dead = true;
	this.velocity.x = 0;
	this.velocity.y = 0;

	// Clear actions
	this.clearAction();
	this.subaction.name = "";
	this.subaction.active = false;
	this.subaction.value = 0;
	if (this.subaction.alarm) {
		this.subaction.alarm.cancel;
	}

	// Die
	switch (deathType) {
		// DEATH ACTION: Out of room
		case Lemming.DEATHTYPE_OUT_OF_ROOM:
			GameManager.audio.play("sndDie");
			this.remove();
			break;
			// DEATH ACTION: Fall death
		case Lemming.DEATHTYPE_FALL:
			GameManager.audio.play("sndSplat");
			this.playAnim("splat", 15);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.remove();
			}, this);
			break;
		case Lemming.DEATHTYPE_DROWN:
			GameManager.audio.play("sndDrown");
			this.playAnim("drown", 15);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.remove();
			}, this);
			break;
		case Lemming.DEATHTYPE_BURN:
			GameManager.audio.play("sndBurn");
			this.playAnim("burn", 15);
			this.animations.currentAnim.onComplete.addOnce(function() {
				this.remove();
			}, this);
			break;
		case Lemming.DEATHTYPE_INSTANT:
			this.remove();
			break;
	}
};

Lemming.prototype.remove = function() {
	this.markedForRemoval = true;
};
var Prop = function(x, y, level) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);

	this.level = level;

	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});
	this.anchor.setTo(0.5, 0.5);

	this.objectType = "prop";
	this.type = "";
};

Prop.prototype = Object.create(Phaser.Sprite.prototype);
Prop.prototype.constructor = Prop;

Prop.prototype.playAnim = function(key, frameRate) {
	this.animations.play(key, frameRate * GameManager.speedManager.effectiveSpeed);
	if(GameManager.speedManager.effectiveSpeed === 0) {
		this.animations.stop();
	}
};

Prop.prototype.update = function() {
	// Trap stuff
	var a, lem;
	if(this.objectType === "trap") {
		// Search for lemmings
		for(a = 0;a < this.level.lemmingsGroup.children.length;a++) {
			lem = this.level.lemmingsGroup.children[a];
			if(!lem.dead && lem.active && this.inPosition(lem.x, lem.y) && this.animations.currentAnim.name === "idle") {
				lem.die(this.deathType);
				// Play kill animation, if applicable
				if(this.animations.getAnimation("kill")) {
					this.playAnim("kill", 15);
					if(this.killSound) {
						GameManager.audio.play(this.killSound);
					}
				}
			}
		}
	}
};

Prop.prototype.setAsDoor = function(type, lemmings, rate, delay) {
	// Set primary data
	this.objectType = "door";
	this.type = type;

	// Define properties
	Object.defineProperties(this, {
		"lemmingsGroup": {
			get() {
				return this.level.lemmingsGroup;
			}
		}
	});

	// Set configuration
	var doorConfig = game.cache.getJSON("config").props.doors[type];
	this.loadTexture(doorConfig.atlas);
	var a, openingFrames = [], idleFrames = [], openFrames = [];
	for(a = 0;a < doorConfig.frames;a++) {
		var anim = doorConfig.animName + a.toString() + ".png";
		if(a == 0) {
			idleFrames.push(anim);
		}
		if(a == doorConfig.frames - 1) {
			openFrames.push(anim);
		}
		openingFrames.push(anim);
	}

	// Set class variables
	this.lemmings = lemmings;
	this.rate = Math.max(10, rate);
	this.delay = Math.max(0, delay);

	// Set animation
	this.animations.add("opening", openingFrames, 15, false);
	this.animations.add("idle", idleFrames, 15, false);
	this.animations.add("open", openFrames, 15, false);
	this.playAnim("idle", 15);

	// Set functions
	this.openDoor = function() {
		// Play sound
		if(GameManager.level.objectLayer.doorGroup.children[0] === this) {
			GameManager.audio.play(doorConfig.sound.open);
		}
		// Set event
		this.animations.getAnimation("opening").onComplete.addOnce(function() {
			this.playAnim("open", 15);
			var alarm = new Alarm(30, function() {
				this.opened();
				if(GameManager.level.objectLayer.doorGroup.children[0] === this) {
					this.state.playLevelBGM();
				}
			}, this);
		}, this);
		// Play animation
		this.playAnim("opening", 15);
	};
	this.opened = function() {
		if(this.delay === 0) {
			this.spawnLemming(true);
		}
		else {
			var alarm = new Alarm(this.delay, function() {
				this.spawnLemming(true);
			}, this);
		}
	};
	this.spawnLemming = function(recurring) {
		if(typeof recurring === "undefined") {
			var recurring = true;
		}
		if(this.lemmings > 0 && this.state.lemmingPool) {
			this.lemmings--;
			var lem = this.state.lemmingPool.create(this.x, this.y + 30);
			this.lemmingsGroup.add(lem);
			if(recurring) {
				var alarm = new Alarm(this.rate, this.spawnLemming, this);
			}
		}
	};
};

Prop.prototype.setAsExit = function(type) {
	this.objectType = "exit";
	this.type = type;

	// Set configuration
	var propConfig = game.cache.getJSON("config").props.exits[type];
	this.loadTexture(propConfig.atlas);
	var a, idleFrames = [];
	for(a = 0;a < propConfig.frames;a++) {
		var anim = propConfig.animName + a.toString() + ".png";
		idleFrames.push(anim);
	}

	// Set animation
	this.animations.add("idle", idleFrames, 15, true);
	this.playAnim("idle", 15);

	// Set bounding box
	this.bbox = {
		base: {
			left: propConfig.bbox.left,
			right: propConfig.bbox.right,
			top: propConfig.bbox.top,
			bottom: propConfig.bbox.bottom
		},
		get left() {
			return this.owner.x + this.base.left;
		},
		get right() {
			return this.owner.x + this.base.right;
		},
		get top() {
			return this.owner.y + this.base.top;
		},
		get bottom() {
			return this.owner.y + this.base.bottom;
		},

		owner: this
	};

	// Set functions
	this.inPosition = function(xCheck, yCheck) {
		if(xCheck >= Math.min(this.bbox.left, this.bbox.right) && xCheck <= Math.max(this.bbox.left, this.bbox.right) &&
			yCheck >= Math.min(this.bbox.top, this.bbox.bottom) && yCheck <= Math.max(this.bbox.top, this.bbox.bottom)) {
			return true;
		}
		return false;
	};
};

Prop.prototype.setAsTrap = function(type) {
	this.objectType = "trap";
	this.type = type;

	// Set configuration
	var propConfig = game.cache.getJSON("config").props.traps[type];
	this.loadTexture(propConfig.atlas);
	var a, idleFrames = [], killFrames = [];
	// Add idle animation
	for(a = 0;a < propConfig.animations.idle.frames.length;a++) {
		idleFrames.push(propConfig.animations.idle.frames[a]);
	}
	// Add kill animation, if any
	if(propConfig.animations.kill) {
		for(a = 0;a < propConfig.animations.kill.frames.length;a++) {
			killFrames.push(propConfig.animations.kill.frames[a]);
		}
	}
	// Set sound effect(s)
	this.killSound = null;
	if(propConfig.killsound) {
		this.killSound = propConfig.killsound;
	}

	// Set animation(s)
	this.animations.add("idle", idleFrames, 15, true);
	if(killFrames.length > 0) {
		this.animations.add("kill", killFrames, 15, false);
		this.animations.getAnimation("kill").onComplete.add(function() {
			this.playAnim("idle", 15);
		}, this);
	}
	this.playAnim("idle", 15);

	// Set bounding box
	this.bbox = {
		base: {
			left: propConfig.bbox.left,
			right: propConfig.bbox.right,
			top: propConfig.bbox.top,
			bottom: propConfig.bbox.bottom
		},
		get left() {
			return this.owner.x + (this.base.left * this.owner.scale.x);
		},
		get right() {
			return this.owner.x + (this.base.right * this.owner.scale.x);
		},
		get top() {
			return this.owner.y + (this.base.top * this.owner.scale.y);
		},
		get bottom() {
			return this.owner.y + (this.base.bottom * this.owner.scale.y);
		},

		owner: this
	};

	// Set anchor
	// if(propConfig.anchor) {
	// 	this.anchor.setTo(propConfig.anchor.x, propConfig.anchor.y);
	// }
	this.anchor.set(0.5, 0.5);

	// Set trap properties
	this.instant = true;
	if(!propConfig.instant) {
		this.instant = false;
	}
	this.deathType = Lemming.DEATHTYPE_DROWN;
	if(propConfig.deathtype) {
		this.deathType = Lemming[propConfig.deathtype];
	}

	// Set functions
	this.inPosition = function(xCheck, yCheck) {
		if(xCheck >= Math.min(this.bbox.left, this.bbox.right) && xCheck <= Math.max(this.bbox.left, this.bbox.right) &&
			yCheck >= Math.min(this.bbox.top, this.bbox.bottom) && yCheck <= Math.max(this.bbox.top, this.bbox.bottom)) {
			return true;
		}
		return false;
	};
};
var bootState = {
	loadFunction: null,
	loadSignalAdded: false,

	create: function() {
		var resizeFunction = function() {
			this.scaleMode = Phaser.ScaleManager.USER_SCALE;
			var scaleFactor = Math.min(window.innerWidth / game.width, window.innerHeight / game.height);
			this.setUserScale(scaleFactor, scaleFactor, 0, 0);
		};
		game.scale.setResizeCallback(resizeFunction, game.scale);
		resizeFunction.call(game.scale);
		// Disable context menu (right-click menu for browsers)
		game.canvas.oncontextmenu = function (e) { e.preventDefault(); }

		// Load game
		this.loadGame();

		// Initialize global game properties
		game.tiles = {
			solidTileTypes: [1, 2]
		}

		// Load asset list
		this.loadAssetList("./assets/asset_list.json");
	},

	loadAssetList: function(assetListFilename) {
		// Load asset list
		game.load.json("assetList", assetListFilename);


		this.loadFunction = function(progress, fileKey, success, totalLoadedFiles, totalFiles) {
			if(progress === undefined) {
				progress = -1;
			}

			if(progress >= 0 && totalLoadedFiles >= totalFiles) {
				game.load.onFileComplete.remove(this.loadFunction, this);
				this.loadFunction = null;
				this.loadSignalAdded = false;
				this.loadAssets();
			}
			else if(!this.loadSignalAdded) {
				this.loadSignalAdded = true;
				game.load.onFileComplete.add(this.loadFunction, this);
			}
		}
		this.loadFunction();
		game.load.start();
	},

	loadAssets: function() {
		var assetList = game.cache.getJSON("assetList");

		// Load sprites
		var a, curAsset, curList = assetList.sprites;
		for(a in curList) {
			curAsset = curList[a];
			game.load.spritesheet(curAsset.key, curAsset.url, curAsset.frameWidth, curAsset.frameHeight);
		}

		// Load sprite atlases
		curList = assetList.sprite_atlases;
		for(a in curList) {
			curAsset = curList[a];
			game.load.atlasJSONArray(curAsset.key, curAsset.url, curAsset.atlasUrl);
		}

		// Load images
		curList = assetList.images;
		for(a in curList) {
			curAsset = curList[a];
			game.load.image(curAsset.key, curAsset.url);
		}

		// Load sounds
		curList = assetList.sounds;
		for(a in curList) {
			curAsset = curList[a];
			game.load.audio(curAsset.key, curAsset.url);
		}

		// Load tilemaps
		curList = assetList.tilemaps;
		for(a in curList) {
			curAsset = curList[a];
			game.load.tilemap(curAsset.key, curAsset.url, null, Phaser.Tilemap.TILED_JSON);
		}

		// Load JSON
		curList = assetList.json;
		for(a in curList) {
			curAsset = curList[a];
			game.load.json(curAsset.key, curAsset.url);
		}

		// Add callback for Finish Loading
		this.loadFunction = function(progress, fileKey, success, totalLoadedFiles, totalFiles) {
			if(progress === undefined) {
				progress = -1;
			}

			if(progress >= 0 && totalLoadedFiles >= totalFiles) {
				game.load.onFileComplete.remove(this.loadFunction, this);
				this.loadFunction = null;
				this.loadSignalAdded = false;
				game.state.start("menu");
			}
			else if(!this.loadSignalAdded) {
				this.loadSignalAdded = true;
				game.load.onFileComplete.add(this.loadFunction, this);
			}
		}
		this.loadFunction();
	},

	loadGame: function() {
		// Load progress
		var rawSave = localStorage["tilelemmings.profiles.default.progress"];
		if(rawSave) {
			game.saveFile = JSON.parse(rawSave);
		}
		else {
			game.saveFile = {};
		}

		// Load settings
		GameManager.loadSettings();
	}
};
var menuState = {
	background: null,
	guiGroup: [],

	defaultLabelStyle: {
		font: "bold 12pt Arial",
		fill: "#FFFFFF",
		boundsAlignH: "center",
		stroke: "#000000",
		strokeThickness: 3,
		center: true
	},

	create: function() {
		this.background = new Background("bgMainMenu");
		game.world.add(this.background);

		this.setupMainMenu();

		// Enable control
		this.keyboard = {
			k: game.input.keyboard.addKey(Phaser.Keyboard.K)
		};
		game.input.enabled = true;

		// CHEAT: Unlock all levels
		this.keyboard.k.onDown.add(function() {
			if(this.keyboard.k.ctrlKey && this.keyboard.k.shiftKey) {
				console.log("CHEATER!");
				var a, b, cat;
				for(a in game.saveFile) {
					cat = game.saveFile[a];
					for(b = 0;b < 50;b++) {
						if(cat.indexOf(b) === -1) {
							cat.push(b);
						}
					}
				}
			}
		}, this);
	},

	setupMainMenu: function() {
		this.clearGUIGroup();

		// Add button(s)
		var btnProps = {
			basePos: {
				x: 40,
				y: 30
			},
			width: 160,
			height: 60,
			spacing: 20
		};
		btnProps.cols = Math.floor((game.width - (btnProps.basePos.x * 2)) / (btnProps.width + btnProps.spacing))
		// Create level buttons
		var levelList = game.cache.getJSON("levelList").difficulties;
		for(var a = 0;a < levelList.length;a++) {
			var levelFolder = levelList[a];
			var xTo = btnProps.basePos.x + ((btnProps.width + btnProps.spacing) * (a % btnProps.cols));
			var yTo = btnProps.basePos.y + ((btnProps.height + btnProps.spacing) * Math.floor(a / btnProps.cols));
			var btn = new GUI_MainMenuButton(game, xTo, yTo, "mainmenu");
			btn.set({
				pressed: "btnGray_Down.png",
				released: "btnGray_Up.png"
			}, function() {
				this.state.setupLevelList(this.params.difficulty.index);
			}, btn);
			btn.params = {
				difficulty: {
					resref: levelFolder.resref,
					name: levelFolder.name,
					index: a
				}
			};
			btn.resize(160, 60);
			btn.label.text = btn.params.difficulty.name;
			this.guiGroup.push(btn);
		}

		// Create options button
		var placePos = {x: 40, y: 320};
		var btn = new GUI_MainMenuButton(game, placePos.x, placePos.y, "mainmenu");
		btn.label.text = "Options";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.setupOptionsMenu();
		}, this);
		btn.resize(160, 60);
		this.guiGroup.push(btn);
	},

	setupLevelList: function(index) {
		this.clearGUIGroup();

		this.levelList = [];
		var levelFolder = game.cache.getJSON("levelList").difficulties[index];
		var btnProps = {
			basePos: {
				x: 40,
				y: 30
			},
			width: 160,
			height: 60,
			spacing: 20
		};
		btnProps.cols = Math.floor((game.width - (btnProps.basePos.x * 2)) / (btnProps.width + btnProps.spacing))
		var completedLevels = [];
		if(game.saveFile[levelFolder.resref]) {
			completedLevels = game.saveFile[levelFolder.resref];
		}
		// Create level buttons
		for(var a = 0;a < levelFolder.levels.length;a++) {
			// Don't add not unlocked levels
			if(a === 0 || completedLevels.indexOf(a-1) !== -1) {
				var level = levelFolder.levels[a];
				var xTo = btnProps.basePos.x + ((btnProps.width + btnProps.spacing) * (a % btnProps.cols));
				var yTo = btnProps.basePos.y + ((btnProps.height + btnProps.spacing) * Math.floor(a / btnProps.cols));
				var btn = new GUI_MainMenuButton(game, xTo, yTo, "mainmenu");
				btn.resize(btnProps.width, btnProps.height);
				btn.label.text = level.name;
				btn.params = {
					url: levelFolder.baseUrl + level.filename
				};
				btn.set({
					pressed: "btnGray_Down.png",
					released: "btnGray_Up.png"
				}, function() {
					game.state.start("intermission", true, false, this.params.levelFolder, this.params.level);
				}, btn);
				btn.params = {
					levelFolder: levelFolder,
					level: level
				}
				this.guiGroup.push(btn);
			}
		}

		// Create back button
		var btn = new GUI_MainMenuButton(game, 4, 4, "mainmenu");
		btn.resize(40, 24);
		btn.label.text = "Back";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.state.setupMainMenu();
		}, btn);
		this.guiGroup.push(btn);
	},

	setupOptionsMenu: function() {
		this.clearGUIGroup();
		var a, chan;

		this.settings = {
			audio: {
				volume: {}
			}
		};
		for(a in GameManager.audio.volume) {
			this.settings.audio.volume[a] = GameManager.audio.volume[a];
		}

		// Create Save button
		var placePos = {x: 260, y: 530};
		var btn = new GUI_MainMenuButton(game, placePos.x, placePos.y, "mainmenu");
		btn.label.text = "OK";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			// Apply settings
			for(a in this.state.settings.audio.volume) {
				GameManager.audio.volume[a] = this.state.settings.audio.volume[a];
			}
			// Save settings and go back to main menu
			GameManager.saveSettings();
			this.state.setupMainMenu();
		}, btn);
		btn.resize(80, 30);
		this.guiGroup.push(btn);

		// Create Cancel button
		placePos = {x: 500, y: 530};
		var btn = new GUI_MainMenuButton(game, placePos.x, placePos.y, "mainmenu");
		btn.label.text = "Cancel";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.state.setupMainMenu();
		}, btn);
		btn.resize(80, 30);
		this.guiGroup.push(btn);

		// Create volume slider(s)
		// Create label
		placePos = {x: 160, y: 20};
		var elem = game.add.text(placePos.x, placePos.y, "Volume", this.defaultLabelStyle);
		elem.setTextBounds(-120, 0, 240, 30);
		this.guiGroup.push(elem);
		// SFX volume
		placePos = {x: 160, y: 80};
		var elem = new GUI_Slider(game, placePos.x, placePos.y, 256, "mainmenu", {base: this.settings.audio.volume, name: "sfx", min: 0, max: 1});
		elem.label.text = "Sound";
		this.guiGroup.push(elem);
		// BGM volume
		placePos.y += 60;
		var elem = new GUI_Slider(game, placePos.x, placePos.y, 256, "mainmenu", {base: this.settings.audio.volume, name: "bgm", min: 0, max: 1});
		elem.label.text = "Music";
		this.guiGroup.push(elem);
	},

	clearGUIGroup: function() {
		while(this.guiGroup.length > 0) {
			var elem = this.guiGroup.shift();
			if(elem.remove) {
				elem.remove();
			}
			else {
				elem.destroy();
			}
		}
	}
};
var intermissionState = {
	background: null,
	labels: [],
	guiGroup: [],
	levelFolder: null,
	levelObj: null,

	drawGroup: null,

	level: null,
	minimap: null,

	init: function(levelFolder, levelObj, level) {
		this.levelFolder = levelFolder;
		this.levelObj = levelObj;
		if(level !== undefined) {
			this.level = level;
		}
	},

	preload: function() {
		game.load.json("level", this.levelFolder.baseUrl + this.levelObj.filename);
	},

	create: function() {
		this.drawGroup = game.add.group();
		// Add background
		this.background = new Background("bgMainMenu");
		this.drawGroup.add(this.background);
		// Init map
		var cb = function() {
			this.start();
		};
		this.level = new Level(game.cache.getJSON("level"), cb, this, this.levelFolder, this.levelObj);
		game.world.bringToTop(this.drawGroup);
	},

	start: function() {
		this.createScreen();

		// Add user input
		game.input.onTap.add(function startTheLevel() {
			if(!this.mouseOverGUI()) {
				game.input.onTap.remove(startTheLevel, this);
				this.startLevel();
			}
		}, this);

		// Add 'return to main menu' button
		var btn = new GUI_MainMenuButton(game, 4, 4, "mainmenu");
		this.guiGroup.push(btn);
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.clearState();
			this.level.clearAssets();
			GameManager.alarms.clear();
			this.level.destroy();
			game.state.start("menu", true, false);
		}, this);
		btn.resize(60, 24);
		btn.label.text = "Main Menu";
		btn.label.fontSize = 10;
		this.drawGroup.add(btn);

		// Order drawGroup
		this.drawGroup.sendToBack(this.level);
	},

	startLevel: function() {
		this.clearState();
		game.state.start("game", false, false, this.levelFolder, this.levelObj, this.level);
	},

	mouseOverGUI: function() {
		for(var a = 0;a < this.guiGroup.length;a++) {
			var elem = this.guiGroup[a];
			if(elem.mouseOver()) {
				return true;
			}
		}
		return false;
	},

	clearState: function() {
		// Destroy minimap
		this.minimap.destroy();
		// Destroy labels
		while(this.labels.length > 0) {
			var gobj = this.labels.shift();
			if(gobj.remove) {
				gobj.remove();
			}
			else {
				gobj.destroy();
			}
		}
		// Destroy GUI elements (buttons etc)
		while(this.guiGroup.length > 0) {
			var gobj = this.guiGroup.shift();
			if(gobj.remove) {
				gobj.remove();
			}
			else {
				gobj.destroy();
			}
		}
		// Destroy background
		this.background.destroy();

		this.drawGroup.destroy();
	},

	createScreen: function() {
		this.minimap = new GUI_Minimap(this.level);
		this.minimap.width = Math.max(240, Math.min(480, this.level.baseWidth * 4));
		this.minimap.height = Math.max(180, Math.min(480, this.level.baseHeight * 4));
		this.minimap.x = (game.width - 30) - this.minimap.width;
		this.minimap.y = 30;
		this.drawGroup.add(this.minimap);

		var txt = game.add.text(120, 10, this.level.name, {
			font: "bold 20pt Arial",
			fill: "#FFFFFF",
			boundsAlignH: "center",
			stroke: "#000000",
			strokeThickness: 3
		});
		txt.setTextBounds(0, 0, 240, 40);
		this.labels.push(txt);
		this.drawGroup.add(txt);

		var newStyle = {
			font: "12pt Arial",
			fill: "#FFFFFF",
			stroke: "#000000",
			strokeThickness: 3
		};
		txt = game.add.text(120, 70, this.level.lemmingCount.toString() + " lemmings\n" + Math.floor((this.level.lemmingNeed / this.level.lemmingCount) * 100) + "% to be saved", newStyle);
		txt.setTextBounds(0, 0, 240, 80);
		this.labels.push(txt);
		this.drawGroup.add(txt);
	}
};
var gameState = {
	level: null,
	zoom: 1,
	minimap: null,
	lemmingSelected: null,
	actionSelect: "",

	scrollOrigin: {
		x: 0,
		y: 0
	},

	guiGroup: null,

	grid: {
		enabled: false,
		button: null
	},

	init: function(levelFolder, levelObj, level) {
		this.levelFolder = levelFolder;
		this.levelObj = levelObj;
		this.level = level;

		this.nukeStarted = false;
	},

	create: function() {
		this.enableUserInteraction();
		// Create groups
		this.guiGroup = game.add.group(game.stage);

		// Create GUI
		this.createLevelGUI();

		// Create camera config
		this.cam = new Camera(game, this);

		this.startLevel();

		this.initPools();
	},

	initPools: function() {
		this.lemmingPool = new ObjectPool(Lemming, [], 200);
	},

	enableUserInteraction: function() {
		// Create keys
		this.keyboard = {
			left: game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
			right: game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
			up: game.input.keyboard.addKey(Phaser.Keyboard.UP),
			down: game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
			space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
			p: game.input.keyboard.addKey(Phaser.Keyboard.P),
			f: game.input.keyboard.addKey(Phaser.Keyboard.F),
			q: game.input.keyboard.addKey(Phaser.Keyboard.Q),
			e: game.input.keyboard.addKey(Phaser.Keyboard.E),
			w: game.input.keyboard.addKey(Phaser.Keyboard.W),
			s: game.input.keyboard.addKey(Phaser.Keyboard.S),
			a: game.input.keyboard.addKey(Phaser.Keyboard.A),
			d: game.input.keyboard.addKey(Phaser.Keyboard.D),
			g: game.input.keyboard.addKey(Phaser.Keyboard.G)
		};

		// Set pause functionality
		this.keyboard.p.onDown.add(function() {
			this.pauseGame();
		}, this);
		this.keyboard.space.onDown.add(function() {
			this.pauseGame();
		}, this);
		// Set fast-forward functionality
		this.keyboard.f.onDown.add(function() {
			this.fastForward();
		}, this);
		// Set toggle grid functionality
		this.keyboard.g.onDown.add(function() {
			this.toggleGrid();
		}, this);

		game.input.mouse.capture = true;
		// Add left-mouse button functionality
		game.input.activePointer.leftButton.onDown.add(function() {
			// Assign action to lemming
			if (this.lemmingSelected != null && this.level.actions[this.actionSelect] && this.level.actions[this.actionSelect] > 0) {
				this.lemmingSelected.setAction(this.actionSelect);
			}
		}, this);
		// Add right-mouse scrolling possibility
		game.input.activePointer.rightButton.onDown.add(function() {
			this.cam.scrolling = true;
			this.scrollOrigin = this.getScreenCursor();
		}, this);
		game.input.activePointer.rightButton.onUp.add(function() {
			this.cam.scrolling = false;
		}, this);
	},

	startLevel: function() {
		// Zoom
		this.zoomTo(2);
		// Create minimap
		this.minimap = new GUI_Minimap(this.level);
		this.minimap.x = game.camera.width - this.minimap.width;
		this.minimap.y = game.camera.height - this.minimap.height;
		this.minimap.onLevelStart();
		this.guiGroup.add(this.minimap);

		// Z-Order
		this.level.zOrder();

		// Let's go... HRRRRN
		var snd = GameManager.audio.play("sndLetsGo");
		var alarm = new Alarm(90, function() {
			this.openDoors();
		}, this);
	},

	pauseGame: function() {
		if (!GameManager.speedManager.paused) {
			GameManager.speedManager.pause();
			// Press pause GUI button
			GameManager.speedManager.pauseButton.visualPress();
		} else {
			GameManager.speedManager.unpause();
			// Release pause GUI button
			GameManager.speedManager.pauseButton.visualRelease();
		}
	},

	fastForward: function() {
		if (GameManager.speedManager.speed > 1) {
			GameManager.speedManager.setSpeed(1);
			// Press fast forward GUI button
			GameManager.speedManager.fastForwardButton.visualRelease();
		} else {
			GameManager.speedManager.setSpeed(3);
			// Release fast forward GUI button
			GameManager.speedManager.fastForwardButton.visualPress();
		}
	},

	toggleGrid: function() {
		if (this.grid.enabled) {
			this.grid.enabled = false;
			this.level.gridGroup.visible = false;
			this.grid.button.visualRelease();
		} else {
			this.grid.enabled = true;
			this.level.gridGroup.visible = true;
			this.grid.button.visualPress();
		}
	},

	nuke: function() {
		// Start nuke
		if (!this.nukeStarted) {
			GameManager.audio.play("sndOhNo");
			this.nukeStarted = true;
			this.nuke();
			// Set lemming count of all doors to 0
			for (var a = 0; a < this.level.objectLayer.doorGroup.children.length; a++) {
				var door = this.level.objectLayer.doorGroup.children[a];
				door.lemmings = 0;
			}
			this.level.started = true;
		}
		// Proceed nuke
		else {
			var searchComplete = false;
			for (var a = 0; a < this.level.lemmingsGroup.children.length && !searchComplete; a++) {
				var lem = this.level.lemmingsGroup.children[a];
				if (lem.subaction.name !== "exploder") {
					lem.setExploder();
					searchComplete = true;
				}
			}
			// Set nuke alarm
			if (searchComplete) {
				var alarm = new Alarm(10, function() {
					this.nuke();
				}, this);
			}
		}
	},

	getWorldCursor: function() {
		return {
			x: game.input.activePointer.worldX / this.zoom,
			y: game.input.activePointer.worldY / this.zoom
		};
	},

	getScreenCursor: function() {
		var worldCursor = this.getWorldCursor();
		return {
			x: worldCursor.x - this.cam.x,
			y: worldCursor.y - this.cam.y
		};
	},

	zoomTo: function(factor) {
		this.zoom = factor;
		this.level.scale.setTo(factor);
		game.camera.bounds.setTo(0, 0, Math.floor(this.level.totalWidth * this.zoom), Math.floor(this.level.totalHeight * this.zoom));
	},

	update: function() {
		// Update alarms
		GameManager.alarms.update();
		// Determine lemmings under mouse cursor
		var lemmingSelect = {
			data: [],
			removeBy: function(callback) {
				for (var a = this.data.length - 1; a >= 0; a--) {
					var lem = this.data[a];
					if (!callback.call(lem)) {
						this.data.splice(a, 1);
					}
				}
			}
		};
		for (var a = 0; a < this.level.lemmingsGroup.children.length; a++) {
			var obj = this.level.lemmingsGroup.children[a];
			obj.cursorDeselect();
			if (obj.mouseOver()) {
				lemmingSelect.data.push(obj);
			}
		}
		// Callback for checking the right lemming
		lemmingSelect.removeBy(this.lemmingSelectableCallback);
		if (!this.cursorOverGUI() && lemmingSelect.data.length > 0) {
			lemmingSelect.data[0].cursorSelect();
		}

		// Scroll
		// Right-click
		if (this.cam.scrolling) {
			var originRel = this.getScreenCursor();
			var speedFactor = 2;
			var moveRel = {
				x: (this.scrollOrigin.x - originRel.x) * speedFactor,
				y: (this.scrollOrigin.y - originRel.y) * speedFactor
			};
			this.scrollOrigin = this.getScreenCursor();
			this.cam.move(moveRel.x, moveRel.y);
		}
		// WASD
		if (!this.cam.scrolling) {
			var moveRel = {
				x: 0,
				y: 0
			};
			if (this.keyboard.a.isDown) {
				moveRel.x--;
			}
			if (this.keyboard.d.isDown) {
				moveRel.x++;
			}
			if (this.keyboard.w.isDown) {
				moveRel.y--;
			}
			if (this.keyboard.s.isDown) {
				moveRel.y++;
			}
			var speedFactor = 10;
			moveRel.x *= speedFactor;
			moveRel.y *= speedFactor;
			if (moveRel.x !== 0 || moveRel.y !== 0) {
				this.cam.move(moveRel.x, moveRel.y, true);
			}
		}

		// Test for victory/defeat
		if (this.level.started && !this.level.ended) {
			var allDoorsEmpty = true;
			for (var a = 0; a < this.level.objectLayer.doorGroup.children.length && allDoorsEmpty; a++) {
				var door = this.level.objectLayer.doorGroup.children[a];
				if (door.lemmings > 0) {
					allDoorsEmpty = false;
				}
			}
			if (allDoorsEmpty && this.level.lemmingsGroup.children.length === 0) {
				this.level.ended = true;
				if (this.level.saved >= this.level.lemmingNeed) {
					// Victory
					this.goToNextLevel();
				} else {
					// Defeat
					this.retryLevel();
				}
			}
		}
	},

	clearState: function(destroyLevel) {
		// Remove all GUI objects
		this.guiGroup.destroy();

		// Destroy level
		if(destroyLevel) {
			this.level.clearAssets();
			this.level.destroy();
		}
		else {
			game.world.remove(this.level);
		}

		// Destroy alarms
		GameManager.alarms.clear();

		// Reset speed manager
		GameManager.speedManager.paused = false;
		GameManager.speedManager.speed = 1;

		// Stop the music
		this.stopBGM();
	},

	goToNextLevel: function() {
		// Clear state
		this.clearState(true);
		// Get current level
		var levelIndex = this.getLevelIndex();
		this.saveGame(levelIndex);
		if (this.levelFolder.levels.length > levelIndex + 1) {
			var newLevel = this.levelFolder.levels[levelIndex + 1];
			game.state.start("intermission", true, false, this.levelFolder, newLevel);
		} else {
			game.state.start("menu");
		}
	},

	retryLevel: function() {
		this.clearState(true);
		game.state.start("intermission", true, false, this.levelFolder, this.levelObj, this.level);
	},

	getLevelIndex: function() {
		for (var a = 0; a < this.levelFolder.levels.length; a++) {
			var level = this.levelFolder.levels[a];
			if (level === this.levelObj) {
				return a;
			}
		}
		return -1;
	},

	saveGame: function(levelIndex) {
		var rawSave = localStorage["tilelemmings.profiles.default.progress"];
		var curSave = {};
		if (rawSave) {
			curSave = JSON.parse(rawSave);
			if (!curSave[this.levelFolder.resref]) {
				curSave[this.levelFolder.resref] = [];
			}
			if (curSave[this.levelFolder.resref].indexOf(levelIndex) === -1) {
				curSave[this.levelFolder.resref].push(levelIndex);
			}
		} else {
			curSave[this.levelFolder.resref] = [];
			curSave[this.levelFolder.resref].push(levelIndex);
		}
		game.saveFile = curSave;
		localStorage["tilelemmings.profiles.default.progress"] = JSON.stringify(curSave);
	},

	cursorOverGUI: function() {
		if (this.minimap && this.minimap.mouseOver()) {
			return true;
		}
		for (var a = 0; a < this.guiGroup.children.length; a++) {
			var uiNode = this.guiGroup.children[a];
			if (uiNode.mouseOver && uiNode.mouseOver()) {
				return true;
			}
		}
		return false;
	},

	lemmingSelectableCallback: function() {
		// Cursors left and right
		if ((this.state.keyboard.left.isDown || this.state.keyboard.q.isDown) && this.dir != -1) {
			return false;
		}
		if ((this.state.keyboard.right.isDown || this.state.keyboard.e.isDown) && this.dir != 1) {
			return false;
		}
		if (this.dead || !this.active) {
			return false;
		}
		if (this.level.actions[this.state.actionSelect] >= 0) {
			if (this.action.name == this.state.actionSelect ||
				this.subaction.name == this.state.actionSelect) {
				// Exclude builders at their end
				if (this.action.name === "builder" && this.animations.currentAnim.name === "build_end") {
					// Don't make unselectable
				} else {
					return false;
				}
			}
			if (typeof this.attributes[this.state.actionSelect] !== "undefined" && this.attributes[this.state.actionSelect]) {
				return false;
			}
		}
		return true;
	},

	openDoors: function() {
		for (var a = 0; a < this.level.objectLayer.doorGroup.children.length; a++) {
			var obj = this.level.objectLayer.doorGroup.children[a];
			obj.openDoor();
		}
	},

	playLevelBGM: function() {
		GameManager.audio.play_bgm("bgm");
	},

	stopBGM: function() {
		GameManager.audio.stop_bgm();
	},

	createLevelGUI: function() {
		var buttons = [];

		// Create action buttons
		var a, animPrefix, btn;
		for (a in this.level.actions) {
			animPrefix = "Btn_" + a.substr(0, 1).toUpperCase() + a.substr(1) + "_";
			btn = new GUI_Button(game, 0, 0);
			this.guiGroup.add(btn);
			buttons.push(btn);
			btn.set({
				released: animPrefix + "0.png",
				pressed: animPrefix + "1.png"
			}, a, "action");

			// Assign buttons
			btn.actionName = a;
			if(this.level.actions[a] > 0) {
				btn.label.text = this.level.actions[a].toString();
			}
		}

		// Create pause button
		btn = new GUI_Button(game, 0, 0);
		this.guiGroup.add(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_Pause_0.png",
			pressed: "Btn_Pause_1.png"
		}, "pause", "misc");
		GameManager.speedManager.pauseButton = btn;

		// Create fast forward button
		btn = new GUI_Button(game, 0, 0);
		this.guiGroup.add(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_FastForward_0.png",
			pressed: "Btn_FastForward_1.png"
		}, "fastForward", "misc");
		GameManager.speedManager.fastForwardButton = btn;

		// Create nuke button
		btn = new GUI_Button(game, 0, 0);
		this.guiGroup.add(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_Nuke_0.png",
			pressed: "Btn_Nuke_1.png"
		}, "nuke", "misc");
		btn.doubleTap.enabled = true;

		// Create grid button
		btn = new GUI_Button(game, 0, 0);
		this.guiGroup.add(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_Grid_0.png",
			pressed: "Btn_Grid_1.png"
		}, "grid", "misc");
		this.grid.button = btn;

		// Align buttons
		var alignX = 0;
		for (a = 0; a < buttons.length; a++) {
			btn = buttons[a];
			btn.x = alignX;
			btn.y = game.camera.height - btn.height;
			alignX += btn.width;
		}
	},

	deselectAllActions: function() {
		for (var a = 0; a < this.guiGroup.children.length; a++) {
			var obj = this.guiGroup.children[a];
			if (obj.subType === "action") {
				obj.deselect();
			}
		}
	},

	expendAction: function(actionName, amount) {
		if(amount === undefined) { amount = 1; }

		this.setActionAmount(actionName, this.getActionAmount(actionName) - amount);
	},

	getActionAmount: function(actionName) {
		if(this.level.actions[actionName]) {
			return this.level.actions[actionName];
		}
		return -1;
	},

	setActionAmount: function(actionName, amount) {
		if(amount === undefined) { amount = 0; }

		if(this.level.actions[actionName]) {
			this.level.actions[actionName] = amount;
			this.guiGroup.forEach(function(child, actionName, value) {
				if(child.subType && child.subType === "action" && child.actionName == actionName) {
					if(value === 0) {
						child.label.text = "";
					}
					else {
						child.label.text = value.toString();
					}
				}
			}, this, true, actionName, this.level.actions[actionName]);
		}
	},

	instancePosition: function(xCheck, yCheck, instanceTypeCheck) {
		var arrayCheck = [];
		switch (instanceTypeCheck) {
			case "lemming":
				arrayCheck = this.level.lemmingsGroup.children;
				break;
			case "door":
				arrayCheck = this.level.objectLayer.doorGroup.children;
				break;
			case "exit":
				arrayCheck = this.level.objectLayer.exitGroup.children;
				break;
			case "trap":
				arrayCheck = this.level.objectLayer.trapGroup.children;
				break;
		}
		var result = [];
		for (var a = 0; a < arrayCheck.length; a++) {
			var obj = arrayCheck[a];
			if (xCheck >= obj.bbox.left && xCheck <= obj.bbox.right &&
				yCheck >= obj.bbox.top && yCheck <= obj.bbox.bottom) {
				result.push(obj);
			}
		}
		return result;
	},

	/*
		method: getBlockerInTile(tileX, tileY[, checkLemming])
		Returns true if there is a blocker in that specified tile
		checkLemming specifies the lemming the check originates from(optional)
		If set, will not check for itself as a blocker, and will only detect blockers in
		the same tile that are in front of checkLemming
	*/
	getBlockerInTile: function(tileX, tileY, checkLemming) {
		if (checkLemming === undefined) {
			checkLemming = null;
		}

		var rect = {
			left: tileX * GameData.tile.width,
			top: (tileY * GameData.tile.height) + 1,
			right: (tileX * GameData.tile.width) + GameData.tile.width,
			bottom: ((tileY * GameData.tile.height) + GameData.tile.height) + 1
		};

		var a, lem;
		for (a = 0; a < this.level.lemmingsGroup.children.length; a++) {
			lem = this.level.lemmingsGroup.children[a];

			if (lem.action.name === "blocker" && !lem.action.idle &&
				lem.x >= rect.left && lem.x < rect.right &&
				lem.y >= rect.top && lem.y < rect.bottom &&
				checkLemming !== lem) {

				// No checkLemming has been specified
				if (!checkLemming) {
					return true;
				}
				// checkLemming has been specified but is not relevant(not in the same tile as lem)
				else if (checkLemming && !(checkLemming.x >= rect.left && checkLemming.x < rect.right &&
					checkLemming.y >= rect.top && checkLemming.y < rect.bottom)) {
					return true;
				}
				// checkLemming has been specified and in the same tile as lem; check for requirements
				else if (checkLemming && (checkLemming.x >= rect.left && checkLemming.x < rect.right &&
					checkLemming.y >= rect.top && checkLemming.y < rect.bottom)) {
					// Check to see if lem is in front of checkLemming
					if((checkLemming.x >= lem.x && checkLemming.dir === -1) ||
						(checkLemming.x <= lem.x && checkLemming.dir === 1)) {
						return true;
					}
				}
			}
		}
		return false;
	}
};
var game = new Phaser.Game(
	800,
	600,
	Phaser.AUTO,
	"content",
	false,
	false
);

// window.resizeGame = function(ratio) {
// 	// width = window.innerWidth;
// 	// height = window.innerHeight;
// 	game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
// 	// game.scale.setUserScale(width / 800, height / 600);
// };

game.state.add("boot", bootState);
game.state.add("menu", menuState);
game.state.add("intermission", intermissionState);
game.state.add("game", gameState);

game.state.start("boot");
var GameManager = {
	audio: {
		volume: {
			sfx: 0.75,
			bgm: 0.5
		},
		bgm: null,
		play: function(key, loop, channel) {
			if(loop === undefined) {
				loop = false;
			}
			if(channel === undefined) {
				channel = this.CHANNEL_SFX;
			}
			return game.sound.play(key, this.volume[this.channel_to_string(channel)], loop);
		},
		play_bgm: function(key) {
			this.stop_bgm();
			return this.bgm = game.sound.play(key, this.volume[this.channel_to_string(this.CHANNEL_BGM)], true);
		},
		stop_bgm: function() {
			if(this.bgm !== null) {
				this.bgm.stop();
				this.bgm = null;
			}
		},
		CHANNEL_SFX: 0,
		CHANNEL_BGM: 1,
		channel_to_string: function(channel) {
			switch(channel) {
				default:
				case this.CHANNEL_SFX:
					return "sfx";
					break;
				case this.CHANNEL_BGM:
					return "bgm";
					break;
			}
			return "";
		}
	},

	level: null,

	alarms: {
		data: [],
		remove: function(alarm) {
			var found = false;
			for (var a = 0; a < this.data.length && !found; a++) {
				var curAlarm = this.data[a];
				if (curAlarm === alarm) {
					found = true;
					this.data.splice(a, 1);
				}
			}
		},
		update: function() {
			var a;
			for(a = 0;a < this.data.length;a++) {
				this.data[a].update();
			}
		},
		clear: function() {
			while(this.data.length > 0) {
				this.data[0].cancel();
			}
		}
	},

	speedManager: {
		speed: 1,
		paused: false,
		get effectiveSpeed() {
			if (this.paused) {
				return 0;
			}
			return this.speed;
		},
		pauseButton: null,
		fastForwardButton: null,
		pause: function() {
			this.paused = true;
			this.refresh();
		},
		unpause: function() {
			this.paused = false;
			this.refresh();
		},
		refresh: function() {
			// Update objects
			var checkGroups = [
				GameManager.level.objectLayer.doorGroup.children,
				GameManager.level.objectLayer.exitGroup.children,
				GameManager.level.objectLayer.trapGroup.children,
				GameManager.level.lemmingsGroup.children
			];
			for (var b = 0; b < checkGroups.length; b++) {
				var grp = checkGroups[b];
				for (var a = 0; a < grp.length; a++) {
					var obj = grp[a];
					if (obj) {
						// Update animations
						if (obj.animations) {
							if (obj.animations.currentAnim && this.effectiveSpeed > 0) {
								var prevFrame = obj.animations.currentAnim.frame;
								obj.animations.currentAnim.paused = false;
								obj.animations.currentAnim.speed = (15 * this.effectiveSpeed);
							} else if (obj.animations.currentAnim && this.effectiveSpeed === 0) {
								obj.animations.paused = true;
							}
						}
					}
				}
			}
		},
		setSpeed: function(multiplier) {
			this.speed = multiplier;
			this.refresh();
		}
	},

	tilesets: {},

	saveSettings: function() {
		// Load previous settings
		var settings = localStorage["tilelemmings.profiles.default.settings"];
		if(settings) {
			settings = JSON.parse(settings);
		}
		else {
			settings = {};
		}

		// Parse settings
		if(!settings.audio) {
			settings.audio = {};
		}
		settings.audio.volume = this.audio.volume;

		// Save current settings
		localStorage["tilelemmings.profiles.default.settings"] = JSON.stringify(settings);
	},

	loadSettings: function() {
		// Load previous settings
		var settings = localStorage["tilelemmings.profiles.default.settings"];
		if(settings) {
			settings = JSON.parse(settings);
		}
		else {
			settings = {};
		}

		// Parse settings
		var a;
		if(settings.audio && settings.audio.volume) {
			for(a in settings.audio.volume) {
				this.audio.volume[a] = settings.audio.volume[a];
			}
		}
	}
};
