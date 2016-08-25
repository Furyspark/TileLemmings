function Text() {
  this.init.apply(this, arguments);
}

Text.prototype = Object.create(PIXI.Text.prototype);
Text.prototype.constructor = Text;

Text.defaultStyle = {
  fill: "white",
  stroke: "black",
  strokeThickness: 4
};

Text.prototype.init = function(text, style) {
  if(!text) text = "";
  if(!style) style = Text.defaultStyle;
  PIXI.Text.prototype.constructor.call(this, text, style);
}
