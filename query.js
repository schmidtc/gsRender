var pako = require('./libs/pako/pako.js'),
    Struct = require('./libs/jspack/code/struct.js'),
    unpack = require('./utils.js').unpack;

function query_raster(dat, x, y){
    var order = unpack('B',dat[0])[0] == 0 ? '<' : '>',
        dtype = (dat[1] == '\x00') ? 'H' : 'L',
        a = Struct.Unpack(order+256*256+dtype, pako.inflate(dat.slice(2))),
        idx = y*256+x;
    return a[idx];
};

function query_plte(tile, x, y) {
    // The first column in each row must be skipped
    return tile.b[tile.idat[y*257+x+1]];
};

module.exports = function(tile, x, y){
    if (tile.typ == 'C') return query_raster(tile.dat, x, y);
    else if (tile.typ == 'D') return query_plte(tile, x, y);
    else if (tile.typ == 'B') return tile.dat;
    return 0;
};
