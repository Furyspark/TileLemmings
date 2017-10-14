PIXI.addons.filters.ColorReplace = function(originalColor, newColor, epsilon) {
  PIXI.Filter.call(this);

  this.uniforms = {
    originalColor: { type: "3f", value: null },
    newColor: { type: "3f", value: null }
    // epsilon: { type: "1f", value: null }
  };

  this.originalColor = originalColor;
  this.newColor = newColor;
  // this.epsilon = epsilon;

  // this.passes = [this];

  this.vertexSrc = [
    // "attribute vec3 in_Position;                  // (x,y,z)",
    // //attribute vec3 in_Normal;                  // (x,y,z)     unused in this shader.
    // "attribute vec4 in_Colour;                    // (r,g,b,a)",
    // "attribute vec2 in_TextureCoord;              // (u,v)",
    // "varying vec2 v_vTexcoord;",
    // "varying vec4 v_vColour;",
    // "void main()",
    // "{",
    //     "vec4 object_space_pos = vec4( in_Position.x, in_Position.y, in_Position.z, 1.0);",
    //     "gl_Position = gm_Matrices[MATRIX_WORLD_VIEW_PROJECTION] * object_space_pos;",
    //     "v_vColour = in_Colour;",
    //     "v_vTexcoord = in_TextureCoord;",
    // "}"
    "attribute vec3 vertex;",
    "attribute vec3 normal;",
    "attribute vec2 uv1;",
    "attribute vec4 tangent;",
    "uniform mat4 _mv;",
    "uniform mat4 _mvProj;",
    "uniform mat3 _norm;",
    "uniform float _time;",
    "varying vec2 uv;",
    "varying vec3 n;",
    "void main(void) {",
      "gl_Position = _mvProj * vec4(vertex, 1.0);",
      "uv = uv1;",
      "n = normalize(_norm * normal);",
    "}"
  ].join("\n");

  this.fragmentSrc = [
    'precision mediump float;',
    // 'varying vec2 vTextureCoord;',
    'varying vec3 n;',
    'varying vec2 uv;',
    // 'uniform sampler2D texture;',
    'uniform sampler2D tex;',
    'uniform vec3 originalColor;',
    'uniform vec3 newColor;',
    'uniform float epsilon;',
    'void main(void) {',
      "vec3 eyeSpaceLightDirection = vec3(0.0,0.0,1.0);",
      "float diffuse = max(0,dot(normalize(n),eyeSpaceLightDirection));",
      "gl_FragColor = vec4(texture2D(tex,uv).xyz*diffuse,1.0);",
      // "if (gl_FragColor.r < 0.2 && gl_FragColor.b < 0.2)",
      //   "gl_FragColor = vec4(originalColor.rgb * gl_FragColor.g, 1.0);",
      // "else if (abs(gl_FragColor.r - gl_FragColor.b) < 0.3 && gl_FragColor.g == 0.0)",
      //   "gl_FragColor = vec4(newColor.rgb * gl_FragColor.r, 1.0);",
    // '  vec4 currentColor = texture2D(texture, vTextureCoord);',
    // '  currentColor.xyz = mix(currentColor.xyz, newColor.xyz, 0.1);',
    // '  gl_FragColor = vec4(currentColor.x, currentColor.y, currentColor.z, currentColor.a);',
    // '  vec3 colorDiff = originalColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));',
    // '  float colorDistance = length(colorDiff);',
    // '  float doReplace = step(colorDistance, epsilon);',
    // // '  gl_FragColor = vec4(mix(currentColor.rgb, (newColor + colorDiff) * currentColor.a, doReplace), currentColor.a);',
    // '  gl_FragColor = vec4(mix(currentColor.rgb, (newColor + colorDiff) * currentColor.a, doReplace), currentColor.a);',
    '}'
    // "uniform vec4 f_colour;",
    // "varying vec2 v_vTexcoord;",
    // "varying vec4 v_vColour;",
    // "void main()",
    // "{",
    //     "vec4 col = texture2D( gm_BaseTexture, v_vTexcoord );",
    //     "col.rgb = mix(col.rgb, f_colour.rgb, f_colour.a);",
    //     "gl_FragColor = v_vColour * col;",
    // "}"
  ].join("\n");
}

PIXI.addons.filters.ColorReplace.prototype = Object.create(PIXI.Filter.prototype);
PIXI.addons.filters.ColorReplace.prototype.constructor = PIXI.addons.filters.ColorReplace;

Object.defineProperties(PIXI.addons.filters.ColorReplace.prototype, {
  originalColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value & 0x0000ff) / 255;
      this.uniforms.originalColor.value = { x: r, y: g, z: b };
      this.dirty = true;
    }
  },
  newColor: {
    set: function(value) {
      var r = ((value & 0xff0000) >> 16) / 255;
      var g = ((value & 0x00ff00) >> 8) / 255;
      var b = (value & 0x0000ff) / 255;
      this.uniforms.newColor.value = { x: r, y: g, z: b };
      this.dirty = true;
    }
  }
  // epsilon: {
  //   set: function(value) {
  //     this.uniforms.epsilon.value = value;
  //     this.dirty = true;
  //   }
  // }
});
