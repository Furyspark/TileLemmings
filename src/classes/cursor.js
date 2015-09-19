var Cursor = function(game, x, y, owner) {
	Phaser.Sprite.call(this, game, x, y, "misc");
	game.add.existing(this);
	this.owner = owner;
	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
	}})
	this.state.levelGroup.add(this);

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
	for(var a in this.state.levelGroup.children) {
		var obj = this.state.levelGroup.children[a];
		if(obj === this) {
			this.state.levelGroup.removeChild(this);
		}
	}
	this.kill();
};