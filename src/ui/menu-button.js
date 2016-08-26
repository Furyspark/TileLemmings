function UI_MenuButton() {
  this.init.apply(this, arguments);
}

UI_MenuButton.prototype = Object.create(UI_Button.prototype);
UI_MenuButton.prototype.constructor = UI_MenuButton;

UI_MenuButton.prototype.init = function(position, label, frames) {
  if(!frames) frames = ["button_blue.png"];
  UI_Button.prototype.init.call(this);
  this.label.text = label;
  this.label.style.align = "center";
  this.label.anchor.set(0.5, 0.5);

  this.addAnimation("idle", "atlMainMenu", frames);
  this.sprite.playAnimation("idle");
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

UI_MenuButton.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}
