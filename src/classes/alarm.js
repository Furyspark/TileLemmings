var Alarm = function(game, duration, callback, callbackContext, recurring) {
	if(recurring === undefined) {
		recurring = false;
	}

	this.baseDuration = duration;
	this.duration = this.baseDuration;
	this.callback = callback;
	this.callbackContext = callbackContext;
	this.recurring = recurring;

	Object.defineProperty(this, "state", {get() {
		return game.state.getCurrentState();
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
			if(this.callbackContext !== null) {
				this.fire();
			}
			if(this.recurring) {
				this.duration = this.baseDuration;
			}
			else {
				this.cancel();
			}
		}
	}
};

Alarm.prototype.cancel = function() {
	this.state.alarms.remove(this);
};

Alarm.prototype.fire = function() {
	this.callback.call(this.callbackContext);
};