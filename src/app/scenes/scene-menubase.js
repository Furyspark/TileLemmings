function Scene_MenuBase() {
    this.init.apply(this, arguments);
}

Scene_MenuBase.prototype = Object.create(Scene_Base.prototype);
Scene_MenuBase.prototype.constructor = Scene_MenuBase;

Scene_MenuBase.prototype.init = function() {
    Scene_Base.prototype.init.call(this);
    this.initMembers();
    this.addBackground();
    this.createCommands();
}

Scene_MenuBase.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    for(var a = 0;a < this.ui.length;a++) {
        var elem = this.ui[a];
        elem.addListeners();
    }
    this.addListeners();
}

Scene_MenuBase.prototype.initMembers = function() {
    this.ui = [];
    this.text = {};
}

Scene_MenuBase.prototype.continue = function() {
    Scene_Base.prototype.continue.call(this);
    for(var a = 0;a < this.ui.length;a++) {
        var elem = this.ui[a];
        elem.addListeners();
    }
    this.addListeners();
}

Scene_MenuBase.prototype.leave = function() {
    Scene_Base.prototype.leave.call(this);
    for(var a = 0;a < this.ui.length;a++) {
        var elem = this.ui[a];
        elem.remove();
    }
    this.removeListeners();
}

Scene_MenuBase.prototype.addUI = function(elem) {
    if(!elem.z) elem.z = 0;
    this.ui.push(elem);
    if(elem.sprite) this.stage.addChild(elem.sprite);
    else if(elem.contains(PIXI.DisplayObject)) this.stage.addChild(elem);
}

Scene_MenuBase.prototype.applyUIZOrdering = function() {
    this.ui.sort(function(a, b) {
        return a.z - b.z;
    });
}

Scene_MenuBase.prototype.addBackground = function() {
    this.background = new Background("bgMainMenu");
    this.stage.addChild(this.background);
}

Scene_MenuBase.prototype.createCommands = function() {}

Scene_MenuBase.prototype.addListeners = function() {
    Scene_Base.prototype.addListeners.call(this);
    Input.mouse.button.LEFT.onPress.add(this._onMouseLeftDown, this);
    Input.mouse.button.LEFT.onRelease.add(this._onMouseLeftUp, this);
}

Scene_MenuBase.prototype.removeListeners = function() {
    Scene_Base.prototype.removeListeners.call(this);
    Input.mouse.button.LEFT.onPress.remove(this._onMouseLeftDown, this);
    Input.mouse.button.LEFT.onRelease.remove(this._onMouseLeftUp, this);
}

Scene_MenuBase.prototype._onMouseLeftDown = function() {
    var returnElem = null;
    if(this.active) {
        this.applyUIZOrdering();
        for(var a = 0;a < this.ui.length;a++) {
            var elem = this.ui[a];
            if(elem.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) {
                returnElem = elem;
                if(elem.click) elem.click();
                break;
            }
        }
    }
    return returnElem;
}

Scene_MenuBase.prototype._onMouseLeftUp = function() {
    if(this.active) {
        this.ui.forEach(function(obj) {
            obj.release();
        });

        this.applyUIZOrdering();
        for(var a = 0;a < this.ui.length;a++) {
            var elem = this.ui[a];
            if(elem.over(Input.mouse.position.screen.x, Input.mouse.position.screen.y)) {
                if(elem.unclick) elem.unclick();
                break;
            }
        }
    }
}

Scene_MenuBase.prototype.createBackButton = function() {
    var elem = new UI_MenuButton(new Point(40, 40), "Back");
    elem.onClick.add(this.fadeOut, this, [function() {
        SceneManager.pop();
    }]);
    this.addUI(elem);
    return elem;
}

Scene_MenuBase.prototype.getUI_Element = function(key) {
    for(var a = 0;a < this.ui.length;a++) {
        var elem = this.ui[a];
        if(elem.key === key) return elem;
    }
    return null;
}
