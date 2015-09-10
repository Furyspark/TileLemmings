var Alarm = function(game, duration, callback, callbackContext) {
	this.game = game;
	this.duration = duration;
	this.callback = callback;
	this.callbackContext = callbackContext;

	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});
	Object.defineProperty(this, "paused", {get() {
		if(this.state.paused) {
			return this.state.paused;
		}
		return false;
	}});

	this.addToGame();
};

Alarm.prototype.constructor = Alarm;

Alarm.prototype.addToGame = function() {
	// Add to alarms list
	this.state.alarms.data.push(this);
};

Alarm.prototype.step = function() {
	if(!this.paused) {
		if(this.duration > 0) {
			this.duration--;
			if(this.duration <= 0) {
				if(this.callbackContext) {
					this.callback.call(this.callbackContext);
				}
				this.state.alarms.remove(this);
			}
		}
	}
};

Alarm.prototype.cancel = function() {
	this.state.alarms.remove(this);
};