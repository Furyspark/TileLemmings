var gameState = {
	map: null,
	layers: {
		tileLayer: null
	},
	bgm: null,

	map: null,
	tileLayer: null,
	levelGroup: null,
	lemmingsGroup: [],
	doorsGroup: [],
	exitsGroup: [],
	trapsGroup: [],
	guiGroup: null,

	actions: {
		climber: 0,
		floater: 0,
		exploder: 0,
		blocker: 0,
		builder: 0,
		basher: 0,
		miner: 0,
		digger: 0
	},
	actionSelect: "",
	actionButtons: {
		climber: null,
		floater: null,
		exploder: null,
		blocker: null,
		builder: null,
		basher: null,
		miner: null,
		digger: null
	},

	preload: function() {
		game.load.tilemap("level1", "assets/levels/level1.json", null, Phaser.Tilemap.TILED_JSON);
	},

	create: function() {
		// Set physics
		game.physics.startSystem(Phaser.Physics.ARCADE);
		// Set level stuff
		this.levelTimer = new Phaser.Timer(game);
		// Create groups
		this.levelGroup = new Phaser.Group(game);
		// this.levelGroup.scale.setTo(1.5);
		this.guiGroup = new Phaser.Group(game);

		// Set map
		this.map = new Phaser.Tilemap(game, "level1");
		this.map.tileWidth = 16;
		this.map.tileHeight = 16;
		this.map.addTilesetImage("pink", "tilesetPink");
		this.map.addTilesetImage("pillar", "tilesetPillar");
		this.tileLayer = this.map.createLayer("tiles");
		this.tileLayer.resizeWorld();
		this.map.setCollisionBetween(1, 65000);

		this.levelGroup.add(this.tileLayer);
		// Set map collisions

		for(var a in this.map.objects.objects) {
			var obj = this.map.objects.objects[a], newObj = null;
			// Create door
			if(obj.type == "door") {
				var newObj = new Prop(game, this.levelGroup, (obj.x + (obj.width * 0.5)), obj.y);
				newObj.setAsDoor("classic", 50, 500, this.lemmingsGroup);
				this.doorsGroup.push(newObj);
			}
		}

		// Create GUI
		this.createLevelGUI();

		// Let's go... HRRRRN
		var snd = game.sound.play("sndLetsGo");
		snd.onStop.addOnce(function() {
			var timer = game.time.create(true);
			timer.add(500, function() {
				this.openDoors();
			}, this);
			timer.start();
		}, this);
	},

	update: function() {
		for(var a in this.lemmingsGroup) {
			var obj = this.lemmingsGroup[a];
			game.physics.arcade.collide(obj, this.tileLayer);
			obj.updatePhysics();
		}
	},

	render: function() {
		// var drawing = false;
		// for(var a in this.lemmingsGroup) {
		// 	var obj = this.lemmingsGroup[a];
		// 	if(typeof obj.render !== "undefined") {
		// 		obj.render();
		// 	}
		// 	if(obj.objectType == "lemming" && !drawing) {
		// 		drawing = true;
		// 		game.debug.bodyInfo(obj, 16, 24);
		// 	}
		// 	game.debug.body(obj);
		// }
	},

	openDoors: function() {
		var snd = game.sound.play("sndDoor");
		for(var a in this.doorsGroup) {
			var obj = this.doorsGroup[a];
			obj.openDoor();
		}
	},

	playLevelBGM: function() {
		var bgmKey = this.map.properties.bgm;
		if(typeof bgmKey !== "undefined") {
			this.playBGM(bgmKey);
		}
	},

	playBGM: function(bgm) {
		this.bgm = game.sound.play(bgm, 1, true);
	},

	stopBGM: function() {
		if(this.bgm != null) {
			this.bgm.stop();
		}
	},

	createLevelGUI: function() {
		var actions = ["Climber", "Floater", "Exploder", "Blocker", "Builder", "Basher", "Miner", "Digger"];
		var buttons = [];

		// Create buttons
		for(var a in actions) {
			var action = actions[a];
			var btn = new GUI_Button(game, this.guiGroup, 0, game.camera.y + game.camera.height);
			buttons.push(btn);
			btn.set({
				released: "Btn_" + action + "_0.png",
				pressed: "Btn_" + action + "_1.png"
			}, function() {
				console.log(action + " selected");
			}, "action");

			// Assign buttons
			switch(action) {
				case "Climber":
				this.actionButtons.climber = btn;
				break;
				case "Floater":
				this.actionButtons.floater = btn;
				break;
				case "Exploder":
				this.actionButtons.exploder = btn;
				break;
				case "Blocker":
				this.actionButtons.blocker = btn;
				break;
				case "Builder":
				this.actionButtons.builder = btn;
				break;
				case "Basher":
				this.actionButtons.basher = btn;
				break;
				case "Miner":
				this.actionButtons.miner = btn;
				break;
				case "Digger":
				this.actionButtons.digger = btn;
				break;
			}
		}

		// Align buttons
		var alignX = 0;
		for(var a in buttons) {
			var btn = buttons[a];
			btn.x = alignX;
			alignX += btn.width;
			btn.y -= btn.height;
		}

		this.expendAction("exploder");
	},

	deselectAllActions: function() {
		for(var a in this.guiGroup.children) {
			var obj = this.guiGroup.children[a];
			if(obj.subType == "action") {
				obj.deselect();
			}
		}
	},

	expendAction: function(action, amount) {
		amount = amount || 1;
		
		this.actions[action] = Math.max(0, this.actions[action] - amount);
		this.actionButtons[action].label.text = this.actions[action].toString();
	}
};