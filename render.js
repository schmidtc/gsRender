var b64 = require('./libs/base64/base64.js'),
    pako = require('./libs/pako/pako.js'),
    crc32 = require('./crc32.js'),
    calc = require('./libs/zlib.js/crc32.min.js').Zlib.CRC32.calc,
    Struct = require('./libs/jspack/code/struct.js'),
    colors = require('./colors.js'),
    utils = require('./utils.js'),
    zlib0 = require('./zlib0.js'),
    _ = require('underscore');

var PNG_SIGNATURE = '\x89PNG\r\n\x1a\n',
    PLTE_HEAD = '\x00\x00\x00\rIHDR\x00\x00\x01\x00\x00\x00\x01\x00\x08\x03\x00\x00\x00k\xacXT',
    IEND = '\x00\x00\x00\x00IEND\xaeB`\x82',
    BLANK = '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82',
    SINGLEHEAD ='\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x01\x00\x00\x00\x01\x00\x01\x03\x00\x00\x00f\xbc:%',
    SINGLETAIL ='\x00\x00\x00\x1fIDATx^\xed\xc0\x01\t\x00\x00\x00\xc20\xfb\xa76\xc7a[\x1c\x00\x00\x00\x00\x00\x00\x00\xc0\x01!\x00\x00\x01\x83e\x0f\xe4\x00\x00\x00\x00IEND\xaeB`\x82';

var Render = (function () {
    /* Javascript port of python dynTileMapper.render
     *
     */
    var pack = utils.pack,
        unpack = utils.unpack,
        PLTE = function(colors){
            //""" Pack a list of colors into a PNG PLTE chunk
            //    >>> PLTE( [(0,0,1),(0,0,0),(255,0,0),(0,0,255)] )
            //"""
            //var s = _.flatten(colors);
            var s = [];
            for (var i=0; i < colors.length; i++) {
                s.push(colors[i][0]);
                s.push(colors[i][1]);
                s.push(colors[i][2]);
            }
            var crc = calc([80,76,84,69].concat(s)); // 'PLTE'+s
            s = String.fromCharCode.apply(null, s);
            //s = pack('!'+s.length+'B', s);
            var size = pack('!I', [s.length]);
            //var crc = pack('!I', Zlib.crc32('PLTE'+s) & 0xFFFFFFFF) 
            //var crc = crc32('PLTE'+s);
            crc = pack('!I', [crc]);
            return size+'PLTE'+s+crc
        },
        getPLTE = function(CS, idx){
            /*  given the supplied CS and class ID index list, return a new PLTE to match
             */
            var c = _.map(idx, CS.get_color, CS);
            return PLTE(c);
        },
        tRNS = function(alphas){
            //""" Pack a list of alpha values into a PNG tRNS chunk
            //    The alpha value for class i == alpha[i], and should be <= 255
            //    255 == opaque
            //      0 == transparent
            //    >>> tRNS( [0] )
            //"""
            if (!alphas) {
                return '\x00\x00\x00\x01tRNS\x00@\xe6\xd8f'; //background = 0
            }
            var s = String.fromCharCode.apply(null, alphas),
                crc = calc([116, 82, 78, 83].concat(alphas)),
                size = pack('!I', [s.length]),
                crc = pack('!I', [crc]);
            return size+'tRNS'+s+crc
        };
        get_tRNS = function(CS, idx){
            var a = _.map(idx, CS.get_alpha, CS);
            return tRNS(a);
        },
        render_single = function(C, CS, dat, width, height) {
            var idx = [C.get_class(dat)];
            return SINGLEHEAD + getPLTE(CS, idx) + get_tRNS(CS, idx) + SINGLETAIL;
        },
        a2s = function(a){
            var s = '', i = 0, CHUNK = 25000;
            if (a instanceof Array) {
                for (i=0; i<a.length; i+=CHUNK) {
                    var len = CHUNK;
                    if (i+len > a.length) len = a.length - i;
                    s += String.fromCharCode.apply(null, a.slice(i,i+len));
                }
            } else {
                for (i=0; i<a.length; i+=CHUNK) {
                    var len = CHUNK;
                    if (i+len > a.length) len = a.length - i;
                    s += String.fromCharCode.apply(null, new Uint8Array(a.buffer,i,len));
                }
            }
            return s;
        },
        chunk = function(type, data) {
            /* packs a PNG chunk */
            var size = pack("!I", [data.length]),
                itype = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)],
                crc;
            if (data instanceof Uint8Array) {
                crc = new Uint8Array(itype.length+data.length);
                crc.set(itype, 0);
                crc.set(data, 4);
                crc = pack("!I", [calc(crc)]);
            } else {
                crc = pack("!I", [calc(itype.concat(data))]);
            }
            return size+type+utils.a2s(data)+crc;
        },
        load_raster = function(tile) {
            var dat = tile.dat,
                order = unpack('B',dat[0])[0] == 0 ? '<' : '>',
                dtype = (dat[1] == '\x00') ? 'H' : 'L',
                a = Struct.Unpack(order+256*256+dtype, pako.inflate(dat.slice(2)));
            tile.a = a;
            return tile
        },
        render_raster = function(C, CS, tile, width, height) {
            var a = tile.a,
                plte_ihdr = PLTE_HEAD,
                s = new Array(256*257),
                i = 0;
            for (i=0; i < 256; i++) {
                s[i*257] = 0;
                for (var j=1; j < 257; j++) {
                    s[i*257 + j] = C.get_class(a[i*256 + j - 1]);
                }
            }
            //s = zlib0.deflate0(s, true);
            s = pako.deflate(s, {level:0, memLevel:5});

            if (height != width || height != 256) {
                plte_ihdr = ihdr(width, height);
            }

            return PNG_SIGNATURE
                + plte_ihdr
                + PLTE(CS.colors())
                + tRNS(CS.alphas())
                + chunk('IDAT', s)
                + IEND
        },
        load_plte = function(tile) {
            var dat = tile.dat,
                order = unpack('B',dat[0])[0] == 0 ? '<' : '>',
                lenRaster = unpack('!L', dat.slice(1,5))[0],
                lenPLTE = unpack('!L', dat.slice(5,9))[0],
                idat_size = unpack('!I', dat.slice(9,13))[0],
                b = pako.inflate(dat.slice(9+lenRaster)); // this in the PLTE
            tile.b = Struct.Unpack(order+Math.floor(b.length/4)+'L', b);
            tile.raster = dat.slice(9, 9+lenRaster);
            //this is used to query the region id.
            tile.idat = pako.inflate(dat.slice(17, 17+idat_size));
            return tile;
        },
        render_plte = function(C, CS, tile, width, height) {
            var classIDs,
                PLTE,
                tRNS,
                plte_ihdr;
            classIDs = _.map(tile.b, function(i) { return C.get_class(i); });
            PLTE = getPLTE(CS, classIDs);
            tRNS = get_tRNS(CS, classIDs);
            if (height == width && height == 256) {
                plte_ihdr = PLTE_HEAD;
            } else {
                plte_ihdr = ihdr(width, height);
            }
            return PNG_SIGNATURE+plte_ihdr+PLTE+tRNS+tile.raster+IEND;
        };
    return ({
        overview: function(N, tile, width, height, C, CS){
            /* Primary render function
             *
             * Arguments:
             *  N -- int -- Number of classes in classification
             *  typ -- {'A', 'B', 'C', 'D'} -- Type of tile
             *      -- 'A' or 0 -- blank
             *      -- 'B' or 1 -- singleton
             *      -- 'C' or 2 -- raster
             *      -- 'D' or 3 -- PLTE
             *  dat -- str -- tile data
             *  width -- int -- default 256
             *  height -- int -- default 256
             *  C -- Classification -- default is randomized
             *  CS -- ColorScheme -- default is fade
             *
             * Returns:
             *  PNG -- str -- should be Base64 encoded
             */
            width = width || 256;
            height = height || 256;
            C = C || Classification.random(N, 40);
            CS = CS || RandomColors(N);
            switch (tile.typ) {
                case 0:
                case 'A':
                case 1:
                case 'B':
                    return render_single(C, CS, tile.dat, width, height);
                    break;
                case 2:
                case 'C':
                    return render_raster(C, CS, tile, width, height);
                    break;
                case 3:
                case 'D':
                    return render_plte(C, CS, tile, width, height);
                    break;
                default:
                    throw new Error("Unknowned Tile Type");
                    break;
            }
        },
        load: function(tile) {
            tile.dat = b64.decode(tile.dat)
            switch (tile.typ) {
                case 'A':
                    tile.dat = 0;
                    break;
                case 'B':
                    tile.dat = parseInt(tile.dat);
                    break;
                case 'C':
                    tile = load_raster(tile);
                    break;
                case 'D':
                    tile = load_plte(tile);
                    break;
                default:
                    throw new Error("Unknowned Tile Type");
                    break;
            }
            return tile;
        }
    });
}());

module.exports = {
    Render: function(N, tile, width, height, C, CS){
        return 'data:image/png;base64,' + b64.encode(Render.overview(N, tile, width, height, C, CS));
    },
    load: Render.load
};
