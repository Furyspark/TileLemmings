var GameManager = {
	audio: {
		volume: {
			sfx: 0.75,
			bgm: 0.5
		},
		bgm: null,
		play: function(key, loop, channel) {
			if(loop === undefined) {
				loop = false;
			}
			if(channel === undefined) {
				channel = this.CHANNEL_SFX;
			}
			return game.sound.play(key, this.volume[this.channel_to_string(channel)], loop);
		},
		play_bgm: function(key) {
			this.stop_bgm();
			return this.bgm = game.sound.play(key, this.volume[this.channel_to_string(this.CHANNEL_BGM)], true);
		},
		stop_bgm: function() {
			if(this.bgm !== null) {
				this.bgm.stop();
				this.bgm = null;
			}
		},
		CHANNEL_SFX: 0,
		CHANNEL_BGM: 1,
		channel_to_string: function(channel) {
			switch(channel) {
				default:
				case this.CHANNEL_SFX:
					return "sfx";
					break;
				case this.CHANNEL_BGM:
					return "bgm";
					break;
			}
			return "";
		}
	},

	level: null,

	alarms: {
		data: [],
		remove: function(alarm) {
			var found = false;
			for (var a = 0; a < this.data.length && !found; a++) {
				var curAlarm = this.data[a];
				if (curAlarm === alarm) {
					found = true;
					this.data.splice(a, 1);
				}
			}
		},
		update: function() {
			var a;
			for(a = 0;a < this.data.length;a++) {
				this.data[a].update();
			}
		},
		clear: function() {
			while(this.data.length > 0) {
				this.data[0].cancel();
			}
		}
	},

	speedManager: {
		speed: 1,
		paused: false,
		get effectiveSpeed() {
			if (this.paused) {
				return 0;
			}
			return this.speed;
		},
		pauseButton: null,
		fastForwardButton: null,
		pause: function() {
			this.paused = true;
			this.refresh();
		},
		unpause: function() {
			this.paused = false;
			this.refresh();
		},
		refresh: function() {
			// Update objects
			var checkGroups = [
				GameManager.level.objectLayer.doorGroup.children,
				GameManager.level.objectLayer.exitGroup.children,
				GameManager.level.objectLayer.trapGroup.children,
				GameManager.level.lemmingsGroup.children
			];
			for (var b = 0; b < checkGroups.length; b++) {
				var grp = checkGroups[b];
				for (var a = 0; a < grp.length; a++) {
					var obj = grp[a];
					if (obj) {
						// Update animations
						if (obj.animations) {
							if (obj.animations.currentAnim && this.effectiveSpeed > 0) {
								var prevFrame = obj.animations.currentAnim.frame;
								obj.animations.currentAnim.paused = false;
								obj.animations.currentAnim.speed = (15 * this.effectiveSpeed);
							} else if (obj.animations.currentAnim && this.effectiveSpeed === 0) {
								obj.animations.paused = true;
							}
						}
					}
				}
			}
		},
		setSpeed: function(multiplier) {
			this.speed = multiplier;
			this.refresh();
		}
	},

	tilesets: {},

	saveSettings: function() {
		// Load previous settings
		var settings = localStorage["tilelemmings.profiles.default.settings"];
		if(settings) {
			settings = JSON.parse(settings);
		}
		else {
			settings = {};
		}

		// Parse settings
		if(!settings.audio) {
			settings.audio = {};
		}
		settings.audio.volume = this.audio.volume;

		// Save current settings
		localStorage["tilelemmings.profiles.default.settings"] = JSON.stringify(settings);
	},

	loadSettings: function() {
		// Load previous settings
		var settings = localStorage["tilelemmings.profiles.default.settings"];
		if(settings) {
			settings = JSON.parse(settings);
		}
		else {
			settings = {};
		}

		// Parse settings
		var a;
		if(settings.audio && settings.audio.volume) {
			for(a in settings.audio.volume) {
				this.audio.volume[a] = settings.audio.volume[a];
			}
		}
	}
};
