var GUI = function(game, group, x, y) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);
	group.add(this);

	// Set references
	this.guiType = "undefined";
	this.subType = "";
	this.state = this.game.state.getCurrentState();
};

GUI.prototype = Object.create(Phaser.Sprite.prototype);
GUI.prototype.constructor = GUI;