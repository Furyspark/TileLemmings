function Text() { this.initialize.apply(this, arguments); };

Text.prototype = Object.create(PIXI.Text.prototype);
Text.prototype.constructor = Text;

Text.defaultStyle = {
  fill: "white",
  stroke: "black",
  strokeThickness: 2,
  fontSize: 24
};

Text.prototype.initialize = function(text, style) {
  if(!text) text = "";
  if(!style) style = Text.defaultStyle;
  PIXI.Text.call(this, text, style);
  this.z = 0;
};
