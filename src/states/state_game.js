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
	}
};