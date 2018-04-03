function Scene_Game() {
    this.init.apply(this, arguments);
}

Scene_Game.prototype = Object.create(Scene_Base.prototype);
Scene_Game.prototype.constructor = Scene_Game;

Scene_Game.prototype.init = function() {
    Scene_Base.prototype.init.call(this);
    this.alarm = {
        doors: new Alarm(),
        nuke: new Alarm()
    };
    // Update replay
    $gameMap.updateReplay();
    // Set vars
    this.alarm.nuke.onExpire.add(this._nukeLemming, this);
    this.alarm.nuke.baseTime = 10;
    this.stage.addChild($gameMap.world);
    this.actionSelected = "";
    this.paused = false;
    this.fastForward = false;
    this.nuked = false;
    this.grid = false;
    this._mapStarted = false;
    this.initUI();
    // Init cursor
    this.cursor = new Sprite_Cursor();
    this.lemmingSelect = null;
    this.stage.addChild(this.cursor);
    // Init action preview
    this.actionPreview = [];
    this.actionPreview = {
        tiles: [],
        alpha: {
            value: 0.9,
            speed: -0.05,
            min: 0.5,
            max: 0.9
        }
    };
    for(var a = 0;a < 5;a++) {
        var spr = new Sprite_Base();
        var anim = spr.addAnimation("idle");
        anim.addFrame("atlMisc", "previewTile.png");
        spr.playAnimation("idle");
        spr.visible = false;
        spr.z = -1510;
        this.actionPreview.tiles.push(spr);
        $gameMap.world.addChild(spr);
    }
    // Zoom
    this.zoom = {
        factor: {
            current: 1,
            to: 1,
            maximum: 3,
            minimum: 0.5
        },
        focusPoint: new Point()
    };
    this._calculateZoomBounds();
    // Fade in
    this.fadeIn(this.startMap.bind(this, 0));
    // Add end of map event
    $gameMap.onEndOfMap.addOnce(this.endMap, this);
    // Apply player config
    if(Options.data.gameplay.startWithGrid) this.toggleGrid(false);
    this._mouseScrolling = false;
}

Scene_Game.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.initControls();
    $gameMap.updateCameraBounds();
}

Scene_Game.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    // Move camera
    this.controlCamera();
    if(this.minimap) this.minimap.update();
    if(!this.paused) {
        // Update map
        var updateCount = 1;
        if(this.fastForward) updateCount = 4;
        for(var a = 0;a < updateCount;a++) {
            $gameMap.update();
            for(var b in this.alarm) {
                this.alarm[b].update();
            }
            if(this._mapStarted) $gameMap.updateGameLogic();
        }
    }
    // Lemming control
    this.lemmingSelect = this.getLemmingUnderCursor();
    if(this.lemmingSelect) {
        var pt = $gameMap.toScreenSpace(this.lemmingSelect.x - (this.lemmingSelect.offsetPoint.down.x * 8), this.lemmingSelect.y - (this.lemmingSelect.offsetPoint.down.y * 8));
        this.cursor.position.set(pt.x, pt.y);
        this.cursor.scale.set(2 / this.zoom.factor.current);
        this.cursor.playAnimation("over");
        this.cursor.visible = true;
    }
    else {
        this.cursor.visible = false;
    }
    this.updateActionPreview();
    // Update replay icon
    if(this.replayIcon != null) this.replayIcon.sprite.update();
}

Scene_Game.prototype.startMouseScroll = function() {
    this._mouseScrolling = true;
}

Scene_Game.prototype.stopMouseScroll = function() {
    this._mouseScrolling = false;
}

Scene_Game.prototype.controlCamera = function() {
    // Mouse scrolling
    if(this._mouseScrolling) {
        var spdFactor = 0.5;
        var hspd = (Input.mouse.position.screenPrev.x - Input.mouse.position.screen.x) * spdFactor;
        var vspd = (Input.mouse.position.screenPrev.y - Input.mouse.position.screen.y) * spdFactor;
        $gameMap.camera.move(hspd, vspd);
    }

    // Keyboard scrolling
    var camSpeed = 3;
    if(Input.key.SHIFT.down) camSpeed *= 2;

    if(Input.isDown("camLeft")) {
        $gameMap.camera.move(-camSpeed, 0);
    }
    else if(Input.isDown("camRight")) {
        $gameMap.camera.move(camSpeed, 0);
    }
    if(Input.isDown("camUp")) {
        $gameMap.camera.move(0, -camSpeed);
    }
    else if(Input.isDown("camDown")) {
        $gameMap.camera.move(0, camSpeed);
    }

    // Update
    this.updateZoom();
    $gameMap.updateCamera();
}

Scene_Game.prototype.updateZoom = function() {
    // Gather data
    var fp = this.zoom.focusPoint;
    var br = $gameMap.camera.baseRect;
    var r = $gameMap.camera.rect;
    var prevW = r.width;
    var prevH = r.height;
    // Apply Zoom
    r.width = br.width * this.zoom.factor.current;
    r.height = br.height * this.zoom.factor.current;
    // Reposition
    var diffW = r.width - prevW;
    var diffH = r.height - prevH;
    var anchor = new Point((r.x - fp.x) / r.width, (r.y - fp.y) / r.height);
    var pos = new Point(r.x + (diffW * anchor.x), r.y + (diffH * anchor.y));
    $gameMap.camera.setPosition(pos, new Point(0, 0));
}

Scene_Game.prototype.startMap = function(stage) {
    if(stage === undefined) stage = 0;
    if(stage === 0) {
        this.alarm.start = new Alarm();
        this.alarm.start.onExpire.addOnce(this.startMap, this, [stage+1]);
        this.alarm.start.time = 60;
    }
    else if(stage === 1) {
        var snd = AudioManager.playSound("sndLetsGo");
        snd.audio.once("end", this.startMap.bind(this, stage+1));
    }
    else if(stage === 2) {
        this.alarm.start.onExpire.addOnce(this.startMap, this, [stage+1]);
        this.alarm.start.time = 30;
    }
    else if(stage === 3) {
        this._openDoors();
    }
}

Scene_Game.prototype._openDoors = function() {
    this.alarm.doors.time = 30;
    this.alarm.doors.onExpire.addOnce(function () {
        var arr = $gameMap.getDoors();
        var playedSound = false;
        for(var a = 0;a < arr.length;a++) {
            var obj = arr[a];
            if(!playedSound && obj.sounds && obj.sounds.open) {
                AudioManager.playSound(obj.sounds.open);
                playedSound = true;
            }
            obj.doorOpen();
            this._mapStarted = true;
        }
    }, this);
}

Scene_Game.prototype.initUI = function() {
    this.ui = [];
    this.uiScale = 2;
    this.createPanel();
    var cW = this.createActionButtons();
    this.createExtraButtons(cW);
    this.createMinimap();
    this.createReplayIcon();
}

Scene_Game.prototype.createPanel = function() {
    this.panel = new UI_Base(0, 0, "panel");
    this.panel.sprite.addAnimationExt("atlPanels", "idle", 1, "panel_classic.png");
    this.panel.sprite.playAnimation("idle");
    this.panel.sprite.scale.set(this.uiScale);
    this.panel.y = Core.resolution.y - this.panel.sprite.height;
    this.panel.sprite.z = 100;
    this.uiHeight = this.panel.sprite.height;
    this.stage.addChild(this.panel.sprite);
    this.ui.push(this.panel);
}

Scene_Game.prototype.panelHeight = function() {
    return this.panel.sprite.height;
}

Scene_Game.prototype.createActionButtons = function() {
    var cA = 0;
    var cW = 0;
    for(var a in $gameMap.actions) {
        var action = $gameMap.actions[a];
        var actionSrc = $dataActions[a];
        var btn = new UI_Button(0, 0, "action" + cA.toString());

        btn.onClick.add(this.selectAction, this, [cA]);
        btn.addAnimation("up", "atlGUI", [actionSrc.button.up]);
        btn.addAnimation("down", "atlGUI", [actionSrc.button.down]);
        btn.sprite.scale.set(this.uiScale);
        btn.sprite.playAnimation("up");
        if(cA === 0) {
            this.actionSelected = a;
            btn.sprite.playAnimation("down");
        }
        btn.actionName = a;
        btn.label.text = action.amount.toString();

        btn.x = cW;
        cW += btn.sprite.width;
        btn.y = Core.resolution.y - btn.sprite.height;

        this.ui.push(btn);
        btn.refresh();
        this.stage.addChild(btn.sprite);
        cA++;
    }
    return cW;
}

Scene_Game.prototype.createExtraButtons = function(cW) {
    // Create pause button
    var btn = new UI_Button(0, 0, "pause");
    btn.onClick.add(this.pauseGame, this, [true]);
    btn.addAnimation("up", "atlGUI", ["Btn_Pause_0.png"]);
    btn.addAnimation("down", "atlGUI", ["Btn_Pause_1.png"]);
    btn.sprite.scale.set(this.uiScale);
    btn.sprite.playAnimation("up");
    btn.x = cW;
    cW += btn.sprite.width;
    btn.y = Core.resolution.y - btn.sprite.height;
    this.ui.push(btn);
    btn.refresh();
    this.stage.addChild(btn.sprite);
    // Create fast forward button
    var btn = new UI_Button(0, 0, "fastforward");
    btn.onClick.add(this.toggleFastForward, this, [true]);
    btn.addAnimation("up", "atlGUI", ["Btn_FastForward_0.png"]);
    btn.addAnimation("down", "atlGUI", ["Btn_FastForward_1.png"]);
    btn.sprite.scale.set(this.uiScale);
    btn.sprite.playAnimation("up");
    btn.x = cW;
    cW += btn.sprite.width;
    btn.y = Core.resolution.y - btn.sprite.height;
    this.ui.push(btn);
    btn.refresh();
    this.stage.addChild(btn.sprite);
    // Create nuke button
    var btn = new UI_Button(0, 0, "nuke");
    btn.onClick.add(this._buttonNuke, this, [btn]);
    btn.addAnimation("up", "atlGUI", ["Btn_Nuke_0.png"]);
    btn.addAnimation("down", "atlGUI", ["Btn_Nuke_1.png"]);
    btn.sprite.scale.set(this.uiScale);
    btn.sprite.playAnimation("up");
    btn.x = cW;
    cW += btn.sprite.width;
    btn.y = Core.resolution.y - btn.sprite.height;
    this.ui.push(btn);
    btn.refresh();
    this.stage.addChild(btn.sprite);
    // Create grid button
    var btn = new UI_Button(0, 0, "grid");
    btn.onClick.add(this.toggleGrid, this, [true]);
    btn.addAnimation("up", "atlGUI", ["Btn_Grid_0.png"]);
    btn.addAnimation("down", "atlGUI", ["Btn_Grid_1.png"]);
    btn.sprite.scale.set(this.uiScale);
    btn.sprite.playAnimation("up");
    btn.x = cW;
    cW += btn.sprite.width;
    btn.y = Core.resolution.y - btn.sprite.height;
    this.ui.push(btn);
    btn.refresh();
    this.stage.addChild(btn.sprite);
}

Scene_Game.prototype.createMinimap = function() {
    this.minimap = new UI_Minimap({ addCameraView: true, interactive: true });
    this.updateMinimap();
    this.stage.addChild(this.minimap.sprite);
}

Scene_Game.prototype.createReplayIcon = function() {
    if(!$gameMap.replay.hasActionsRemaining()) {
        return;
    }
    if(this.replayIcon == null) {
        this.replayIcon = new UI_Base(16, 16, "replayIcon");
        this.replayIcon.addAnimation("idle", "atlMisc", ["replay_0.png", "replay_1.png"]);
        this.replayIcon.sprite.playAnimation("idle");
        this.replayIcon.sprite.animSpeed = 1 / 45;
        this.stage.addChild(this.replayIcon.sprite);
    }
    this.replayIcon.sprite.alpha = 1;
};

Scene_Game.prototype.updateMinimap = function() {
    this.minimap.update();
    var maxWidth = 240;
    var maxHeight = this.panel.height - 1;
    this.minimap.sprite.height = (this.minimap.sprite.height / this.minimap.sprite.width) * maxWidth;
    this.minimap.sprite.width = maxWidth;
    this.minimap.sprite.position.set(Core.resolution.x - this.minimap.sprite.width, Core.resolution.y - this.minimap.sprite.height);
}

Scene_Game.prototype.initControls = function() {
    Input.mouse.button.LEFT.onPress.add(this._onMouseLeftDown, this);
    // Action select
    Input.key["1"].onPress.add(this.selectAction, this, [0]);
    Input.key["2"].onPress.add(this.selectAction, this, [1]);
    Input.key["3"].onPress.add(this.selectAction, this, [2]);
    Input.key["4"].onPress.add(this.selectAction, this, [3]);
    Input.key["5"].onPress.add(this.selectAction, this, [4]);
    Input.key["6"].onPress.add(this.selectAction, this, [5]);
    Input.key["7"].onPress.add(this.selectAction, this, [6]);
    Input.key["8"].onPress.add(this.selectAction, this, [7]);
    Input.key.F.onPress.add(this.toggleFastForward, this, [true]);
    Input.key[" "].onPress.add(this.pauseGame, this, [true]);
    Input.key.G.onPress.add(this.toggleGrid, this, [true]);
    // Zooming
    Input.mouse.button.WHEELUP.onPress.add(this.zoomIn, this, [0.1, true], 30);
    Input.mouse.button.WHEELDOWN.onPress.add(this.zoomOut, this, [0.1, true], 30);
    // Scrolling
    Input.mouse.button.RIGHT.onPress.add(this.startMouseScroll, this);
    Input.mouse.button.RIGHT.onRelease.add(this.stopMouseScroll, this);
}

Scene_Game.prototype.releaseControls = function() {
    Input.mouse.button.LEFT.onPress.remove(this._onMouseLeftDown, this);
    Input.key["1"].onPress.remove(this.selectAction, this);
    Input.key["2"].onPress.remove(this.selectAction, this);
    Input.key["3"].onPress.remove(this.selectAction, this);
    Input.key["4"].onPress.remove(this.selectAction, this);
    Input.key["5"].onPress.remove(this.selectAction, this);
    Input.key["6"].onPress.remove(this.selectAction, this);
    Input.key["7"].onPress.remove(this.selectAction, this);
    Input.key["8"].onPress.remove(this.selectAction, this);
    Input.key.F.onPress.remove(this.toggleFastForward, this);
    Input.key[" "].onPress.remove(this.pauseGame, this);
    Input.key.G.onPress.remove(this.toggleGrid, this, [true]);
    // Zooming
    Input.mouse.button.WHEELUP.onPress.remove(this.zoomIn, this);
    Input.mouse.button.WHEELDOWN.onPress.remove(this.zoomOut, this);
    // Scrolling
    Input.mouse.button.RIGHT.onPress.remove(this.startMouseScroll, this);
    Input.mouse.button.RIGHT.onRelease.remove(this.stopMouseScroll, this);
}

Scene_Game.prototype.zoomIn = function(amount, toCursor) {
    if(toCursor === undefined) toCursor = false;
    this.zoom.factor.to = Math.max(this.zoom.factor.minimum, this.zoom.factor.to - amount);
    // Set to 1.0 if within reach
    if(this.zoom.factor.to > 1 - amount && this.zoom.factor.to < 1 + amount) this.zoom.factor.to = 1;
    // Tween
    createjs.Tween.get(this.zoom.factor, { override: true })
        .to({ current: this.zoom.factor.to }, 500, createjs.Ease.getPowOut(2.5));
    if(toCursor) {
        this.zoom.focusPoint.x = Input.mouse.position.world.x;
        this.zoom.focusPoint.y = Input.mouse.position.world.y;
    }
    else {
        this.zoom.focusPoint.x = $gameMap.camera.rect.x + ($gameMap.camera.rect.width / 2);
        this.zoom.focusPoint.y = $gameMap.camera.rect.y + ($gameMap.camera.rect.height / 2);
    }
}

Scene_Game.prototype.zoomOut = function(amount, fromCursor) {
    if(fromCursor === undefined) fromCursor = false;
    this.zoom.factor.to = Math.min(this.zoom.factor.maximum, this.zoom.factor.to + amount);
    // Set to 1.0 if within reach
    if(this.zoom.factor.to > 1 - amount && this.zoom.factor.to < 1 + amount) this.zoom.factor.to = 1;
    // Tween
    createjs.Tween.get(this.zoom.factor, { override: true })
        .to({ current: this.zoom.factor.to }, 500, createjs.Ease.getPowOut(2.5));
    if(fromCursor) {
        this.zoom.focusPoint.x = Input.mouse.position.world.x;
        this.zoom.focusPoint.y = Input.mouse.position.world.y;
    }
    else {
        this.zoom.focusPoint.x = $gameMap.camera.rect.x + ($gameMap.camera.rect.width / 2);
        this.zoom.focusPoint.y = $gameMap.camera.rect.y + ($gameMap.camera.rect.height / 2);
    }
}

Scene_Game.prototype._calculateZoomBounds = function() {
    var newMaxSize = new Point(
        $gameMap.realWidth / $gameMap.camera.baseRect.width,
        ($gameMap.realHeight + this.panel.sprite.height) / $gameMap.camera.baseRect.height
    );
    this.zoom.factor.maximum = Math.min(newMaxSize.x, newMaxSize.y);
}

Scene_Game.prototype._onMouseLeftDown = function() {
    var elem = this.mouseOverUI();
    if(elem && elem.click) elem.click();
    else if(!elem) {
        this.stopReplay();
        if(this.lemmingSelect) {
            if(this.actionSelected !== "" && $gameMap.actions[this.actionSelected]) {
                if($gameMap.actions[this.actionSelected].amount > 0) {
                    this.assignAction(this.lemmingSelect, this.actionSelected, true);
                }
            }
        }
    }
}

Scene_Game.prototype.assignAction = function(lemming, action, playSound) {
    if(playSound == null) playSound = false;
    var result = lemming.assignAction(action);
    if(result) {
        // Subtract action count
        $gameMap.actions[action].amount--;
        // Action depletion visual and audio update
        if(playSound === true) AudioManager.playSound("sndAction");
        var elem = this.getActionButton(action);
        if(elem) {
            elem.label.text = $gameMap.actions[action].amount.toString();
            elem.refresh();
        }
        // Add to replay
        var replayAction = $gameMap.replay.addAction($gameMap.frame);
        var lemmingIndex = $gameMap.getLemmings().indexOf(lemming);
        replayAction.query = "map.getLemmings()[" + lemmingIndex + "];";
        replayAction.action = "scene.assignAction(object, \"" + action + "\");";
    }
    return result;
};

Scene_Game.prototype.mouseOverUI = function() {
    this.sortUI();
    for(var a = 0;a < this.ui.length;a++) {
        var elem = this.ui[a];
        if(elem.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) return elem;
    }
    return null;
}

Scene_Game.prototype.sortUI = function() {
    this.ui.sort(function(a, b) {
        return a.z - b.z;
    });
}

Scene_Game.prototype.selectAction = function(index) {
    var key = "action" + index.toString();
    for(var a = 0;a < this.ui.length;a++) {
        var elem = this.ui[a];
        if(elem.key === key) {
            elem.sprite.playAnimation("down");
            this.actionSelected = elem.actionName;
            AudioManager.playSound("sndUI_Click");
        }
        else if(elem.actionName) {
            elem.sprite.playAnimation("up");
        }
    }
}

Scene_Game.prototype.getUI_Element = function(key) {
    for(var a = 0;a < this.ui.length;a++) {
        var elem = this.ui[a];
        if(elem.key === key) return elem;
    }
    return null;
}

Scene_Game.prototype.getActionButton = function(actionName) {
    for(var a = 0;a < this.ui.length;a++) {
        var elem = this.ui[a];
        if(elem.actionName && elem.actionName === actionName) return elem;
    }
    return false;
}

Scene_Game.prototype.pauseGame = function(playSound) {
    this.paused = !this.paused;
    var elem = this.getUI_Element("pause");
    // Now paused
    if(this.paused) {
        elem.sprite.playAnimation("down");
        if(Options.data.audio.toggleDuringPause) AudioManager.pauseBgm();
    }
    // Now unpaused
    else {
        elem.sprite.playAnimation("up");
        AudioManager.resumeBgm();
    }
    if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.toggleFastForward = function(playSound) {
    this.fastForward = !this.fastForward;
    var elem = this.getUI_Element("fastforward");
    if(this.fastForward) elem.sprite.playAnimation("down");
    else elem.sprite.playAnimation("up");
    if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype._buttonNuke = function(btn) {
    var c = new Date().getTime();
    if(btn.lastClickTime >= c - 500) {
        this.nuke();
    }
}

Scene_Game.prototype.nuke = function() {
    // Track for replay
    var replayAction = $gameMap.replay.addAction($gameMap.frame);
    replayAction.query = "null";
    replayAction.action = "scene.nuke();";
    // Stop replay
    this.stopReplay();
    // Nuke
    this.nuked = true;
    var elem = this.getUI_Element("nuke");
    elem.sprite.playAnimation("down");
    AudioManager.playSound("sndUI_Click");
    this.alarm.nuke.start();
    // Prevent lemmings from spawning
    var arr = $gameMap.getDoors();
    for(var a = 0;a < arr.length;a++) {
        var obj = arr[a];
        obj.value = 0;
    }
}

Scene_Game.prototype._nukeLemming = function() {
    var arr = $gameMap.getLemmings().filter(function(lemming) {
        return (lemming.bomber.count === -1);
    });
    if(arr.length > 0) arr[0].nuke();
}

Scene_Game.prototype.toggleGrid = function(playSound) {
    this.grid = !this.grid;
    var elem = this.getUI_Element("grid");
    if(this.grid) {
        elem.sprite.playAnimation("down");
        $gameMap.grid.visible = true;
    }
    else {
        elem.sprite.playAnimation("up");
        $gameMap.grid.visible = false;
    }
    if(playSound) AudioManager.playSound("sndUI_Click");
}

Scene_Game.prototype.getLemmingUnderCursor = function() {
    var arr = $gameMap.getLemmings();
    // Filters
    if(Input.key.Q.down) arr = arr.filter(function(obj) {
        if(obj.rotation % (Math.PI * 2) === Math.degtorad(180)) return obj.dir === Game_Lemming.DIR_RIGHT;
        return obj.dir === Game_Lemming.DIR_LEFT;
    });
    else if(Input.key.E.down) arr = arr.filter(function(obj) {
        if(obj.rotation % (Math.PI * 2) === Math.degtorad(180)) return obj.dir === Game_Lemming.DIR_LEFT;
        return obj.dir === Game_Lemming.DIR_RIGHT;
    });
    arr = arr.filter(function(obj) { return obj.interactive; } );
    // Action filters
    switch(this.actionSelected.toUpperCase()) {
        case "CLIMBER":
            arr = arr.filter(function(lemming) { return (!lemming.hasProperty("CLIMBER")); });
            break;
        case "FLOATER":
            arr = arr.filter(function(lemming) { return (!lemming.hasProperty("FLOATER")); });
            break;
        case "BOMBER":
            arr = arr.filter(function(lemming) { return (lemming.bomber.count === -1); } );
            break;
        case "BLOCKER":
            arr = arr.filter(function(lemming) { return (lemming.action !== Game_Lemming.ACTION_BLOCKER && lemming.onGround); } );
            break;
        case "BUILDER":
            arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_BUILDER || lemming.sprite.isAnimationPlaying('build-end')) && lemming.onGround); } );
            break;
        case "BASHER":
            arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_BASHER) && lemming.onGround); } );
            break;
        case "MINER":
            arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_MINER) && lemming.onGround); } );
            break;
        case "DIGGER":
            arr = arr.filter(function(lemming) { return ((lemming.action !== Game_Lemming.ACTION_DIGGER) && lemming.onGround); } );
            break;
    }
    // Sort by priority
    arr.sort(function(a, b) {
        var baseActions = [Game_Lemming.ACTION_WALK, Game_Lemming.ACTION_FALL];
        if(baseActions.indexOf(a.action.current) !== -1 && baseActions.indexOf(b.action.current) === -1) return 1;
        if(baseActions.indexOf(a.action.current) === -1 && baseActions.indexOf(b.action.current) !== -1) return -1;
        return 0;
    });
    // Select
    for(var a = 0;a < arr.length;a++) {
        var lem = arr[a];
        if(lem.mouseOver()) return lem;
    }
    return null;
}

Scene_Game.prototype.updateActionPreview = function() {
    // Update all action preview tiles
    this.actionPreview.alpha.value = Math.max(this.actionPreview.alpha.min, Math.min(this.actionPreview.alpha.max, this.actionPreview.alpha.value + this.actionPreview.alpha.speed));
    if(this.actionPreview.alpha.value === this.actionPreview.alpha.min) this.actionPreview.alpha.speed = -this.actionPreview.alpha.speed;
    else if(this.actionPreview.alpha.value === this.actionPreview.alpha.max) this.actionPreview.alpha.speed = -this.actionPreview.alpha.speed;
    for(var a = 0;a < this.actionPreview.tiles.length;a++) {
        var spr = this.actionPreview.tiles[a];
        spr.alpha = this.actionPreview.alpha.value;
        spr.visible = false;
    }
    if(this.lemmingSelect !== null) {
        switch(this.actionSelected) {
            case "blocker":
            case "bomber":
                var spr = this.actionPreview.tiles[0];
                spr.x = ((this.lemmingSelect.x) >> 4) << 4;
                spr.y = ((this.lemmingSelect.y) >> 4) << 4;
                spr.visible = true;
                break;
            case "builder":
                var spr = this.actionPreview.tiles[0];
                spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.right.x * 16 * this.lemmingSelect.dir)) >> 4) << 4;
                spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.right.y * 16 * this.lemmingSelect.dir)) >> 4) << 4;
                spr.visible = true;
                break;
            case "basher":
                var spr = this.actionPreview.tiles[0];
                spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.right.x * 16 * this.lemmingSelect.dir)) >> 4) << 4;
                spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.right.y * 16 * this.lemmingSelect.dir)) >> 4) << 4;
                spr.visible = true;
                break;
            case "miner":
                var spr = this.actionPreview.tiles[0];
                spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.right.x * 16 * this.lemmingSelect.dir)) >> 4) << 4;
                spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.right.y * 16 * this.lemmingSelect.dir)) >> 4) << 4;
                spr.visible = true;
                var spr = this.actionPreview.tiles[1];
                spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.right.x * 16 * this.lemmingSelect.dir) + (this.lemmingSelect.offsetPoint.down.x * 16)) >> 4) << 4;
                spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.right.y * 16 * this.lemmingSelect.dir) + (this.lemmingSelect.offsetPoint.down.y * 16)) >> 4) << 4;
                spr.visible = true;
                break;
            case "digger":
                var spr = this.actionPreview.tiles[0];
                spr.x = ((this.lemmingSelect.x + (this.lemmingSelect.offsetPoint.down.x * 16)) >> 4) << 4;
                spr.y = ((this.lemmingSelect.y + (this.lemmingSelect.offsetPoint.down.y * 16)) >> 4) << 4;
                spr.visible = true;
                break;
        }
    }
}

Scene_Game.prototype.endMap = function() {
    this.fadeOut(function() {
        AudioManager.stopBgm();
        this.releaseControls();
        SceneManager.push(new Scene_PostGame());
    }.bind(this));
}

Scene_Game.prototype.stopReplay = function() {
    $gameMap.replay.stop();
    if(this.replayIcon != null) {
        this.replayIcon.sprite.alpha = 0;
    }
};
