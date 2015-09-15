var Alarm = function(game, duration, callback, callbackContext) {
	this.game = game;
	this.duration = duration;
	this.callback = callback;
	this.callbackContext = callbackContext;

	Object.defineProperty(this, "state", {get() {
		return this.game.state.getCurrentState();
	}});

	this.addToGame();
};

Alarm.prototype.constructor = Alarm;

Alarm.prototype.addToGame = function() {
	// Add to alarms list
	this.state.alarms.data.push(this);
};

Alarm.prototype.step = function() {
	if(this.state.speedManager.effectiveSpeed > 0 && this.duration > 0) {
		this.duration -= this.state.speedManager.effectiveSpeed;
		if(this.duration <= 0) {
			if(this.callbackContext) {
				this.fire();
			}
			this.state.alarms.remove(this);
		}
	}
};

Alarm.prototype.cancel = function() {
	this.state.alarms.remove(this);
};

Alarm.prototype.fire = function() {
	this.callback.call(this.callbackContext);
};