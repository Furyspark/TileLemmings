var gameState = {
	map: null,
	layers: {
		tileLayer: null
	},

	map: null,
	tileLayer: null,
	levelGroup: null,
	objectsDoors: [],

	preload: function() {
		game.load.tilemap("level1", "assets/levels/level1.json", null, Phaser.Tilemap.TILED_JSON);
	},

	create: function() {
		// Set physics
		game.physics.startSystem(Phaser.Physics.ARCADE);
		// Set level stuff
		this.levelTimer = new Phaser.Timer(game);
		// Create level group
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

		// Setup level map
		// this.level = {
		// 	data: [],
		// 	width: this.map.width,
		// 	height: this.map.height,
		// 	tileWidth: this.map.tileWidth,
		// 	tileHeight: this.map.tileHeight,
		// 	getTileAt: function(x, y) {
		// 		return this.data[(Math.floor(x / this.tileWidth) % this.map.width),
		// 		Math.floor(Math.floor(y / this.tileHeight) / this.map.width)];
		// 	},
		// 	addTile: function(tile, type) {
		// 		var obj = {};
		// 		obj.tile = tile;
		// 		obj.type = type;
		// 		this.data.push(obj);
		// 	}
		// };
		// console.log(this.tileLayer.layer.data);
		// for(var a in this.tileLayer.tiles) {
		// 	var tile = this.tileLayer.tiles[a];
		// 	console.log(tile);
		// 	// this.level.addTile(tile, 1);
		// }
		this.map.setCollisionBetween(1, 65000);

		this.levelGroup.add(this.tileLayer);
		// Set map collisions
		
		for(var a in this.map.objects.objects) {
			var obj = this.map.objects.objects[a], newObj = null;
			// Create door
			if(obj.type == "door") {
				var newObj = new Prop(game, this.levelGroup, (obj.x + (obj.width * 0.5)), obj.y);
				newObj.setAsDoor("classic", 50, 500);
				this.objectsDoors.push(newObj);
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
		for(var a in this.levelGroup.children) {
			var obj = this.levelGroup.children[a];
			// Object update
			if(obj.hasOwnProperty("update")) {
				obj.update();
			}
			// Collision
			if(obj !== null && obj.objectType === "lemming") {
				game.physics.arcade.collide(obj, this.tileLayer);
			}
		}
	},

	render: function() {
		var drawing = false;
		for(var a in this.levelGroup.children) {
			var obj = this.levelGroup.children[a];
			if(typeof obj.render !== "undefined") {
				obj.render();
			}
			if(obj.objectType == "lemming" && !drawing) {
				drawing = true;
				game.debug.bodyInfo(obj, 16, 24);
			}
			game.debug.body(obj);
		}
	},

	openDoors: function() {
		var snd = game.sound.play("sndDoor");
		for(var a in this.objectsDoors) {
			var obj = this.objectsDoors[a];
			obj.openDoor();
		}
	}
};