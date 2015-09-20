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
		if(settings.audio && settings.audio.volume) {
			for(a in settings.audio.volume) {
				this.audio.volume[a] = settings.audio.volume[a];
			}
		}
	}
};