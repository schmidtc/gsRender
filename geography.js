/* Convert shapefile's meta data date to epoch time in python
 *
In [1]: import datetime
In [2]: datetime.datetime(2013,06,15,0,0).strftime('%s')
Out[2]: '1371279600'

populated from: http://tiles.gwikis.com/dyntm.json/tileset/dtmUser:0587B82127C1ABE9FE1D860B406ECE9C

*/


module.exports = {
    COUNTIES: {
        owner: "dtmUser",
        date: 1402688837.0,
        shpfile: "usa.gmerc.shp",
        tsid: 'uscounties',
        numregions: 3111,
        version: 2,
        public: true
    },
    US_CENSUS_BLOCKGROUPS: {
        owner: "dtmUser",
        date: 1392694842.0,
        shpfile: "blkgrps.gmerc.shp",
        tsid: 'blkgrps',
        numregions: 219774,
        version: 2,
        public: true
    },
    ZIPCODES: {
        // USPS 2014 ZIPCODES SMP
        owner: "RD",
        date: 1428379200.0,
        shpfile: "zip5_SMP.gmerc.shp",
        tsid: 'zipcodes',
        numregions: 30301,
        version: 2,
        public: true
    },
    NYC_DTM_BLOCKS_V2: {
        owner: "RD",
        date: 1428379200.0,
        shpfile: "Tax_Block_Polygons.gmerc.shp",
        tsid: 'nyc_dtm_blocks_v2',
        numregions: 28842,
        version: 2,
        public: true
    },
    NYC_DTM_BLOCKS: {
        owner: "RD",
        date: 1428379200.0,
        shpfile: "DTM_0814_Tax_Block_Polygon.gmerc.shp",
        tsid: 'nyc_dtm_blocks',
        numregions: 33314,
        version: 2,
        public: true
    },
    NYC_DTM_LOTS_V2: {
        owner: "RD",
        date: 1428379200.0,
        shpfile: "Tax_Lot_Polygons.gmerc.shp",
        tsid: 'nyc_dtm_lots_v2',
        numregions: 858673,
        version: 2,
        public: true
    },
    NYC_DTM_LOTS: {
        owner: "RD",
        date: 1428379200.0,
        shpfile: "DTM_0814_Tax_Lot_Polygon.gmerc.shp",
        tsid: 'nyc_dtm_lots',
        numregions: 858760,
        version: 2,
        public: true
    },
    NYC_BUILDINGS: {
        owner: "RD",
        date: 1428379200.0,
        shpfile: "building_1214.shp",
        tsid: 'nyc_buildings',
        numregions: 1082381,
        version: 2,
        public: true
    }
};
