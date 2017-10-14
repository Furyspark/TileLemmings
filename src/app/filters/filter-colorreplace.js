function Filter_ColorReplace() {
  this.initialize.apply(this, arguments);
}

Filter_ColorReplace.prototype = Object.create(PIXI.Filter.prototype);
Filter_ColorReplace.prototype.constructor = Filter_ColorReplace;

Object.defineProperties(Filter_ColorReplace.prototype, {
  findColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value &0x0000ff) / 255;
      this.uniforms.findColor[0] = r;
      this.uniforms.findColor[1] = g;
      this.uniforms.findColor[2] = b;
      this.dirty = true;
    }
  },
  replaceWithColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value &0x0000ff) / 255;
      this.uniforms.replaceWithColor[0] = r;
      this.uniforms.replaceWithColor[1] = g;
      this.uniforms.replaceWithColor[2] = b;
      this.dirty = true;
    }
  },
  range: {
    set: function(value) {
      this.uniforms.range = value;
      this.dirty = true;
    }
  }
});

Filter_ColorReplace.prototype.initialize = function(findColor, replaceWithColor, range) {
  if(range === undefined) range = 0.0000000001;

  var frag = [
    "precision mediump float;",
    "varying vec2 vTextureCoord;",
    "uniform sampler2D texture;",
    "uniform vec3 findColor;",
    "uniform vec3 replaceWithColor;",
    "uniform float range;",

    "void main() {",
    "vec4 currentColor = texture2D(texture, vTextureCoord);",
    "vec3 colorDiff = findColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));",
    "float colorDistance = length(colorDiff);",
    "float doReplace = step(colorDistance, range);",
    "gl_FragColor = vec4(mix(currentColor.rgb, (replaceWithColor + colorDiff) * currentColor.a, doReplace), currentColor.a);",
    "}"
  ].join("\n");
  PIXI.Filter.call(this, null, frag);

  this.findColor = findColor;
  this.replaceWithColor = replaceWithColor;
  this.range = range;
}
