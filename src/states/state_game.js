var gameState = {
	level: null,
	zoom: 1,
	minimap: null,
	lemmingSelected: null,

	scrollOrigin: {
		x: 0,
		y: 0
	},

	guiGroup: null,

	init: function(levelFolder, levelObj, level) {
		this.levelFolder = levelFolder;
		this.levelObj = levelObj;
		this.level = level;

		this.nukeStarted = false;
	},

	create: function() {
		this.enableUserInteraction();
		// Create groups
		this.guiGroup = game.add.group(game.stage);

		// Create GUI
		this.createLevelGUI();

		// Create camera config
		this.cam = new Camera(game, this);

		this.startLevel();
	},

	enableUserInteraction: function() {
		// Create keys
		this.keyboard = {
			left: game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
			right: game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
			up: game.input.keyboard.addKey(Phaser.Keyboard.UP),
			down: game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
			space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
			p: game.input.keyboard.addKey(Phaser.Keyboard.P),
			f: game.input.keyboard.addKey(Phaser.Keyboard.F),
			q: game.input.keyboard.addKey(Phaser.Keyboard.Q),
			e: game.input.keyboard.addKey(Phaser.Keyboard.E),
			w: game.input.keyboard.addKey(Phaser.Keyboard.W),
			s: game.input.keyboard.addKey(Phaser.Keyboard.S),
			a: game.input.keyboard.addKey(Phaser.Keyboard.A),
			d: game.input.keyboard.addKey(Phaser.Keyboard.D),
			g: game.input.keyboard.addKey(Phaser.Keyboard.G)
		};

		// Set pause functionality
		this.keyboard.p.onDown.add(function() {
			this.pauseGame();
		}, this);
		this.keyboard.space.onDown.add(function() {
			this.pauseGame();
		}, this);
		// Set fast-forward functionality
		this.keyboard.f.onDown.add(function() {
			this.fastForward();
		}, this);
		// Set toggle grid functionality
		this.keyboard.g.onDown.add(function() {
			this.toggleGrid();
		}, this);

		game.input.mouse.capture = true;
		// Add left-mouse button functionality
		game.input.activePointer.leftButton.onDown.add(function() {
			// Assign action to lemming
			if (this.lemmingSelected != null && this.actions.current && this.actions.current.amount > 0) {
				this.lemmingSelected.setAction(this.actions.current.name);
			}
		}, this);
		// Add right-mouse scrolling possibility
		game.input.activePointer.rightButton.onDown.add(function() {
			this.cam.scrolling = true;
			this.scrollOrigin = this.getScreenCursor();
		}, this);
		game.input.activePointer.rightButton.onUp.add(function() {
			this.cam.scrolling = false;
		}, this);
	},

	startLevel: function() {
		this.zoomTo(2);
		this.minimap = new GUI_Minimap(this.level);
		this.minimap.x = game.camera.width - this.minimap.width;
		this.minimap.y = game.camera.height - this.minimap.height;
		this.minimap.onLevelStart();
		this.guiGroup.add(this.minimap);

		// Z-Order
		this.level.zOrder();

		// Let's go... HRRRRN
		var snd = GameManager.audio.play("sndLetsGo");
		var alarm = new Alarm(90, function() {
			this.openDoors();
		}, this);
	},

	pauseGame: function() {
		if (!GameManager.speedManager.paused) {
			GameManager.speedManager.pause();
			// Press pause GUI button
			GameManager.speedManager.pauseButton.visualPress();
		} else {
			GameManager.speedManager.unpause();
			// Release pause GUI button
			GameManager.speedManager.pauseButton.visualRelease();
		}
	},

	fastForward: function() {
		if (GameManager.speedManager.speed > 1) {
			GameManager.speedManager.setSpeed(1);
			// Press fast forward GUI button
			GameManager.speedManager.fastForwardButton.visualRelease();
		} else {
			GameManager.speedManager.setSpeed(3);
			// Release fast forward GUI button
			GameManager.speedManager.fastForwardButton.visualPress();
		}
	},

	toggleGrid: function() {
		if (this.grid.enabled) {
			this.grid.enabled = false;
			this.gridGroup.visible = false;
			this.grid.button.visualRelease();
		} else {
			this.grid.enabled = true;
			this.gridGroup.visible = true;
			this.grid.button.visualPress();
		}
	},

	nuke: function() {
		// Start nuke
		if (!this.nukeStarted) {
			GameManager.audio.play("sndOhNo");
			this.nukeStarted = true;
			this.nuke();
			// Set lemming count of all doors to 0
			for (var a = 0; a < this.doorGroup.children.length; a++) {
				var door = this.doorGroup.children[a];
				door.lemmings = 0;
			}
			this.victoryState.gameStarted = true;
		}
		// Proceed nuke
		else {
			var searchComplete = false;
			for (var a = 0; a < this.level.lemmingsGroup.children.length && !searchComplete; a++) {
				var lem = this.level.lemmingsGroup.children[a];
				if (lem.subaction.name !== "exploder") {
					lem.setExploder();
					searchComplete = true;
				}
			}
			// Set nuke alarm
			if (searchComplete) {
				var alarm = new Alarm(game, 10, function() {
					this.nuke();
				}, this);
			}
		}
	},

	getWorldCursor: function() {
		return {
			x: game.input.activePointer.worldX / this.zoom,
			y: game.input.activePointer.worldY / this.zoom
		};
	},

	getScreenCursor: function() {
		var worldCursor = this.getWorldCursor();
		return {
			x: worldCursor.x - this.cam.x,
			y: worldCursor.y - this.cam.y
		};
	},

	zoomTo: function(factor) {
		this.zoom = factor;
		this.level.scale.setTo(factor);
		game.camera.bounds.setTo(0, 0, Math.floor(this.level.totalWidth * this.zoom), Math.floor(this.level.totalHeight * this.zoom));
	},

	update: function() {
		// Update alarms
		GameManager.alarms.update();
		// Determine lemmings under mouse cursor
		var lemmingSelect = {
			data: [],
			removeBy: function(callback) {
				for (var a = this.data.length - 1; a >= 0; a--) {
					var lem = this.data[a];
					if (!callback.call(lem)) {
						this.data.splice(a, 1);
					}
				}
			}
		};
		for (var a = 0; a < this.level.lemmingsGroup.children.length; a++) {
			var obj = this.level.lemmingsGroup.children[a];
			obj.cursorDeselect();
			if (obj.mouseOver()) {
				lemmingSelect.data.push(obj);
			}
		}
		// Callback for checking the right lemming
		lemmingSelect.removeBy(this.lemmingSelectableCallback);
		if (!this.cursorOverGUI() && lemmingSelect.data.length > 0) {
			lemmingSelect.data[0].cursorSelect();
		}

		// Scroll
		// Right-click
		if (this.cam.scrolling) {
			var originRel = this.getScreenCursor();
			var speedFactor = 2;
			var moveRel = {
				x: (this.scrollOrigin.x - originRel.x) * speedFactor,
				y: (this.scrollOrigin.y - originRel.y) * speedFactor
			};
			this.scrollOrigin = this.getScreenCursor();
			this.cam.move(moveRel.x, moveRel.y);
		}
		// WASD
		if (!this.cam.scrolling) {
			var moveRel = {
				x: 0,
				y: 0
			};
			if (this.keyboard.a.isDown) {
				moveRel.x--;
			}
			if (this.keyboard.d.isDown) {
				moveRel.x++;
			}
			if (this.keyboard.w.isDown) {
				moveRel.y--;
			}
			if (this.keyboard.s.isDown) {
				moveRel.y++;
			}
			var speedFactor = 10;
			moveRel.x *= speedFactor;
			moveRel.y *= speedFactor;
			if (moveRel.x !== 0 || moveRel.y !== 0) {
				this.cam.move(moveRel.x, moveRel.y, true);
			}
		}

		// Test for victory/defeat
		if (this.level.started && !this.level.ended) {
			var allDoorsEmpty = true;
			for (var a = 0; a < this.level.objectLayer.doorGroup.children.length && allDoorsEmpty; a++) {
				var door = this.level.objectLayer.doorGroup.children[a];
				if (door.lemmings > 0) {
					allDoorsEmpty = false;
				}
			}
			if (allDoorsEmpty && this.level.lemmingsGroup.children.length === 0) {
				this.level.ended = true;
				if (this.level.saved >= this.level.lemmingNeed) {
					// Victory
					this.goToNextLevel();
				} else {
					// Defeat
					this.retryLevel();
				}
			}
		}
	},

	clearState: function() {
		// Remove all GUI objects
		this.guiGroup.destroy();
		
		// Destroy level
		this.level.destroy();

		// Reset speed manager
		GameManager.speedManager.paused = false;
		GameManager.speedManager.speed = 1;

		// Stop the music
		this.stopBGM();
	},

	goToNextLevel: function() {
		// Clear state
		this.clearState();
		// Get current level
		var levelIndex = this.getLevelIndex();
		this.saveGame(levelIndex);
		if (this.levelFolder.levels.length > levelIndex + 1) {
			var newLevel = this.levelFolder.levels[levelIndex + 1];
			game.state.start("intermission", true, false, this.levelFolder, newLevel, false, this.mapFiles);
		} else {
			game.state.start("menu");
		}
	},

	retryLevel: function() {
		this.clearState();
		game.state.start("intermission", true, false, this.levelFolder, this.levelObj, true, this.mapFiles);
	},

	getLevelIndex: function() {
		for (var a = 0; a < this.levelFolder.levels.length; a++) {
			var level = this.levelFolder.levels[a];
			if (level === this.levelObj) {
				return a;
			}
		}
		return -1;
	},

	saveGame: function(levelIndex) {
		var rawSave = localStorage["tilelemmings.profiles.default.progress"];
		var curSave = {};
		if (rawSave) {
			curSave = JSON.parse(rawSave);
			if (!curSave[this.levelFolder.resref]) {
				curSave[this.levelFolder.resref] = [];
			}
			if (curSave[this.levelFolder.resref].indexOf(levelIndex) === -1) {
				curSave[this.levelFolder.resref].push(levelIndex);
			}
		} else {
			curSave[this.levelFolder.resref] = [];
			curSave[this.levelFolder.resref].push(levelIndex);
		}
		game.saveFile = curSave;
		localStorage["tilelemmings.profiles.default.progress"] = JSON.stringify(curSave);
	},

	render: function() {

	},

	cursorOverGUI: function() {
		if (this.minimap && this.minimap.mouseOver()) {
			return true;
		}
		for (var a = 0; a < this.guiGroup.children.length; a++) {
			var uiNode = this.guiGroup.children[a];
			if (uiNode.mouseOver && uiNode.mouseOver()) {
				return true;
			}
		}
		return false;
	},

	lemmingSelectableCallback: function() {
		// Cursors left and right
		if ((this.state.keyboard.left.isDown || this.state.keyboard.q.isDown) && this.dir != -1) {
			return false;
		}
		if ((this.state.keyboard.right.isDown || this.state.keyboard.e.isDown) && this.dir != 1) {
			return false;
		}
		if (this.dead || !this.active) {
			return false;
		}
		if (this.state.actions.select >= 0) {
			if (this.action.name == this.state.actions.current.name ||
				this.subaction.name == this.state.actions.current.name) {
				// Exclude builders at their end
				if (this.action.name === "builder" && this.animations.currentAnim.name === "build_end") {
					// Don't make unselectable
				} else {
					return false;
				}
			}
			if (typeof this.attributes[this.state.actions.current.name] !== "undefined" && this.attributes[this.state.actions.current.name]) {
				return false;
			}
		}
		return true;
	},

	openDoors: function() {
		for (var a = 0; a < this.level.objectLayer.doorGroup.children.length; a++) {
			var obj = this.level.objectLayer.doorGroup.children[a];
			obj.openDoor();
		}
	},

	playLevelBGM: function() {
		GameManager.audio.play_bgm("bgm");
	},

	stopBGM: function() {
		GameManager.audio.stop_bgm();
	},

	createLevelGUI: function() {
		var buttons = [];

		// Create action buttons
		for (var a in this.level.actions) {
			var action = this.level.actions[a];
			var animPrefix = "Btn_" + a.substr(0, 1).toUpperCase() + a.substr(1) + "_";
			var btn = new GUI_Button(game, 0, 0);
			this.guiGroup.add(btn);
			buttons.push(btn);
			btn.set({
				released: animPrefix + "0.png",
				pressed: animPrefix + "1.png"
			}, action.name, "action");

			// Assign buttons
			action.btn = btn;
		}

		// Create pause button
		var btn = new GUI_Button(game, 0, 0);
		this.guiGroup.add(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_Pause_0.png",
			pressed: "Btn_Pause_1.png"
		}, "pause", "misc");
		GameManager.speedManager.pauseButton = btn;

		// Create fast forward button
		var btn = new GUI_Button(game, 0, 0);
		this.guiGroup.add(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_FastForward_0.png",
			pressed: "Btn_FastForward_1.png"
		}, "fastForward", "misc");
		GameManager.speedManager.fastForwardButton = btn;

		// Create nuke button
		var btn = new GUI_Button(game, 0, 0);
		this.guiGroup.add(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_Nuke_0.png",
			pressed: "Btn_Nuke_1.png"
		}, "nuke", "misc");
		btn.doubleTap.enabled = true;

		// Create grid button
		var btn = new GUI_Button(game, 0, 0);
		this.guiGroup.add(btn);
		buttons.push(btn);
		btn.set({
			released: "Btn_Grid_0.png",
			pressed: "Btn_Grid_1.png"
		}, "grid", "misc");

		// Align buttons
		var alignX = 0;
		for (var a = 0; a < buttons.length; a++) {
			var btn = buttons[a];
			btn.x = alignX;
			btn.y = game.camera.height - btn.height;
			alignX += btn.width;
		}
	},

	deselectAllActions: function() {
		for (var a = 0; a < this.guiGroup.children.length; a++) {
			var obj = this.guiGroup.children[a];
			if (obj.subType === "action") {
				obj.deselect();
			}
		}
	},

	expendAction: function(action, amount) {
		if(amount === undefined) { amount = 1; }

		this.setActionAmount(action, this.getActionAmount(action) - amount);
	},

	getActionAmount: function(actionName) {
		for (var a in this.actions.items) {
			var action = this.actions.items[a];
			if (action.name == actionName) {
				return action.amount;
			}
		}
		return -1;
	},

	setActionAmount: function(actionName, amount) {
		if(amount === undefined) { amount = 0; }

		for (var a in this.actions.items) {
			var action = this.actions.items[a];
			if (action.name == actionName) {
				action.amount = Math.max(0, amount);
				action.btn.label.text = action.amount.toString();
				if (action.amount === 0) {
					action.btn.label.text = "";
				}
			}
		}
	},

	instancePosition: function(xCheck, yCheck, instanceTypeCheck) {
		var arrayCheck = [];
		switch (instanceTypeCheck) {
			case "lemming":
				arrayCheck = this.level.lemmingsGroup.children;
				break;
			case "door":
				arrayCheck = this.level.objectLayer.doorGroup.children;
				break;
			case "exit":
				arrayCheck = this.level.objectLayer.exitGroup.children;
				break;
			case "trap":
				arrayCheck = this.level.objectLayer.trapGroup.children;
				break;
		}
		var result = [];
		for (var a = 0; a < arrayCheck.length; a++) {
			var obj = arrayCheck[a];
			if (xCheck >= obj.bbox.left && xCheck <= obj.bbox.right &&
				yCheck >= obj.bbox.top && yCheck <= obj.bbox.bottom) {
				result.push(obj);
			}
		}
		return result;
	},

	/*
		method: getBlockerInTile(tileX, tileY[, checkLemming])
		Returns true if there is a blocker in that specified tile
		checkLemming specifies the lemming the check originates from(optional)
		If set, will not check for itself as a blocker, and will only detect blockers in
		the same tile that are in front of checkLemming
	*/
	getBlockerInTile: function(tileX, tileY, checkLemming) {
		if (checkLemming === undefined) {
			checkLemming = null;
		}

		var rect = {
			left: tileX * GameData.tile.width,
			top: (tileY * GameData.tile.height) + 1,
			right: (tileX * GameData.tile.width) + GameData.tile.width,
			bottom: ((tileY * GameData.tile.height) + GameData.tile.height) + 1
		};

		var a, lem;
		for (a = 0; a < this.level.lemmingsGroup.children.length; a++) {
			lem = this.level.lemmingsGroup.children[a];

			if (lem.action.name === "blocker" && !lem.action.idle &&
				lem.x >= rect.left && lem.x < rect.right &&
				lem.y >= rect.top && lem.y < rect.bottom &&
				checkLemming !== lem) {

				// No checkLemming has been specified
				if (!checkLemming) {
					return true;
				}
				// checkLemming has been specified but is not relevant(not in the same tile as lem)
				else if (checkLemming && !(checkLemming.x >= rect.left && checkLemming.x < rect.right &&
					checkLemming.y >= rect.top && checkLemming.y < rect.bottom)) {
					return true;
				}
				// checkLemming has been specified and in the same time as lem; check for requirements
				else if (checkLemming && (checkLemming.x >= rect.left && checkLemming.x < rect.right &&
					checkLemming.y >= rect.top && checkLemming.y < rect.bottom)) {
					// Check to see if lem is in front of checkLemming
					if((checkLemming.x >= lem.x && checkLemming.dir === -1) ||
						(checkLemming.x <= lem.x && checkLemming.dir === 1)) {
						return true;
					}
				}
			}
		}
		return false;
	}
};
