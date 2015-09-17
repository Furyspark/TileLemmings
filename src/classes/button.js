var GUI_Button = function(game, x, y) {
	GUI.call(this, game, x, y);
	this.game = game;

	Object.defineProperty(this, "state", {
		get() {
			return this.game.state.getCurrentState();
		}
	});

	// Load base texture
	this.loadTexture("gui");

	// Initialization
	this.guiType = "button";
	this.subType = "";
	this.action = "";
	this.pressed = false;
	this.inputEnabled = true;

	// Create label
	this.label = game.add.text(0, 0, "", {
		font: "bold 12px Arial",
		fill: "#ffffff",
		boundsAlignH: "center"
	});
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

	this.label.text = "";
	this.label.reposition();

	// Set on press action
	this.events.onInputDown.add(function() {
		this.select(true);
	}, this);
};

GUI_Button.prototype = Object.create(GUI.prototype);
GUI_Button.prototype.constructor = GUI_Button;

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
	this.label.reposition();
};

GUI_Button.prototype.select = function(makeSound) {
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
		game.sound.play("sndUI_Click");
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
			for (var a in this.state.actions.items) {
				var item = this.state.actions.items[a];
				if (item.name == this.action) {
					this.state.actions.select = a;
				}
			}
			break;
		case "misc":
			switch (this.action) {
				case "pause":
					this.state.pauseGame();
					break;
				case "fastForward":
					this.state.fastForward();
					break;
			}
			break;
	}
};