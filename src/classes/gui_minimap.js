var GUI_Minimap = function(level) {
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
