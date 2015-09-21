var GUI_Minimap = function() {
	Phaser.Group.call(this, game);
	game.add.existing(this);
	// Set state redirect
	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});

	// Set basic data
	this.scrolling = false;
	this.tiles = {
		width: this.state.map.tilewidth,
		height: this.state.map.tileheight
	};
	this.screenAnchor = {
		x: 0,
		y: 0
	};
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

	// Set up layers
	this.bg = null;
	this.layers = {
		tiles: game.add.group()
	};
	this.add(this.layers.tiles);

	// Create frame/viewport
	this.viewFrame = game.add.image(0, 0, "minimap", "frame.png");
	this.add(this.viewFrame);

	// Refresh minimap
	this.refresh();
};

GUI_Minimap.prototype = Object.create(Phaser.Group.prototype);
GUI_Minimap.prototype.constructor = GUI_Minimap;

GUI_Minimap.prototype.update = function() {
	if(this.scrolling) {
		this.scroll();
	}
	this.reposition();
};

GUI_Minimap.prototype.refresh = function() {
	// Clear minimap first
	this.clear();

	// Determine data
	var tileLayer = this.state.layers.tileLayer;
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
	this.bg.width = this.state.map.width * this.tiles.width;
	this.bg.height = this.state.map.height * this.tiles.height;
	this.add(this.bg);

	// Add event listener
	// Scroll minimap
	this.bg.inputEnabled = true;
	this.bg.events.onInputDown.add(function() {
		this.scrolling = true;
	}, this);
	this.bg.events.onInputUp.add(function() {
		this.scrolling = false;
	}, this);


	// Create tile layer
	var a, 
	    tile,
	    bmd = game.add.bitmapData(this.state.map.width, this.state.map.height);
	for(a = 0;a < tileLayer.data.length;a++) {
		tile = tileLayer.data[a];
		if(tileTypeRefs[tile]) {
			var tileX = (a % this.state.map.width);
			var tileY = Math.floor(a / this.state.map.width);
			// bmd.draw(tileTypeRefs[tile], tileX, tileY);
			bmd.setPixel(tileX, tileY, tileTypeRefs[tile].red, tileTypeRefs[tile].green, tileTypeRefs[tile].blue);
		}
	}
	var texture = bmd.generateTexture("minimap_tilelayer");
	bmd.destroy(true);
	// Apply tile layer
	var img = game.add.image(0, 0, "minimap_tilelayer");
	img.width = this.state.map.totalwidth;
	img.height = this.state.map.totalheight;
	this.layers.tiles.add(img);

	// Resize self
	this.resize();

	// Reposition self
	this.reposition();
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
		width: this.state.map.width,
		height: this.state.map.height
	}
	this.width = Math.max(this.limits.size.min.width, Math.min(this.limits.size.max.width, estimatedSize.width));
	this.height = Math.max(this.limits.size.min.height, Math.min(this.limits.size.max.height, estimatedSize.height));

	// Resize viewport frame
	this.viewFrame.width = this.state.cam.width;
	this.viewFrame.height = this.state.cam.height;

	// Reposition
	this.reposition();

	// Update hit area
	this.bg.hitArea = new Phaser.Rectangle(0, 0, this.width / this.scale.x, this.height / this.scale.y);
};

GUI_Minimap.prototype.reposition = function() {
	// Get position rate
	var ratePos = {
		x: (this.screenAnchor.x * game.camera.width),
		y: (this.screenAnchor.y * game.camera.height)
	};

	// Reposition
	this.x = Math.max(game.camera.x, Math.min((game.camera.x + game.camera.width) - this.width, ratePos.x + game.camera.x));
	this.y = Math.max(game.camera.y, Math.min((game.camera.y + game.camera.height) - this.height, ratePos.y + game.camera.y));

	// Update frame
	this.viewFrame.x = this.state.cam.x;
	this.viewFrame.y = this.state.cam.y;

	this.adjustZOrder();
};

GUI_Minimap.prototype.mouseOver = function() {
	var rate = this.getCursorInRate();
	return (rate.x >= 0 && rate.x <= 1 &&
		rate.y >= 0 && rate.y <= 1);
};

GUI_Minimap.prototype.getCursorInRate = function() {
	var cursor = this.state.getWorldCursor();
	cursor.x *= 2;
	cursor.y *= 2;
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
		x: Math.floor((rate.x * this.state.map.totalwidth) - (this.state.cam.width * 0.5)),
		y: Math.floor((rate.y * this.state.map.totalheight) - (this.state.cam.height * 0.5))
	};
	this.state.cam.move(moveTo.x, moveTo.y, false);
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