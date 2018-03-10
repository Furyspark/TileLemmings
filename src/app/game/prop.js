function Game_Prop() {
    this.init.apply(this, arguments);
}

Game_Prop.prototype = Object.create(Game_Base.prototype);
Game_Prop.prototype.constructor = Game_Prop;

Object.defineProperties(Game_Prop.prototype, {
    rotation: {
        get: function() { return Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").get.call(this); },
        set: function(value) {
            var old = this._rotation;
            Object.getOwnPropertyDescriptor(Game_Base.prototype, "rotation").set.call(this, value);
            this._rotation = value;
            for(var a in this.offsetPoint) {
                this.offsetPoint[a].rotate(value - old);
            }
            for(var a in this.offsetRect) {
                this.offsetRect[a].rotate(value - old);
            }
        },
        configurable: true
    }
});

Game_Prop.prototype.init = function(key, map) {
    Game_Base.prototype.init.call(this);
    this.key = key;
    this.map = map;
    this.src = null;
    this.offsetPoint = {};
    this.offsetRect = {};
    this.sprite = new Sprite_Prop();
    this.type = undefined;
    this.applySource();
}

Game_Prop.prototype.applySource = function() {
    this.src = $dataProps[this.key];
    this.type = this.src.type;
    // Initialize animations
    var baseTextureKey = Loader.determineKey(this.src.assets.textureAtlases.base);
    for(var a in this.src.animations) {
        var animSrc = this.src.animations[a];
        var anim = this.sprite.addAnimation(a);
        for(var b = 0;b < animSrc.length;b++) {
            anim.addFrame(baseTextureKey, animSrc[b]);
        }
    }
    // Initialize sounds
    this.sounds = {};
    for(var a in this.src.assets.audio) {
        this.sounds[a] = Loader.determineKey(this.src.assets.audio[a]);
    }

    // TYPE: Door
    if(this.type === "door") {
        this.rate = 50;
        this.value = 0;
        this.sprite.playAnimation("closed");
        this.alarms.door = new Alarm();
        this.offsetPoint.drop = new Point(this.src.dropOffset.x, this.src.dropOffset.y);
    }
    // TYPE: Exit
    else if(this.type === "exit") {
        this.sprite.playAnimation("idle");
        this.offsetRect.hitArea = new Rect(this.src.hitArea.x, this.src.hitArea.y, this.src.hitArea.width, this.src.hitArea.height);
    }
    // TYPE: Trap
    else if(this.type === "trap") {
        this.sprite.playAnimation("idle");
        this.offsetRect.hitArea = new Rect(this.src.hitArea.x, this.src.hitArea.y, this.src.hitArea.width, this.src.hitArea.height);
        if(this.sprite.hasAnimation("kill")) {
            this.sprite.getAnimation("kill").onEnd.add(function() {
                this.sprite.playAnimation("idle");
            }, this);
        }
    }
}

Game_Prop.prototype.applyProperties = function(props) {
    // TYPE: Door
    if(this.type === "door") {
        if(props.value) {
            this.map.totalLemmings += props.value;
            this.value = props.value;
        }
        if(props.rate) this.rate = props.rate;
    }
    // TYPE: Exit
    else if(this.type === "exit") {}
    // TYPE: Trap
    else if(this.type === "trap") {}
}

Game_Prop.prototype.update = function() {
    Game_Base.prototype.update.call(this);
    // TYPE: Exit
    if(this.type === "exit") {
        var arr = this.map.getLemmings();
        for(var a = 0;a < arr.length;a++) {
            var lemming = arr[a];
            if(this.offsetRect.hitArea.contains(lemming.x - this.x, lemming.y - this.y) && (lemming.rotation % (Math.PI * 2)) === (this.rotation % (Math.PI * 2)) && lemming.canExit()) {
                // Lemming exit
                if(this.sounds.exit) AudioManager.playSound(this.sounds.exit);
                lemming.exit();
            }
        }
    }
    // TYPE: Trap
    else if(this.type === "trap" && !this.sprite.isAnimationPlaying("kill")) {
        var arr = this.map.getLemmings();
        for(var a = 0;a < arr.length;a++) {
            var lemming = arr[a];
            if(this.offsetRect.hitArea.contains(lemming.x - this.x, lemming.y - this.y) && !lemming.disabled) {
                // Kill lemming
                if(this.sounds.kill) AudioManager.playSound(this.sounds.kill);
                // Animation
                if(this.src.deathAnimation) {
                    lemming.disable();
                    lemming.requestAnimation = this.src.deathAnimation;
                }
                else if(this.sprite.hasAnimation("kill")) {
                    lemming.exists = false;
                    this.sprite.playAnimation("kill");
                }
            }
        }
    }
}

Game_Prop.prototype.flipH = function() {
    this.sprite.scale.x = -this.sprite.scale.x;
    if(this.offsetRect.hitArea) {
        this.offsetRect.hitArea.x = -(this.offsetRect.hitArea.x + this.offsetRect.hitArea.width);
    }
}

Game_Prop.prototype.doorOpen = function() {
    var anim = this.sprite.playAnimation("opening");
    anim.onEnd.addOnce(this._doorOpened, this);
}

Game_Prop.prototype._doorOpened = function() {
    this.sprite.playAnimation("open");
    this.alarms.door.time = 30;
    this.alarms.door.onExpire.addOnce(this._doorStart, this);
}

Game_Prop.prototype._doorStart = function() {
    this.alarms.door.onExpire.add(this._doorAct, this);
    this.alarms.door.baseTime = this.rate;
    this.alarms.door.time = 1;
    this.map.startMusic();
}

Game_Prop.prototype._doorAct = function() {
    if(this.value > 0) {
        this.value--;
        var lemming = this.map.pool.lemming.spawn(this.x + this.offsetPoint.drop.x, this.y + this.offsetPoint.drop.y);
        lemming.rotation = this.rotation;
        // Lemming colors
        var colors = this.src.lemmingColor;
        if(colors) {
            lemming.setHairColor(eval("0x" + colors.hair[0]), eval("0x" + colors.hair[1]));
            lemming.setBodyColor(eval("0x" + colors.body[0]), eval("0x" + colors.body[1]));
        } else {
            lemming.setHairColor_Default();
            lemming.setBodyColor_Default();
        }
        // Stop spawning eventually
        if(this.value === 0) this.alarms.door.stop();
    }
}
