function ReplayAction() {
    this.initialize.apply(this, arguments);
};

ReplayAction.prototype.initialize = function(replay, query, action) {
    this._replay = replay;
    this.query = query || "";
    this.action = action || "";
};

ReplayAction.prototype.getMap = function() {
    return this._replay._map;
};

ReplayAction.prototype.performAction = function() {
    var map = this.getMap();
    var scene = SceneManager.current();
    var object = eval(this.query);
    eval(this.action);
};
