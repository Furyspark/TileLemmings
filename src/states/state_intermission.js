var intermissionState = {
	background: null,
	labels: [],
	guiGroup: [],
	levelFolder: null,
	levelObj: null,

	drawGroup: null,

	level: null,
	minimap: null,

	init: function(levelFolder, levelObj, level) {
		this.levelFolder = levelFolder;
		this.levelObj = levelObj;
		if(level !== undefined) {
			this.level = level;
		}
	},

	preload: function() {
		game.load.json("level", this.levelFolder.baseUrl + this.levelObj.filename);
	},

	create: function() {
		this.drawGroup = game.add.group();
		// Add background
		this.background = new Background("bgMainMenu");
		this.drawGroup.add(this.background);
		// Init map
		var cb = function() {
			this.start();
		};
		this.level = new Level(game.cache.getJSON("level"), cb, this, this.levelFolder, this.levelObj);
		game.world.bringToTop(this.drawGroup);
	},

	start: function() {
		this.createScreen();

		// Add user input
		game.input.onTap.add(function startTheLevel() {
			if(!this.mouseOverGUI()) {
				game.input.onTap.remove(startTheLevel, this);
				this.startLevel();
			}
		}, this);

		// Add 'return to main menu' button
		var btn = new GUI_MainMenuButton(game, 4, 4, "mainmenu");
		this.guiGroup.push(btn);
		btn.set({
			pressed: "btnGray_Down.png",
			released: "btnGray_Up.png"
		}, function() {
			this.clearState();
			this.level.clearAssets();
			this.level.destroy();
			game.state.start("menu", true, false);
		}, this);
		btn.resize(60, 24);
		btn.label.text = "Main Menu";
		btn.label.fontSize = 10;
		this.drawGroup.add(btn);

		// Order drawGroup
		this.drawGroup.sendToBack(this.level);
	},

	startLevel: function() {
		this.clearState();
		game.state.start("game", false, false, this.levelFolder, this.levelObj, this.level);
	},

	mouseOverGUI: function() {
		for(var a = 0;a < this.guiGroup.length;a++) {
			var elem = this.guiGroup[a];
			if(elem.mouseOver()) {
				return true;
			}
		}
		return false;
	},

	clearState: function() {
		// Destroy minimap
		this.minimap.destroy();
		// Destroy labels
		while(this.labels.length > 0) {
			var gobj = this.labels.shift();
			if(gobj.remove) {
				gobj.remove();
			}
			else {
				gobj.destroy();
			}
		}
		// Destroy GUI elements (buttons etc)
		while(this.guiGroup.length > 0) {
			var gobj = this.guiGroup.shift();
			if(gobj.remove) {
				gobj.remove();
			}
			else {
				gobj.destroy();
			}
		}
		// Destroy background
		this.background.destroy();

		this.drawGroup.destroy();
	},

	createScreen: function() {
		this.minimap = new GUI_Minimap(this.level);
		this.minimap.width = Math.max(240, Math.min(480, this.level.baseWidth * 4));
		this.minimap.height = Math.max(180, Math.min(480, this.level.baseHeight * 4));
		this.minimap.x = (game.width - 30) - this.minimap.width;
		this.minimap.y = 30;
		this.drawGroup.add(this.minimap);

		var txt = game.add.text(120, 10, this.level.name, {
			font: "bold 20pt Arial",
			fill: "#FFFFFF",
			boundsAlignH: "center",
			stroke: "#000000",
			strokeThickness: 3
		});
		txt.setTextBounds(0, 0, 240, 40);
		this.labels.push(txt);
		this.drawGroup.add(txt);

		var newStyle = {
			font: "12pt Arial",
			fill: "#FFFFFF",
			stroke: "#000000",
			strokeThickness: 3
		};
		txt = game.add.text(120, 70, this.level.lemmingCount.toString() + " lemmings\n" + Math.floor((this.level.lemmingNeed / this.level.lemmingCount) * 100) + "% to be saved", newStyle);
		txt.setTextBounds(0, 0, 240, 80);
		this.labels.push(txt);
		this.drawGroup.add(txt);
	}
};
