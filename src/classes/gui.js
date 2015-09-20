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
GUI.prototype.constructor = GUI;