var Lemming = function(game, group, x, y) {
	Phaser.Sprite.call(this, game, x, y, "lemming");
	game.add.existing(this);
	this.levelGroup = group;
	this.levelGroup.add(this);
	this.state = this.game.state.getCurrentState();

	// Set anchor
	this.anchor.setTo(0.5, 1);

	// Set physics
	game.physics.arcade.enable(this);
	this.body.setSize(16, 20);

	// Set animations
	this.addAnim("fall", "Fall", 4);
	this.addAnim("move", "Move", 10);
	this.addAnim("mine", "Mine", 24);
	this.animations.play("fall", 15);
	this.body.velocity.y = 100;

	this.objectType = "lemming";
};

Lemming.prototype = Object.create(Phaser.Sprite.prototype);
Lemming.prototype.constructor = Lemming;

Lemming.prototype.addAnim = function(key, animName, numFrames) {
	var a, frames = [];
	for(a = 0;a < numFrames;a += 1) {
		var anim = "sprLemming_" + animName + "_" + a.toString() + ".png";
		frames.push(anim);
	}
	this.animations.add(key, frames, 60, true);
};

Lemming.prototype.updatePhysics = function() {
	if(this.body.onFloor()) {
		this.animations.play("move", 15);
		this.body.velocity.x = 30;
		this.body.velocity.y = 1;
	}
	else {
		this.animations.play("fall", 15);
		this.body.velocity.x = 0;
		this.body.velocity.y = 100;
	}
};

Lemming.prototype.render = function() {
	
};