var Prop = function(game, group, x, y) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);
	this.levelGroup = group;
	this.levelGroup.add(this);

	this.objectType = "prop";
};

Prop.prototype = Object.create(Phaser.Sprite.prototype);
Prop.prototype.constructor = Prop;

Prop.prototype.setAsDoor = function(type, lemmings, rate) {
	// Set primary data
	this.objectType = "door";

	// Set configuration
	var doorConfig = game.cache.getJSON("config").props.doors[type];
	this.loadTexture(doorConfig.atlas);
	var a, openingFrames = [], idleFrames = [], openFrames = [];
	for(a = 0;a < doorConfig.frames;a++) {
		var anim = doorConfig.animName + a.toString() + ".png";
		if(a == 0) {
			idleFrames.push(anim);
		}
		if(a == doorConfig.frames - 1) {
			openFrames.push(anim);
		}
		openingFrames.push(anim);
	}

	// Set class variables
	this.spawnTimer = game.time.create(false);
	this.lemmings = lemmings;
	this.rate = Math.max(10, rate);

	// Set animation
	this.animations.add("opening", openingFrames, 15, false);
	this.animations.add("idle", idleFrames, 15, false);
	this.animations.add("open", openFrames, 15, false);
	this.animations.play("idle", 15);

	// Set functions
	this.openDoor = function() {
		this.animations.getAnimation("opening").onComplete.addOnce(function() {
			this.animations.play("open", 15);
			this.opened();
		}, this);
		this.animations.play("opening", 15);
	};
	this.opened = function() {
		this.spawnTimer.loop(this.rate, function() {
			if(this.lemmings > 0) {
				this.lemmings--;
				var lem = new Lemming(this.game, this.levelGroup, this.x, this.y + 10);
			}
		}, this)
		this.spawnTimer.start();
	};

	// Set anchor
	this.anchor.setTo(0.5, 0);
};