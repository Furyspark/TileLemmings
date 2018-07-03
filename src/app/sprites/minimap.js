function Sprite_Minimap() {
  this.initialize.apply(this, arguments);
};

Sprite_Minimap.prototype = Object.create(PIXI.Container.prototype);
Sprite_Minimap.prototype.constructor = Sprite_Minimap;

Sprite_Minimap.prototype.initialize = function() {
  PIXI.Container.call(this);
  this.interactive = false;
  this.addBackground();
  this.addMainSprite();
};

Sprite_Minimap.prototype.addBackground = function() {
  this.background = new PIXI.Graphics();
  this.background.beginFill(0x0);
  this.background.drawRect(0, 0, $gameMap.width * 16, $gameMap.height * 16);
  this.background.endFill();
  this.background.z = 2000;
  this.addChild(this.background);
};

Sprite_Minimap.prototype.updateMainTexture = function() {
  Core.renderer.render($gameMap.containers.map, this.mainTexture);
};

Sprite_Minimap.prototype.addMainSprite = function() {
  this.mainTexture = PIXI.RenderTexture.create($gameMap.width * 16, $gameMap.height * 16);
  this.mainSprite = new PIXI.Sprite(this.mainTexture);
  this.addChild(this.mainSprite);
};
