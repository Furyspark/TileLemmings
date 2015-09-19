var Input = function(game) {
	this.mouse = {
		buttons: {
			left: {
				get deviceHandler() {
					return game.input.activePointer.leftButton;
				},
				get down() {
					return this.deviceHandler.isDown;
				},
				pressed: false,
				released: false
			},
			right: {
				get deviceHandler() {
					return game.input.activePointer.rightButton;
				},
				get down() {
					return this.deviceHandler.isDown;
				},
				pressed: false,
				released: false
			},
			middle: {
				get deviceHandler() {
					return game.input.activePointer.middleButton;
				},
				get down() {
					return this.deviceHandler.isDown;
				},
				pressed: false,
				released: false
			}
		}
	};
};

Input.prototype.constructor = Input;

Input.prototype.update = function() {
	// Update pressed and released states of the mouse
	for(var a in this.mouse.buttons) {
		var btn = this.mouse.buttons[a];
		if(!btn.pressed && btn.down) {
			btn.pressed = true;
		}
	}
};