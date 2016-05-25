var Struct = require('./libs/jspack/code/struct.js');

function make_a2s(CHUNK_SIZE) {
    // Optimal Chunk size was determined emprically.
    // It peaks around
    //      150 in Safari 6.1.4
    //      250 in Chrome 35
    //      Need to test others.
    //  Based on Safari and chrome,
    //      roughly 215 was optimal
    //      but idealy we'd set this based on the browser at runtime.
    var chunk = new Array(CHUNK_SIZE),
        body = ""; 
    for (var i=0; i<CHUNK_SIZE; i++) {
        chunk[i] = 'a[i++]';
    }   
    body = "var CHUNK_SIZE="+CHUNK_SIZE+", out='', i = 0; while (i < a.length - a.length % CHUNK_SIZE) { out+=String.fromCharCode.call(null,";
    body+= chunk;
    body+= ");} while (i < a.length) { out+=String.fromCharCode(a[i++]); } return out;"
    return new Function('a', body)
}   


module.exports = {
    normalizeGoogleCoord: function(coord, zoom){
        var x = coord.x,
            y = coord.y,
            r = 1 << zoom;
        if (y < 0 || y >= r) {
            return null;
        }
        if (x < 0 || x >= r) { 
            //x = (x % r + r) % r;
            // see note in maps.overlay.js
            // Our tile store breaks when we allow repeat along X
            return null;
        }
        return {x:x, y:y};
    },
    pack : function(fmt, values) {
        /* util method, pack to string buffers. */
        var a = Struct.Pack(fmt, values);
        return Struct.Unpack(a.length+'s', a)[0];
    },
    unpack : function(fmt, value) {
        // Create an "octect" array
        var a = Struct.Pack(value.length+'c', value);
        return Struct.Unpack(fmt, a);
    },
    a2s : make_a2s(215)
}
