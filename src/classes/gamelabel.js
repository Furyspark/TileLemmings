var GameLabel = function(game, x, y, defaultText) {
	defaultText = defaultText || "";
	this.defaultStyle = {
		font: "bold 12pt Arial",
		fill: "#FFFFFF",
		align: "center",
		stroke: "#000000",
		strokeThickness: 3
	};
	Phaser.Text.call(this, game, x, y, defaultText, this.defaultStyle);
	this.game = game;

	Object.defineProperty(this, "state", {get() {
		return this.game.state.currentState;
	}});

	this.state.levelGroup.add(this);
};

GameLabel.prototype = Object.create(Phaser.Text.prototype);
GameLabel.prototype.constructor = GameLabel;

GameLabel.prototype.remove = function() {
	this.state.levelGroup.removeChild(this);
};