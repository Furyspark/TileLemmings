PIXI.addons.filters.ColorReplace = function(findColor, replaceColor, range) {
  PIXI.AbstractFilter.call(this);

  this.uniforms = {
    findColor: { type: "3f", value: null },
    replaceColor: { type: "3f", value: null },
    range: { type: "1f", value: null }
  };

  this.findColor    = findColor;
  this.replaceColor = replaceColor;
  this.range        = range;

  this.passes = [this];

  this.fragmentSrc = [
    'precision mediump float;',
    'varying vec2 vTextureCoord;',
    'uniform sampler2D texture;',
    'uniform vec3 findColor;',
    'uniform vec3 replaceColor;',
    'uniform float range;',
    'void main(void) {',
    '  vec4 currentColor = texture2D(texture, vTextureCoord);',
    '  vec3 colorDiff = findColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));',
    '  float colorDistance = length(colorDiff);',
    '  float doReplace = step(colorDistance, range);',
    '  gl_FragColor = vec4(mix(currentColor.rgb, (replaceColor + colorDiff) * currentColor.a, doReplace), currentColor.a);',
    '}'
  ];
}

PIXI.addons.filters.ColorReplace.prototype = Object.create(PIXI.AbstractFilter.prototype);
PIXI.addons.filters.ColorReplace.prototype.constructor = PIXI.addons.filters.ColorReplace;

Object.defineProperties(PIXI.addons.filters.ColorReplace.prototype, {
  findColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value & 0x0000ff) / 255;
      this.uniforms.findColor.value = { x: r, y: g, z: b };
      this.dirty = true;
    }
  },
  replaceColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value & 0x0000ff) / 255;
      this.uniforms.replaceColor.value = { x: r, y: g, z: b };
      this.dirty = true;
    }
  },
  range: {
    set: function(value) {
      this.uniforms.range.value = value;
      this.dirty = true;
    }
  }
});
