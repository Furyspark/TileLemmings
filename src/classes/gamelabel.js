var GameLabel = function(game, owner, x, y, offsetObj, defaultText) {
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
	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}});

	this.state.levelGroup.add(this);

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