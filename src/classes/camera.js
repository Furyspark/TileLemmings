var Camera = function(game, state) {
	this.state = state;

	this.scrolling = false;
	Object.defineProperty(this, "gameCamera", {get() {
		return game.camera;
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

Camera.prototype.move = function(hor, ver, relative) {
	if(typeof relative === "undefined") {
		relative = true;
	}
	if(relative) {
		this.gameCamera.x += hor;
		this.gameCamera.y += ver;
	}
	else {
		this.gameCamera.x = (hor * this.state.zoom);
		this.gameCamera.y = (ver * this.state.zoom);
	}
	// Move UI
	for(var a = 0;a < this.state.guiGroup.children.length;a++) {
		var uiNode = this.state.guiGroup.children[a];
		if(uiNode.guiAlign) {
			uiNode.x = this.gameCamera.x + uiNode.guiAlign.x;
			uiNode.y = this.gameCamera.y + uiNode.guiAlign.y;
		}
	}
	// Move grid
	var grid = this.state.grid.image;
	if(grid) {
		grid.x = this.gameCamera.x;
		grid.y = this.gameCamera.y;
		grid.tilePosition.x = -this.x;
		grid.tilePosition.y = -this.y;
	}
};