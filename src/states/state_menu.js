var menuState = {
	background: null,
	guiGroup: [],

	create: function() {
		this.background = new Background(this.game, "bgMainMenu");

		this.setupMainMenu();
	},

	setupMainMenu: function() {
		this.clearGUIGroup();

		// Add button(s)
		var levelList = this.game.cache.getJSON("levelList").difficulties;
		for(var a = 0;a < levelList.length;a++) {
			var levelFolder = levelList[a];
			var btn = new GUI_MainMenuButton(this.game, 80, 60, "mainmenu");
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
	},

	setupLevelList: function(index) {
		this.clearGUIGroup();

		this.levelList = [];
		var levelFolder = this.game.cache.getJSON("levelList").difficulties[index];
		var btnProps = {
			basePos: {
				x: 40,
				y: 30
			},
			width: 160,
			height: 60,
			spacing: 20
		};
		btnProps.cols = Math.floor((this.game.stage.width - (btnProps.basePos.x * 2)) / (btnProps.width + btnProps.spacing))
		// Create level buttons
		for(var a = 0;a < levelFolder.levels.length;a++) {
			var level = levelFolder.levels[a];
			var xTo = btnProps.basePos.x + ((btnProps.width + btnProps.spacing) * (a % btnProps.cols));
			var yTo = btnProps.basePos.y + ((btnProps.height + btnProps.spacing) * Math.floor(a / btnProps.cols));
			var btn = new GUI_MainMenuButton(this.game, xTo, yTo, "mainmenu");
			btn.resize(btnProps.width, btnProps.height);
			btn.label.text = level.name;
			btn.params = {
				url: levelFolder.baseUrl + level.filename
			};
			btn.set({
				pressed: "btnGray_Down.png",
				released: "btnGray_Up.png"
			}, function() {
				this.game.state.start("intermission", true, false, this.params.levelFolder, this.params.level, false);
			}, btn);
			btn.params = {
				levelFolder: levelFolder,
				level: level
			}
			this.guiGroup.push(btn);
		}

		// Create back button
		var btn = new GUI_MainMenuButton(this.game, 4, 4, "mainmenu");
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

	clearGUIGroup: function() {
		while(this.guiGroup.length > 0) {
			this.guiGroup.shift().remove();
		}
	}
};