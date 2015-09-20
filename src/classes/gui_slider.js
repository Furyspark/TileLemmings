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

	// Set geometric data
	this.width = width;
	this.anchor.x = 0.5;
	this.anchor.y = 0.5;

	// Set appearance
	this.loadTexture(imageKey, "slider_bg.png");

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
};