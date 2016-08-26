function UI_CheckBox() {
  this.init.apply(this, arguments);
}

UI_CheckBox.prototype = Object.create(UI_Base.prototype);
UI_CheckBox.prototype.constructor = UI_CheckBox;

UI_CheckBox.prototype.init = function(position, label, value) {
  if(!position) position = new Point(0, 0);
  if(!label) label = "N/A";
  if(!value && value !== false) value = false;
  UI_Base.prototype.init.call(this);
  this.onToggle = new Signal();
  this.onClick = new Signal();
  this.onClick.add(this.toggle, this, [], 20);
  this.onClick.add(this.playSound_Click, this, [], 10);

  this.initAnimations();
  this.createLabel(label);
  this.setValue(value);

  this.x = position.x;
  this.y = position.y;
}

UI_CheckBox.prototype.setValue = function(value) {
  this.value = value;
  this.onToggle.dispatch([this.value]);
  this.refresh();
}

UI_CheckBox.prototype.toggle = function() {
  this.value = !this.value;
  this.onToggle.dispatch([this.value]);
  this.refresh();
}

UI_CheckBox.prototype.refresh = function() {
  if(this.value === true) this.sprite.playAnimation("marked");
  else if(this.value === false) this.sprite.playAnimation("unmarked");
  if(this.label) this.label.position.set(this.sprite.width, this.sprite.height / 2);
}

UI_CheckBox.prototype.initAnimations = function() {
  this.addAnimation("marked", "atlMainMenu", ["checkbox_marked.png"]);
  this.addAnimation("unmarked", "atlMainMenu", ["checkbox_unmarked.png"]);
  this.sprite.playAnimation("unmarked");
}

UI_CheckBox.prototype.createLabel = function(text) {
  this.label = new Text(text);
  this.label.style.fontSize = 14;
  this.label.anchor.set(0, 0.5);
  this.sprite.addChild(this.label);
}

UI_CheckBox.prototype.playSound_Click = function() {
  AudioManager.playSound("sndUI_Click");
}
