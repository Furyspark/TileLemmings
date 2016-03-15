function BBox() {
  this.initialize.apply(this, arguments);
};
BBox.prototype.constructor = BBox;

Object.defineProperties(BBox.prototype, {
  spriteLeft: { get: function() { return this.owner.x - Math.abs(this.owner.offsetX); } },
  spriteRight: { get: function() { return this.owner.x + (Math.abs(this.owner.width) - Math.abs(this.owner.offsetX)); } },
  spriteTop: { get: function() { return this.owner.y - Math.abs(this.owner.offsetY); } },
  spriteBottom: { get: function() { return this.owner.y + (Math.abs(this.owner.height) - Math.abs(this.owner.offsetY)); } },
  left: { get: function() { return this.owner.x - 4; } },
  right: { get: function() { return this.owner.x + 4; } },
  top: { get: function() { return this.owner.y - 16; } },
  bottom: { get: function() { return this.owner.y; } }
});

BBox.prototype.initialize = function(owner) {
  this.owner = owner;
  this.initMembers();
};

BBox.prototype.initMembers = function() {
};
