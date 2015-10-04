var intermissionState = {
	background: null,
	labels: [],
	guiGroup: [],

	level: null,
	minimap: null,

	init: function(levelFolder, levelObj, retry, mapFiles) {
		// Set default parameters
		if(typeof retry === "undefined") {
			retry = false;
		}
		if(typeof mapFiles === "undefined") {
			mapFiles = [];
		}
		this.clearMapFiles(mapFiles);
	},

	preload: function() {
		game.load.json("level", this.levelFolder.baseUrl + this.levelObj.filename);
	},

	create: function() {
		// Init map
		var cb = function() {
			this.start();
		};
		this.level = game.cache.getJSON("level", cb, this);
	},

	start: function() {
		// Add background
		this.background = new Background(game, "bgMainMenu");

		// Create map preview
		this.initMapPreview();

		// Add user input
		game.input.onTap.addOnce(function() {
			if(!this.mouseOverGUI()) {
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
			this.backToMenu();
		}, this);
		btn.resize(60, 24);
		btn.label.text = "Main Menu";
		btn.label.fontSize = 10;
	},

	startLevel: function() {
		this.clearState();
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
	},

	createScreen: function() {
		this.minimap = new GUI_Minimap(this.guiGroup);
		this.minimap.width = Math.max(240, Math.min(480, this.map.width * 4));
		this.minimap.height = Math.max(180, Math.min(480, this.map.height * 4));
		this.minimap.x = (game.width - 30) - this.minimap.width;
		this.minimap.y = 30;

		var txt = game.add.text(120, 10, this.level.name, {
			font: "bold 20pt Arial",
			fill: "#FFFFFF",
			boundsAlignH: "center",
			stroke: "#000000",
			strokeThickness: 3
		});
		txt.setTextBounds(0, 0, 240, 40);
		this.labels.push(txt);

		var newStyle = {
			font: "12pt Arial",
			fill: "#FFFFFF",
			stroke: "#000000",
			strokeThickness: 3
		};
		txt = game.add.text(120, 70, this.level.lemmingCount.toString() + " lemmings\n" + Math.floor((this.level.lemmingNeed / this.level.lemmingCount) * 100) + "% to be saved", newStyle);
		txt.setTextBounds(0, 0, 240, 80);
		this.labels.push(txt);
	}
};
