function UI_Button() {
  this.init.apply(this, arguments);
}

UI_Button.prototype = Object.create(UI_Base.prototype);
UI_Button.prototype.constructor = UI_Button;

UI_Button.prototype.init = function(x, y, key) {
  UI_Base.prototype.init.call(this, x, y, key);
  this.label = new Text("", {
    fill: "white",
    stroke: "black",
    strokeThickness: 4,
    fontSize: 10
  });
  this.label.anchor.x = 0.5;
  this.sprite.addChild(this.label);
  this.onClick = new Signal();
  this.lastClickTime = 0;
  this.z = -10;
}

UI_Button.prototype.click = function() {
  // this.onClick.dispatch();

  var d = new Date();
  this.lastClickTime = d.getTime();
}

UI_Button.prototype.unclick = function() {
  this.onClick.dispatch();
}

UI_Button.prototype.refresh = function() {
  if(this.label) {
    this.label.x = (this.sprite.width / this.sprite.scale.y) / 2;
    this.label.y = 0;
  }
}
