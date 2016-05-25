module.exports = {
    defaultOverlayOpts : {
        api : "google.maps.v3",
        tileSize : {x:256, y:256},
        opacity : 1,
        borders: true
    },
    v1_tile_domains: {
        0 : "http://a.tiles.gwikis.com",
        1 : "http://b.tiles.gwikis.com",
        2 : "http://c.tiles.gwikis.com",
        3 : "http://d.tiles.gwikis.com"
    },
    v2_tile_domains: {
        0 : "http://geoscore.net",
        1 : "http://geoscore.net"
    }
}
