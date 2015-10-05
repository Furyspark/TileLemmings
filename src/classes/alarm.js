var Alarm = function(duration, callback, callbackContext, recurring) {
	if(recurring === undefined) {
		recurring = false;
	}

	this.baseDuration = duration;
	this.duration = this.baseDuration;
	this.callback = callback;
	this.callbackContext = callbackContext;
	this.recurring = recurring;

	this.addToGame();
};

Alarm.prototype.constructor = Alarm;

Alarm.prototype.addToGame = function() {
	// Add to alarms list
	GameManager.alarms.data.push(this);
};

Alarm.prototype.update = function() {
	if(GameManager.speedManager.effectiveSpeed > 0 && this.duration > 0) {
		this.duration -= GameManager.speedManager.effectiveSpeed;
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
	GameManager.alarms.remove(this);
};

Alarm.prototype.fire = function() {
	this.callback.call(this.callbackContext);
};
