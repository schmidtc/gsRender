/*
 * classification.js -- ported form:
 * classification.py: Utilities for reading and creating classifications
 * 
 * Classifications classify a set of N regions into n classes.
 *      - There is no limit to N, though more then 1,000,000 becomes unreasonable.
 *         Each region costs 1 byte, so 1Million regions ~= 1MB.
 *         Though these compress well, AppEngine will choke on items larger then 1MB.
 * 
 *      - N is the number of REAL regions and does not include the background or borders
 *         Why: N == len(Shape File)
 *      - n is 1+max(classes)
 *         Why: n == len(Color Scheme)
 * 
 *      - n has an upper limit of 256 and,
 *         this includes the 2 de facto classes [background,borders].
 *         so the real limit is 254.
 *         This limit is imposed by the implementation, and helps ensure the tiles 
 *         are of reasonable size when delivered to the client.
 *         
 *      - Classifications are python lists.
 *         The 1st item in the list must be 0: The classID of the Background Region
 *         The 2nd item in the list must be 1: The classID of the Borders Region
 *         The 3rd item in the list identifies the classID of the 1st real region.
 *         The N+2'th item in the list identifies the classID of the N'th real region.
 *         There must be N+2 items in the list: (The total number of regions, plus bg+br)
 * 
 *      - Classification storage:
 *         Classifications are stored as compressed python array with typecode 'B'
 *         Notice that byteorder doesn't matter with typecode 'B'
 *         eg.
 *         >>> classification = [0,1,5,5,3,3,5,3,2,2,5,4,4,5,2,3]
 *         >>> N = len(classification) - 2
 *         >>> n = max(classification)+1
 *         >>> a = array.array('B')
 *         >>> a.fromlist(classification)
 *         >>> StoredClassification = zlib.compress(a.tostring())
 * 
 *      - Classifications are not Color Schemes
 *         and contain no color information.
 *         They simply bin the regions, colors are applied to the bins in a second step.
 *
 */

var _ = require('underscore');

module.exports = {
    fromClassList: function(class_list) {
        var base = [0,1];
        var selection = {};
        return {
            a : base.concat(_.map(class_list, function(x){return x+3})),
            length : class_list.length,
            n : function(){
                return _.max(this.a)+1;
            },
            number_of_classes : function(){
                return this.n();
            },
            set_class : function(n, cl){
                this.a[n] = cl;
            },
            get_class : function(n){
                if (selection[n]) return 2;
                return this.a[n];
            },
            set_selection : function(n) {
                var s = {};
                n = [].concat(n);
                _.each(n, function(val) { s[val]=true; });
                if (n.length == 1 && n[0] < 3) selection = {};
                else selection = s;
            },
            get_selection : function() {
                return selection;
            }
        };
    },
    fromFunction: function() {
        return {
            get_class: arguments[0],
            set_class: arguments[1],
        };
    },
    //TODO: Is this safe? Looks like if two layer are using defaultClassification they'll conflict with each other.
    //      should replace with factory.
    defaultClassification : {
        a: {0:0, 1:1},
        _selection: {},
        _default: 3,
        get_class: function(i) {
            if (i<2) return this.a[i];
            if (this._selection[i]) return 2;
            var cl = this.a[i];
            if (cl === undefined) return this._default;
            else return cl;
        },
        set_class: function(i, value) {
            this.a[i] = value;
        },
        set_selection : function(n) {
            var s = {};
            n = [].concat(n);
            _.each(n, function(val) { s[val]=true; });
            if (n.length == 1 && n[0] < 3) this._selection = {};
            else this._selection = s;
        },
        get_selection : function() {
            return this._selection;
        },
        set_default_class: function(cl) {
            this._default = cl;
        }
    },
    percentiles: require('./percentiles.js')
};

/*
var Classification = {
    random : function (N, n){
        // Return a random classification for N regions with n+2 classes
        n = (n === undefined) ? 3 : n;
        n = n || 3;
        if (n == 3) {
            return ([0, 1]).concat(_.times(N, function(){return 2}));
        } else if (n > 3 && n < 257) {
            return ([0, 1]).concat(_.shuffle(_.times(N, function(i){ return (i%(n-2))+2; })));
        } else {
            throw TypeError("n too small");
        }
    }
};
*/

