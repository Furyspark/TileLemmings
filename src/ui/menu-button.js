function UI_MenuButton() {
  this.init.apply(this, arguments);
}

UI_MenuButton.prototype = Object.create(UI_Button.prototype);
UI_MenuButton.prototype.constructor = UI_MenuButton;

UI_MenuButton.prototype.init = function(position, label, frames, downFrames) {
  if(!frames) frames = ["button_blue.png"];
  if(!downFrames) downFrames = ["button_blue_down.png"];
  UI_Button.prototype.init.call(this);
  this.label.text = label;
  this.label.style.align = "center";
  this.label.anchor.set(0.5, 0.5);

  this.addAnimation("idle", "atlMainMenu", frames);
  this.sprite.playAnimation("idle");
  this.addAnimation("down", "atlMainMenu", downFrames);
  this.x = position.x;
  this.y = position.y;

  this.onClick.add(this.playSound_Click, this, [], 10);
}

UI_MenuButton.prototype.refresh = function() {
  if(this.label) {
    this.label.x = (this.sprite.width / this.sprite.scale.y) / 2;
    this.label.y = (this.sprite.height / this.sprite.scale.y) / 2;
  }
}

UI_MenuButton.prototype.click = function() {
  UI_Button.prototype.click.call(this);
  this.sprite.playAnimation("down");
}

UI_MenuButton.prototype.release = function() {
  UI_Button.prototype.release.call(this);
  this.sprite.playAnimation("idle");
}

UI_MenuButton.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}
