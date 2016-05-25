var Render = require('./render.js');
var config = require('./config.js');
var b64 = require('./libs/base64/base64.js');
var $ = require('jquery');
var _ = require('underscore');
var colors = require('./colors.js');
var classifications = require('./classification.js');
var utils = require('./utils.js');
var query = require('./query.js');

module.exports = function(overlayOpts) {
    var opts = _.extend({}, config.defaultOverlayOpts, overlayOpts);
    if (opts.api == 'google.maps.v3') {
        return MapLayer(opts);
    } else {
        throw new Error(opts.api+" is not a supported API at this time.");
    }
}

/*
var dtmOptions = {
    cl: Classification(cl),
    n_colors: n_colors,
    cs: RandomColors(n_colors+3),
    tileSize: new google.maps.Size(256, 256),
    opacity:1
};
*/
var MapLayer = function(opts){
    // Abstract Map Layer Class

    // TODO: check opts are valid, and geography is valid.
    var tiles = {}, //Store for tile data for active nodes.
        nodes = {}, //Store for active nodes (imgs).
        available_nodes = [], //Store for recycled img elements.
        stats = {'n': 0, 'ms': 0.0}; // Rendering Stats
    var self = {};
    self.tiles = tiles;
    self.opts = opts;
    self.version = self.opts.geography.version;
    if (self.version == 2) {
        self.tsid = self.opts.geography.tsid;
    } else {
        self.tsid = self.opts.geography.owner +":"+ self.opts.geography.shpfile;
    }
    // require by google.maps.MapType specification
    // https://developers.google.com/maps/documentation/javascript/reference?csw=1#MapType
    self.tileSize = new google.maps.Size(opts.tileSize.x, opts.tileSize.y);
    if (self.opts.cl == undefined) {
        self.opts.cl = classifications.defaultClassification;
    }
    self.opts.cs = colors.RandomColors(1);

    self.getStats = function() {
        return {n : stats.n, ms : stats.ms};
    }
    self.setClassification = function(cl){
        this.opts.cl = cl;
        this._render();
    };
    self.setColors = function(cs){
        this.opts.cs = cs;
        this._render();
    };
    self.render = _.throttle(function(id) {
        this._render(id);
    }, 100, self, {leading: false});
    self.addListener = function(map, eventType, callback) {
        var updateEvent = _.bind(function(e){
            var tileRange = 1 << map.getZoom(),
                pt = map.getProjection().fromLatLngToPoint(e.latLng),
                coord = { 
                    x : Math.floor((pt.x * tileRange) / 256),
                    y : Math.floor((pt.y * tileRange) / 256),
                    px : Math.floor((pt.x * tileRange) % 256),
                    py : Math.floor((pt.y * tileRange) % 256),
                    z : map.getZoom()
                },
                tid = this._getTileURL(coord.x, coord.y, coord.z, self.opts.borders),
                tile = tiles[tid];
            if (tile) {
                var r = query(tile, coord.px, coord.py);
                e.region_offset = r;
                e.class_id = this.opts.cl.get_class(r);
                e.tid = tid;
            }
            return e;
        }, this);
        if (eventType == "mouseover") {
            google.maps.event.addListener(map, 'mousemove', _.bind(function(e) {
                e = updateEvent(e);
                if (this.last_mouseover != e.region_offset) {
                    this.last_mouseover = e.region_offset;
                    callback(e);
                }
            } , this));
        } else if (eventType == "click") {
            google.maps.event.addListener(map, 'click', _.bind(function(e){
                e = updateEvent(e);
                callback(e)
            }, this))
        } else {
            throw "unsupported eventType";
        }
    };
    self._render = function(id){
        // The render function redraws tiles as needed.
        // When called with no arguments, all active tiles are rendered.
        // When called with the ID of 1 tile, only that tile is rendered.
        //  (e.g. as a callback when the tile data is ready)
        //  if the ID is not contained by nodes, the call is ignored.
        var img;
        if (id) {
            var ids = [id];
        } else {
            var ids = _.keys(nodes);
        }
        var t0 = new Date;
        _.each(ids, function(id) {
            var tile = tiles[id],
                node = nodes[id];
            if (node == undefined) {
                delete tiles[id]; //tile has expired;
            } else if (tile) {
                img = Render.Render(
                    3,//TODO: don't hardcode number of colors!
                    tile,
                    this.tileSize.x,
                    this.tileSize.y, 
                    this.opts.cl, 
                    this.opts.cs);
                if (img != tile.src) {
                    node.src = img;
                    tile.src = img;
                }
            }
        },this);
        stats.ms += (new Date) - t0;
        stats.n += ids.length;
    };
    self.releaseTile = function(node){
        // require by google.maps.MapType specification
        // https://developers.google.com/maps/documentation/javascript/reference?csw=1#MapType
        delete tiles[node.id];
        delete nodes[node.id];
        node.src="";
        node.id="";
        available_nodes.push(node);
    };
    self._getImage = function(owner){ //private function
        if (available_nodes.length > 0) {
            return available_nodes.pop();
        }
        return owner.createElement('img');
    };
    self._getTileURL = function(x, y, z, b){
        // Hashes the tile to one of four tile servers.
        // TODO: This should be researched, 2 servers is probably better and faster.
        if (this.version == 2) {
            return config.v2_tile_domains[y%2] + '/maps/' + [this.tsid,x,y,z].join('/') + "?b=" + (b+0);
        } else {
            return config.v1_tile_domains[((x % 2) << 1) | (y % 2)] + 
                "/dyntm/j/?ts=" + this.tsid +
                "&z=" + z +
                "&x=" + x +
                "&y=" + y +
                "&b=" + (b+0);
        }
    };
    self.getTile = function(coord, zoom, ownerDocument){
        // require by google.maps.MapType specification
        // https://developers.google.com/maps/documentation/javascript/reference?csw=1#MapType
        coord = utils.normalizeGoogleCoord(coord, zoom);
        if (!coord) {
            var node = this._getImage(ownerDocument);
            node.id = "nullTile";
            return node;
        }
        var tid = this._getTileURL(coord.x, coord.y, zoom, self.opts.borders),
            owner = ownerDocument || document,
            node = this._getImage(owner);
        node.id = tid;
        node.style.opacity = this.getOpacity();

        // Store node.
        // TODO: refactor this to enable repeating tiles along X axis.
        //  when repeating along X the same tid is displayed multiple times,
        //  we lose reference to the old node here and may not render it.
        nodes[tid] = node;
        // Get the tile data and render when available.
        $.get(tid).done(_.bind(function(tile, status){
            tile = Render.load(tile);
            tiles[tid] = tile;
            this._render(tid);
        }, this))

        // Return the node, will be empty until data is ready.
        return node;
    };
    self.getOpacity = function(){ //user function
        return this.opts.opacity;
    };
    self.setOpacity = function(opacity){ //user function
        // set opacity of entire layer. (efficitly takes a pct of indivual region alpha)
        var val = ((typeof opacity == "number") && (opacity >= 0 && opacity <= 1)) ? opacity : this.getOpacity();
        this.opts.opacity = val;
        _.each(nodes, function(el) {
            el.style.opacity = val;
        });
    };
    return self;
}
