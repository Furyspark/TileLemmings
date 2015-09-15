var Prop = function(game, x, y) {
	Phaser.Sprite.call(this, game, x, y);
	game.add.existing(this);
	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});
	this.state.levelGroup.add(this);
	this.anchor.setTo(0.5, 0.5);

	this.objectType = "prop";
};

Prop.prototype = Object.create(Phaser.Sprite.prototype);
Prop.prototype.constructor = Prop;

Prop.prototype.playAnim = function(key, frameRate) {
	this.animations.play(key, frameRate * this.state.speedManager.effectiveSpeed);
	if(this.state.speedManager.effectiveSpeed === 0) {
		this.animations.stop();
	}
};

Prop.prototype.setAsDoor = function(type, lemmings, rate, lemmingsGroup) {
	// Set primary data
	this.objectType = "door";
	this.state.doorsGroup.push(this);
	this.lemmingsGroup = lemmingsGroup;
	this.type = type;
	
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
	this.lemmings = lemmings;
	this.rate = Math.max(10, rate);

	// Set animation
	this.animations.add("opening", openingFrames, 15, false);
	this.animations.add("idle", idleFrames, 15, false);
	this.animations.add("open", openFrames, 15, false);
	this.playAnim("idle", 15);

	// Set functions
	this.openDoor = function() {
		// Play sound
		if(this.state.doorsGroup[0] === this) {
			game.sound.play(doorConfig.sound.open);
		}
		// Set event
		this.animations.getAnimation("opening").onComplete.addOnce(function() {
			this.playAnim("open", 15);
			var alarm = new Alarm(this.game, 30, function() {
				this.opened();
				this.state.playLevelBGM();
			}, this);
		}, this);
		// Play animation
		this.playAnim("opening", 15);
	};
	this.opened = function() {
		this.spawnLemming(true);
	};
	this.spawnLemming = function(recurring) {
		if(typeof recurring === "undefined") {
			var recurring = true;
		}
		if(this.lemmings > 0) {
			this.lemmings--;
			var lem = new Lemming(this.game, this.x, this.y + 30);
			this.lemmingsGroup.push(lem);
			if(recurring) {
				var alarm = new Alarm(this.game, this.rate, this.spawnLemming, this);
			}
		}
	};
};

Prop.prototype.setAsExit = function(type) {
	this.objectType = "exit";
	this.state.exitsGroup.push(this);
	this.type = type;

	// Set configuration
	var propConfig = game.cache.getJSON("config").props.exits[type];
	this.loadTexture(propConfig.atlas);
	var a, idleFrames = [];
	for(a = 0;a < propConfig.frames;a++) {
		var anim = propConfig.animName + a.toString() + ".png";
		idleFrames.push(anim);
	}

	// Set animation
	this.animations.add("idle", idleFrames, 15, true);
	this.playAnim("idle", 15);

	// Set bounding box
	this.bbox = {
		base: {
			left: propConfig.bbox.left,
			right: propConfig.bbox.right,
			top: propConfig.bbox.top,
			bottom: propConfig.bbox.bottom
		},
		get left() {
			return this.owner.x + this.base.left;
		},
		get right() {
			return this.owner.x + this.base.right;
		},
		get top() {
			return this.owner.y + this.base.top;
		},
		get bottom() {
			return this.owner.y + this.base.bottom;
		},

		owner: this
	};

	// Set functions
	this.inPosition = function(xCheck, yCheck) {
		if(xCheck >= this.bbox.left && xCheck <= this.bbox.right &&
			yCheck >= this.bbox.top && yCheck <= this.bbox.bottom) {
			return true;
		}
		return false;
	};
};