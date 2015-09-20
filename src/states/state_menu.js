var menuState = {
	background: null,
	guiGroup: [],

	defaultLabelStyle: {
		font: "bold 12pt Arial",
		fill: "#FFFFFF",
		boundsAlignH: "center",
		stroke: "#000000",
		strokeThickness: 3,
		center: true
	},

	create: function() {
		this.background = new Background(game, "bgMainMenu");

		this.setupMainMenu();
	},

	setupMainMenu: function() {
		this.clearGUIGroup();

		// Add button(s)
		var btnProps = {
			basePos: {
				x: 40,
				y: 30
			},
			width: 160,
			height: 60,
			spacing: 20
		};
		btnProps.cols = Math.floor((game.stage.width - (btnProps.basePos.x * 2)) / (btnProps.width + btnProps.spacing))
		// Create level buttons
		var levelList = game.cache.getJSON("levelList").difficulties;
		for(var a = 0;a < levelList.length;a++) {
			var levelFolder = levelList[a];
			var xTo = btnProps.basePos.x + ((btnProps.width + btnProps.spacing) * (a % btnProps.cols));
			var yTo = btnProps.basePos.y + ((btnProps.height + btnProps.spacing) * Math.floor(a / btnProps.cols));
			var btn = new GUI_MainMenuButton(game, xTo, yTo, "mainmenu");
			btn.set({
				pressed: "btnGray_Down.png",
				released: "btnGray_Up.png"
			}, function() {
				this.state.setupLevelList(this.params.difficulty.index);
			}, btn);
			btn.params = {
				difficulty: {
					resref: levelFolder.resref,
					name: levelFolder.name,
					index: a
				}
			};
			btn.resize(160, 60);
			btn.label.text = btn.params.difficulty.name;
			this.guiGroup.push(btn);
		}

		// Create options button
		var placePos = {x: 40, y: 320};
		var btn = new GUI_MainMenuButton(game, placePos.x, placePos.y, "mainmenu");
		btn.label.text = "Options";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.setupOptionsMenu();
		}, this);
		btn.resize(160, 60);
		this.guiGroup.push(btn);
	},

	setupLevelList: function(index) {
		this.clearGUIGroup();

		this.levelList = [];
		var levelFolder = game.cache.getJSON("levelList").difficulties[index];
		var btnProps = {
			basePos: {
				x: 40,
				y: 30
			},
			width: 160,
			height: 60,
			spacing: 20
		};
		btnProps.cols = Math.floor((game.stage.width - (btnProps.basePos.x * 2)) / (btnProps.width + btnProps.spacing))
		var completedLevels = [];
		if(game.saveFile[levelFolder.resref]) {
			completedLevels = game.saveFile[levelFolder.resref];
		}
		// Create level buttons
		for(var a = 0;a < levelFolder.levels.length;a++) {
			// Don't add not unlocked levels
			if(a === 0 || completedLevels.indexOf(a-1) !== -1) {
				var level = levelFolder.levels[a];
				var xTo = btnProps.basePos.x + ((btnProps.width + btnProps.spacing) * (a % btnProps.cols));
				var yTo = btnProps.basePos.y + ((btnProps.height + btnProps.spacing) * Math.floor(a / btnProps.cols));
				var btn = new GUI_MainMenuButton(game, xTo, yTo, "mainmenu");
				btn.resize(btnProps.width, btnProps.height);
				btn.label.text = level.name;
				btn.params = {
					url: levelFolder.baseUrl + level.filename
				};
				btn.set({
					pressed: "btnGray_Down.png",
					released: "btnGray_Up.png"
				}, function() {
					game.state.start("intermission", true, false, this.params.levelFolder, this.params.level, false);
				}, btn);
				btn.params = {
					levelFolder: levelFolder,
					level: level
				}
				this.guiGroup.push(btn);
			}
		}

		// Create back button
		var btn = new GUI_MainMenuButton(game, 4, 4, "mainmenu");
		btn.resize(40, 24);
		btn.label.text = "Back";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.state.setupMainMenu();
		}, btn);
		this.guiGroup.push(btn);
	},

	setupOptionsMenu: function() {
		this.clearGUIGroup();
		var a, chan;

		this.settings = {
			audio: {
				volume: {}
			}
		};
		for(a in GameManager.audio.volume) {
			this.settings.audio.volume[a] = GameManager.audio.volume[a];
		}

		// Create Save button
		var placePos = {x: 260, y: 530};
		var btn = new GUI_MainMenuButton(game, placePos.x, placePos.y, "mainmenu");
		btn.label.text = "OK";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			// Apply settings
			for(a in this.state.settings.audio.volume) {
				GameManager.audio.volume[a] = this.state.settings.audio.volume[a];
			}
			// Save settings and go back to main menu
			GameManager.saveSettings();
			this.state.setupMainMenu();
		}, btn);
		btn.resize(80, 30);
		this.guiGroup.push(btn);

		// Create Cancel button
		placePos = {x: 500, y: 530};
		var btn = new GUI_MainMenuButton(game, placePos.x, placePos.y, "mainmenu");
		btn.label.text = "Cancel";
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.state.setupMainMenu();
		}, btn);
		btn.resize(80, 30);
		this.guiGroup.push(btn);

		// Create volume slider(s)
		// Create label
		placePos = {x: 160, y: 20};
		var elem = game.add.text(placePos.x, placePos.y, "Volume", this.defaultLabelStyle);
		elem.setTextBounds(-120, 0, 240, 30);
		this.guiGroup.push(elem);
		// SFX volume
		placePos = {x: 160, y: 80};
		var elem = new GUI_Slider(game, placePos.x, placePos.y, 64, "mainmenu", {base: this.settings.audio.volume, name: "sfx", min: 0, max: 1});
		elem.label.text = "Sound";
		this.guiGroup.push(elem);
		// BGM volume
		placePos.y += 60;
		var elem = new GUI_Slider(game, placePos.x, placePos.y, 64, "mainmenu", {base: this.settings.audio.volume, name: "bgm", min: 0, max: 1});
		elem.label.text = "Music";
		this.guiGroup.push(elem);
	},

	clearGUIGroup: function() {
		while(this.guiGroup.length > 0) {
			var elem = this.guiGroup.shift();
			if(elem.remove) {
				elem.remove();
			}
			else {
				elem.destroy();
			}
		}
	}
};