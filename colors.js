var crc32 = require('./crc32'),
    brewer = require('./colorbrewer.js'),
    _ = require('underscore');

/*
 * colors.js -- Ported from:
 * colors.py: Utilities for reading and creating ColorSchemes
 * 
 * ColorSchemes define colors for a set of n classes.
 *     - n is limited to 256 classes
 *     - The color scheme is represented as a list ('colors') of 3byte colors.
 *       colors[0] is the color for the Background class and is generally (0,0,1)
 *       colors[1] is the color for the Borders class and is generally black (0,0,0)
 *       colors[i] is the color for the i'th class.
 *     - tRNS: ColorSchemes also define the Alpha values associated with each color.
 *         Each color in the color scheme is assign a value between 0 and 255.
 *         The default is 255 which means fully opaque.
 *         The background is generally given a value of 0, fully transparent.
 *         Any color not listed in the tRNS array is assumed to be fully opaque.
 *         This is why the background is first, since it is generally the only class
 *         we care to make transparent, we save space by have only one element in the array.
 *         We also save CPU time since we can cache and reuse the same tRNS chunk in each image.
 * 
 *         This can be manipulated for interesting effects, e.g.
 *             Assign all classes the color #000001 except one.
 *             Set the transparency on #000001 to 153 (~60%).
 *             The result will be that the single class not coded #000001 will standout,
 *             the other classes will be masked in grey.
 *             Problems arise from BLANK tiles which are by default fully transparent.
 *     
 *         tRNS is a string of bytes (alpha values) one for each color in the palette
 *         It needs to be packed into a PNG chunk.
 *         if no tRNS is provied the default is used.
 *         assert tRNS == None OR len(tRNS) == n
 *     
 *     - PLTE: PLTE refers the packed representation of the color scheme.
 *         It is a list of bytes, each 3 bytes represents one color.
 *         The 1st 3 bytes are the Red, Green and Blue values for the 1st class (background)
 *         The 2nd 3 bytes are the Red, Green and Blue values for the 2nd class (borders)
 *         The i'th 3 bytes are the Red, Green and Blue values for the i'th class...
 *         It needs to be packed into a PNG chunk
 */

findBrewer = function(n) {
    var names = [],
        name;
    for (var name in brewer) {
        if (brewer[name][n]) names.push(name);
    }
    return names;
};
colorBrewer = function(name, n, flip) {
    var base = [[0,0,1],[60,60,60],[255,255,0]],
        alphas = [0, 255, 255],
        colors;
    if (brewer.hasOwnProperty(name)){
        if (brewer[name][n]) {
            colors = brewer[name][n].slice();
            if (!!flip) {
                colors.reverse();
            }
            return fromArray(base.concat(colors), alphas);
        }
    }
    throw "Could not find \""+name+"\" with \""+n+"\" classes";
};
borders = function(width, color, alpha) {
    width = (width > 0 && width <=10) ? width : 1;
    color = color || [60,60,60];
    alpha = alpha || 255;
    var colors = [[0,0,1], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]],
        alphas = [0,0,0,0,0,0,0,0,0,0,0,0],
        i;
    for (i=1; i<=width; i++) {
        colors[i] = color
        alphas[i] = alpha;
    }
    return fromArray(colors, alphas);
};
fromArray = function(colors, alphas) {
    var c = colors.slice(),
        a = alphas ? alphas.slice() : [];
    return {
        get_color: function(clid) {
            if (clid == -1) return [255,255,0];
            return c[clid] || [0,0,0];
        },
        set_color: function(clid, color) {
            c[clid] = color;
        },
        get_alpha: function(clid) {
            return (a[clid] == undefined) ? 255 : a[clid];
        },
        set_alpha: function(clid, alpha) {
            a[clid] = alpha;
        },
        colors: function(){
            return c;
        },
        alphas: function(){
            return a;
        }
    }
}
var ColorScheme = {
    get_color: function(clid) {
    },
    set_color: function(clid) {
    },
    get_colors: function(){
    }
};

var ColorScheme = function(colors, alphas){
    var o = {
        get_alphas: function (){
            return this.__alphas;
        },
        set_alphas: function(value){
            if (value == undefined) {
                this.__alphas = _.map(this.__colors, function() {return 255;});
                this.__alphas[0] = 0;
            } else {
                this.__alphas = value;
            }
        },
        get_color: function (cl) {
            return this.__colors[cl] || [0,0,0];
        },
        set_color: function (cl, color) {
            this.__colors[cl] = color;
        },
        get_alpha: function(cl) {
            return (this.__alphas[cl]==undefined) ? 255 : this.__alphas[cl];
        },
        alphas: function(){
            return this.__alphas;
        },
        colors: function(){
            return this.__colors;
        },
        n: function(){
            return this.__colors.length;
        },
    }
    o.__colors = colors;
    o.set_alphas(alphas);
    return o;
};

var RandomColor = function(){
    return [Math.floor(Math.random()*255),
        Math.floor(Math.random()*255),
        Math.floor(Math.random()*255)];
};
var RandomColors = function(N){
    var colors = new Array(N+3);
    colors[0] = [0,0,1];
    colors[1] = [0,0,0];
    colors[2] = [0,255,255];
    for (var i=3; i<N+3; i++) {
        colors[i] = RandomColor();
    }
    return ColorScheme(colors);
};

module.exports.RandomColors = RandomColors;
module.exports = {
    RandomColors: RandomColors,
    colorBrewer: colorBrewer,
    findBrewer: findBrewer,
    fromColorList: fromArray,
    borders: borders
}
/*
def random(N_colors, background=(0,0,1), borders=(0,0,0),alphas=[0]):
    colors = set()
    while len(colors) < N_colors:
        colors.add((choice(WEB_SAFE_COLORS), choice(WEB_SAFE_COLORS), choice(WEB_SAFE_COLORS)))
    colors = [background,borders]+list(colors)
    return ColorScheme(colors,alphas)
def fade(steps=1, left=(255,0,0), right=(0,0,255), background=(0,0,1), borders=(0,0,0)):
    colors = [background,borders]
    if steps == 1:
        #just return averages
        sr,sg,sb = [(r-l)/(2) for r,l in zip(right,left)]
        r, g, b = left
        r += sr
        g += sg
        b += sb
    else:
        #step
        sr,sg,sb = [(r-l)/(steps-1) for r,l in zip(right,left)]
        r, g, b = left
    colors.append((r,g,b))
    for i in xrange(1,steps-1):
        r += sr
        g += sg
        b += sb
        colors.append((r,g,b))
    colors.append(right)
    return ColorScheme(colors)
    

    
*/
