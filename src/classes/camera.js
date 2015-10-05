var Camera = function(game) {
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
		},
		"state": {
			get() {
				return game.state.getCurrentState();
			}
		}
	});

	// Push for a move
	this.move(0, 0, true);
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
	
	// Adjust minimap's viewport frame
	if(this.state.minimap) {
		this.state.minimap.adjustFrame();
	}
	
	// Move grid
	// var grid = this.state.grid.image;
	// if(grid) {
	// 	grid.x = this.gameCamera.x;
	// 	grid.y = this.gameCamera.y;
	// 	grid.tilePosition.x = -this.x;
	// 	grid.tilePosition.y = -this.y;
	// }
};
