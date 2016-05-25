var calc = require('./libs/zlib.js/crc32.min.js').Zlib.CRC32.calc;
var Struct = require('./libs/jspack/code/struct.js');

module.exports = function(str) {
    //crc32
    // utility function for easy string crc32'ing.
    //var a = Struct.Pack(str.length+'c', str);
    var a = [];
    for (var i=0; i<str.length; i++) {
        a.push(str.charCodeAt(i));
    }
    return calc(a);
};
