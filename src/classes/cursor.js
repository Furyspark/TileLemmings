var Cursor = function(game, x, y, owner) {
	Phaser.Sprite.call(this, game, x, y, "misc");
	this.game.add.existing(this);
	this.owner = owner;
	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}})
	this.state.levelGroup.add(this);

	this.anchor.setTo(0.5, 0.5);
	this.animations.add("hover", ["sprCursor_Open.png"]);
	this.animations.play("hover");
};

Cursor.prototype = Object.create(Phaser.Sprite.prototype);
Cursor.prototype.constructor = Cursor;

Cursor.prototype.reposition = function() {
	this.x = this.owner.left + ((this.owner.right - this.owner.left) * 0.5);
	this.y = this.owner.top + ((this.owner.bottom - this.owner.top) * 0.5);
};

Cursor.prototype.destroy = function() {
	for(var a in this.state.levelGroup.children) {
		var obj = this.state.levelGroup.children[a];
		if(obj === this) {
			this.state.levelGroup.removeChild(this);
		}
	}
	this.kill();
};