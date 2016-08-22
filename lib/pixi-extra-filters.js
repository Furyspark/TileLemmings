(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){


/**
* @author Julien CLEREL @JuloxRox
* original filter https://github.com/evanw/glfx.js/blob/master/src/filters/warp/bulgepinch.js by Evan Wallace : http://madebyevan.com/
*/

/**
* @filter Bulge / Pinch
* @description Bulges or pinches the image in a circle.
* @param center The x and y coordinates of the center of the circle of effect.
* @param radius The radius of the circle of effect.
* @param strength -1 to 1 (-1 is strong pinch, 0 is no effect, 1 is strong bulge)
*
* @class BulgePinchFilter
* @extends AbstractFilter
* @constructor
*/

function BulgePinchFilter() {
    PIXI.Filter.call(this,
        // vertex shader
       // vertex shader
        "#define GLSLIFY 1\nattribute vec2 aVertexPosition;\n\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void){\n\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n\n}\n\n",
            // fragment shader
        "#define GLSLIFY 1\nuniform float radius;\nuniform float strength;\nuniform vec2 center;\nuniform sampler2D uSampler;\nuniform vec4 dimensions;\nvarying vec2 vTextureCoord;\nvoid main()\n{\n    vec2 coord = vTextureCoord * dimensions.xy;\n    coord -= center;\n    float distance = length(coord);\n    if (distance < radius) {\n        float percent = distance / radius;\n        if (strength > 0.0) {\n            coord *= mix(1.0, smoothstep(0.0, radius /     distance, percent), strength * 0.75);\n        } else {\n            coord *= mix(1.0, pow(percent, 1.0 + strength * 0.75) * radius / distance, 1.0 - percent);\n        }\n    }\n    coord += center;\n    gl_FragColor = texture2D(uSampler, coord / dimensions.xy);\n    vec2 clampedCoord = clamp(coord, vec2(0.0), dimensions.xy);\n    if (coord != clampedCoord) {\n    gl_FragColor.a *= max(0.0, 1.0 - length(coord - clampedCoord));\n    }\n}\n"
    );
}

BulgePinchFilter.prototype = Object.create(PIXI.Filter.prototype);
BulgePinchFilter.prototype.constructor = BulgePinchFilter;
module.exports = BulgePinchFilter;

Object.defineProperties(BulgePinchFilter.prototype, {
    /**
     * The radius of the circle of effect.
     *
     * @property radius
     * @type Number
     */
    radius: {
        get: function ()
        {
            return this.uniforms.radius;
        },
        set: function (value)
        {
            this.uniforms.radius = value;
        }
    },
    /**
     * The strength of the effect. -1 to 1 (-1 is strong pinch, 0 is no effect, 1 is strong bulge)
     *
     * @property strength
     * @type Number
     */
    strength: {
        get: function ()
        {
            return this.uniforms.strength;
        },
        set: function (value)
        {
            this.uniforms.strength = value;
        }
    },
    /**
     * The x and y coordinates of the center of the circle of effect.
     *
     * @property center
     * @type Point
     */
    center: {
        get: function ()
        {
            return this.uniforms.center;
        },
        set: function (value)
        {
            this.uniforms.center = value;
        }
    }
});

},{}],2:[function(require,module,exports){


/**
 * ColorReplaceFilter, originally by mishaa, updated by timetocode
 * http://www.html5gamedevs.com/topic/10640-outline-a-sprite-change-certain-colors/?p=69966
 *
 * @class
 * @param originalColor {FloatArray32} The color that will be changed, as a 3 component RGB e.g. new Float32Array(1.0, 1.0, 1.0)
 * @param newColor {FloatArray32} The resulting color, as a 3 component RGB e.g. new Float32Array(1.0, 0.5, 1.0)
 * @param epsilon {float} Tolerance/sensitivity of the floating-point comparison between colors (lower = more exact, higher = more inclusive)
 *
 * @example
 *  // replaces true red with true blue
 *  someSprite.shader = new ColorReplaceFilter(
 *   new Float32Array([1, 0, 0]),
 *   new Float32Array([0, 0, 1]),
 *   0.001
 *  );
 *  // replaces the RGB color 220, 220, 220 with the RGB color 225, 200, 215
 *  someOtherSprite.shader = new ColorReplaceFilter(
 *   new Float32Array([220/255.0, 220/255.0, 220/255.0]),
 *   new Float32Array([225/255.0, 200/255.0, 215/255.0]),
 *   0.001
 *  );
 *
 */
function ColorReplaceFilter(originalColor, newColor, epsilon) {
    PIXI.Filter.call(this,
        // vertex shader
        // vertex shader
        "#define GLSLIFY 1\nattribute vec2 aVertexPosition;\n\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void){\n\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vTextureCoord = aTextureCoord;\n\n}\n\n",
        // fragment shader
        "#define GLSLIFY 1\nvarying vec2 vTextureCoord;\nuniform sampler2D texture;\nuniform vec3 originalColor;\nuniform vec3 newColor;\nuniform float epsilon;\nvoid main(void) {\n    vec4 currentColor = texture2D(texture, vTextureCoord);\n    vec3 colorDiff = originalColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));\n    float colorDistance = length(colorDiff);\n    float doReplace = step(colorDistance, epsilon);\n    gl_FragColor = vec4(mix(currentColor.rgb, (newColor + colorDiff) * currentColor.a, doReplace), currentColor.a);\n}\n"
    );

    this.uniforms.originalColor = originalColor;
    this.uniforms.newColor = newColor;
    this.uniforms.epsilon = epsilon;
};

ColorReplaceFilter.prototype = Object.create(PIXI.Filter.prototype);
ColorReplaceFilter.prototype.constructor = ColorReplaceFilter;
module.exports = ColorReplaceFilter;

Object.defineProperty(ColorReplaceFilter.prototype, 'originalColor', {
  set: function (value) {
    var r = ((value & 0xFF0000) >> 16) / 255,
        g = ((value & 0x00FF00) >> 8) / 255,
        b = (value & 0x0000FF) / 255;
    this.uniforms.originalColor = { x: r, y: g, z: b };
  }
});

Object.defineProperty(ColorReplaceFilter.prototype, 'newColor', {
  set: function (value) {
    var r = ((value & 0xFF0000) >> 16) / 255,
        g = ((value & 0x00FF00) >> 8) / 255,
        b = (value & 0x0000FF) / 255;
    this.uniforms.newColor = { x: r, y: g, z: b };
  }
});

Object.defineProperty(ColorReplaceFilter.prototype, 'epsilon', {
  set: function (value) {
    this.uniforms.epsilon = value;
  }
});

},{}],3:[function(require,module,exports){
/**
 * GlowFilter, originally by mishaa
 * http://www.html5gamedevs.com/topic/12756-glow-filter/?hl=mishaa#entry73578
 * http://codepen.io/mishaa/pen/raKzrm
 *
 * @class
 * @param viewWidth {number} The width of the view to draw to, usually renderer.width.
 * @param viewHeight {number} The height of the view to draw to, usually renderer.height.
 * @param outerStrength {number} The strength of the glow outward from the edge of the sprite.
 * @param innerStrength {number} The strength of the glow inward from the edge of the sprite.
 * @param color {number} The color of the glow.
 * @param quality {number} A number between 0 and 1 that describes the quality of the glow.
 *
 * @example
 *  someSprite.filters = [
 *      new GlowFilter(renderer.width, renderer.height, 15, 2, 1, 0xFF0000, 0.5)
 *  ];
 */
function GlowFilter(viewWidth, viewHeight, distance, outerStrength, innerStrength, color, quality) {
    PIXI.Filter.call(this,
        // vertex shader
        // vertex shader
        glslify('./glow.vert'),
        // fragment shader
        glslify('./glow.frag')
    );

    this.uniforms.distance = distance;
    this.uniforms.glowColor = new Float32Array([0, 0, 0, 1]);

    quality = Math.pow(quality, 1/3);
    this.quality = quality;

    this.uniforms.distance.value *= quality;

    viewWidth *= quality;
    viewHeight *= quality;

    this.color = color;
    this.outerStrength = outerStrength;
    this.innerStrength = innerStrength;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
};

GlowFilter.prototype = Object.create(PIXI.Filter.prototype);
GlowFilter.prototype.constructor = GlowFilter;
module.exports = GlowFilter;

Object.defineProperties(GlowFilter.prototype, {
    color: {
        get: function () {
            return PIXI.utils.rgb2hex(this.uniforms.glowColor);
        },
        set: function(value) {
            PIXI.utils.hex2rgb(value, this.uniforms.glowColor);
        }
    },

    outerStrength: {
        get: function () {
            return this.uniforms.outerStrength;
        },
        set: function (value) {
            this.uniforms.outerStrength = value;
        }
    },

    innerStrength: {
        get: function () {
            return this.uniforms.innerStrength;
        },
        set: function (value) {
            this.uniforms.innerStrength = value;
        }
    },

    viewWidth: {
        get: function () {
            return 1 / this.uniforms.pixelWidth;
        },
        set: function(value) {
            this.uniforms.pixelWidth = 1 / value;
        }
    },

    viewHeight: {
        get: function () {
            return 1 / this.uniforms.pixelHeight;
        },
        set: function(value) {
            this.uniforms.pixelHeight = 1 / value;
        }
    }
});

},{}],4:[function(require,module,exports){


/**
 * OutlineFilter, originally by mishaa
 * http://www.html5gamedevs.com/topic/10640-outline-a-sprite-change-certain-colors/?p=69966
 * http://codepen.io/mishaa/pen/emGNRB
 *
 * @class
 * @param viewWidth {number} The width of the view to draw to, usually renderer.width.
 * @param viewHeight {number} The height of the view to draw to, usually renderer.height.
 * @param thickness {number} The tickness of the outline.
 * @param color {number} The color of the glow.
 *
 * @example
 *  someSprite.shader = new OutlineFilter(renderer.width, renderer.height, 9, 0xFF0000);
 */
function OutlineFilter(viewWidth, viewHeight, thickness, color) {
    thickness = thickness || 1;
    PIXI.Filter.call(this,
        // vertex shader
        // vertex shader
        "#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nvarying vec2 vTextureCoord;\n\nvoid main(void){\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}\n",
        // fragment shader
        "#define GLSLIFY 1\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\n\nuniform float thickness;\nuniform vec4 outlineColor;\nuniform float pixelWidth;\nuniform float pixelHeight;\nvec2 px = vec2(pixelWidth, pixelHeight);\n\nvoid main(void) {\n    const float PI = 3.14159265358979323846264;\n    vec4 ownColor = texture2D(uSampler, vTextureCoord);\n    vec4 curColor;\n    float maxAlpha = 0.;\n    for (float angle = 0.; angle < PI * 2.; angle += %THICKNESS% ) {\n        curColor = texture2D(uSampler, vec2(vTextureCoord.x + thickness * px.x * cos(angle), vTextureCoord.y + thickness * px.y * sin(angle)));\n        maxAlpha = max(maxAlpha, curColor.a);\n    }\n    float resultAlpha = max(maxAlpha, ownColor.a);\n    gl_FragColor = vec4((ownColor.rgb + outlineColor.rgb * (1. - ownColor.a)) * resultAlpha, resultAlpha);\n}\n".replace(/%THICKNESS%/gi, (1.0 / thickness).toFixed(7))
    );

    this.uniforms.pixelWidth = 1 / (viewWidth || 1);
    this.uniforms.pixelHeight = 1 / (viewHeight || 1);
    this.uniforms.thickness = thickness;
    this.uniforms.outlineColor = new Float32Array([0, 0, 0, 1]);
    if (color) {
        this.color = color;
    }
};

OutlineFilter.prototype = Object.create(PIXI.Filter.prototype);
OutlineFilter.prototype.constructor = OutlineFilter;
module.exports = OutlineFilter;

Object.defineProperties(OutlineFilter.prototype, {
    color: {
        get: function () {
            return PIXI.utils.rgb2hex(this.uniforms.outlineColor);
        },
        set: function (value) {
            PIXI.utils.hex2rgb(value, this.uniforms.outlineColor);
        }
    },

    viewWidth: {
        get: function () {
            return 1 / this.uniforms.pixelWidth;
        },
        set: function(value) {
            this.uniforms.pixelWidth = 1 / value;
        }
    },

    viewHeight: {
        get: function () {
            return 1 / this.uniforms.pixelHeight;
        },
        set: function(value) {
            this.uniforms.pixelHeight = 1 / value;
        }
    }
});

},{}],5:[function(require,module,exports){
/**
* SimpleLightmap, originally by Oza94
* http://www.html5gamedevs.com/topic/20027-pixijs-simple-lightmapping/
* http://codepen.io/Oza94/pen/EPoRxj
*
* @class
* @param lightmapTexture {PIXI.Texture} a texture where your lightmap is rendered
* @param ambientColor {Array} An RGBA array of the ambient color
* @param [resolution] {Array} An array for X/Y resolution
*
* @example
*  var lightmapTex = new PIXI.RenderTexture(renderer, 400, 300);
*
*  // ... render lightmap on lightmapTex
*
*  stageContainer.filters = [
*    new SimpleLightmapFilter(lightmapTex, [0.3, 0.3, 0.7, 0.5], [1.0, 1.0])
*  ];
*/
function SimpleLightmapFilter(lightmapTexture, ambientColor, resolution) {
    PIXI.Filter.call(this,
        // vertex shader
        // vertex shader
        glslify('./simpleLightmap.vert'),
        // fragment shader
        glslify('./simpleLightmap.frag')
    );
    this.uniforms.u_lightmap = lightmapTexture;
    this.uniforms.resolution = new Float32Array(resolution || [1.0, 1.0]);
    this.uniforms.ambientColor =  new Float32Array(ambientColor);
}

SimpleLightmapFilter.prototype = Object.create(PIXI.Filter.prototype);
SimpleLightmapFilter.prototype.constructor = SimpleLightmapFilter;

Object.defineProperties(SimpleLightmapFilter.prototype, {
    texture: {
        get: function () {
            return this.uniforms.u_lightmap;
        },
        set: function (value) {
            this.uniforms.u_lightmap = value;
        }
    },
    color: {
        get: function () {
            return this.uniforms.ambientColor;
        },
        set: function (value) {
            this.uniforms.ambientColor = new Float32Array(value);
        }
    },
    resolution: {
        get: function () {
            return this.uniforms.resolution;
        },
        set: function (value) {
            this.uniforms.resolution = new Float32Array(value);
        }
    }
});

module.exports = SimpleLightmapFilter;

},{}],6:[function(require,module,exports){
module.exports = {
    GlowFilter: require('./filters/glow/GlowFilter'),
    OutlineFilter: require('./filters/outline/OutlineFilter'),
    BulgePinchFilter: require('./filters/bulgepinch/BulgePinchFilter'),
    ColorReplaceFilter: require('./filters/colorreplace/ColorReplaceFilter'),
    SimpleLightmapFilter:
        require('./filters/simplelightmap/SimpleLightmapFilter')
};

for (var filter in module.exports) {
    PIXI.filters[filter] = module.exports[filter];
}

},{"./filters/bulgepinch/BulgePinchFilter":1,"./filters/colorreplace/ColorReplaceFilter":2,"./filters/glow/GlowFilter":3,"./filters/outline/OutlineFilter":4,"./filters/simplelightmap/SimpleLightmapFilter":5}]},{},[6])


//# sourceMappingURL=pixi-extra-filters.js.map
