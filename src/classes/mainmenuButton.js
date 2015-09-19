var GUI_MainMenuButton = function(game, x, y, imageKey) {
	GUI.call(this, game, x, y);

	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});

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