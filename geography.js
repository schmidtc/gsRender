/* Convert shapefile's meta data date to epoch time in python
 *
In [1]: import datetime
In [2]: datetime.datetime(2013,06,15,0,0).strftime('%s')
Out[2]: '1371279600'

populated from: http://tiles.gwikis.com/dyntm.json/tileset/dtmUser:0587B82127C1ABE9FE1D860B406ECE9C

*/


module.exports = {
    NYC_DTM_BLOCKS: {
        url: '//www.realdirect.com/tiles/maps/dtm0316_tax_block/',
        // Above is a proxy to:
        //url: 'http://tiles.realdirect.com:7500/maps/dtm0316_tax_block/',
        tsid: 'nyc_dtm_blocks',
        numregions: 33314,
        version: 3
    },
    NYC_DTM_LOTS: {
        url: '//www.realdirect.com/tiles/maps/dtm0316_tax_lot/',
        // Above is a proxy to:
        //url: 'http://tiles.realdirect.com:7500/maps/dtm0316_tax_lot/',
        tsid: 'nyc_dtm_lots',
        numregions: 858760,
        version: 3
    },
};
