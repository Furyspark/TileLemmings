var Cursor = function(x, y, owner) {
	Phaser.Sprite.call(this, game, x, y, "misc");
	game.add.existing(this);
	this.owner = owner;

	// Define properties
	Object.defineProperties(this, {
		"state": {
			get() {
				return game.state.getCurrentState();
			}
		},
		"level": {
			get() {
				return GameManager.level;
			}
		}
	})

	this.level.add(this);
	this.level.bringToTop(this);

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
	this.pendingDestroy = true;
};
