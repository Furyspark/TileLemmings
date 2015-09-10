var Camera = function(game, state) {
	this.game = game;
	this.state = state;

	this.scrolling = false;
	Object.defineProperty(this, "gameCamera", {get() {
		return this.game.camera;
	}});

	Object.defineProperties(this, {
		"width": {
			get() {
				return this.gameCamera.width / this.state.zoom;
			}
		},
		"height": {
			get() {
				return this.gameCamera.height / this.state.zoom;
			}
		},
		"x": {
			get() {
				return this.gameCamera.x / this.state.zoom;
			}
		},
		"y": {
			get() {
				return this.gameCamera.y / this.state.zoom;
			}
		}
	});
};

Camera.prototype.constructor = Camera;

Camera.prototype.move = function(hor, ver) {
	this.gameCamera.x += hor;
	this.gameCamera.y += ver;
	// Move UI
	for(var a = 0;a < this.state.guiGroup.length;a++) {
		var uiNode = this.state.guiGroup[a];
		uiNode.x = this.gameCamera.x + uiNode.guiAlign.x;
		uiNode.y = this.gameCamera.y + uiNode.guiAlign.y;
	}
};