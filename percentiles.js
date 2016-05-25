var percentiles = function(list) {
    /*
    Returns the rank position of all elements of list

    Modified from stackoverflow

    Usage:

        var test = [1000,100, 99,"NaN","None",0,0,0,0];
        sortWithIndeces(test,0);
        console.log(test.percentiles);
        [10, 9, 8, -30, -30, 0, 0, 0, 0]

    */
    var N = list.length,
        cleaned = [],
        idx = [],
        offset2rank = {},
        i,
        val;
    if (N < 90000) {
        // In chrome preallocating makes arrays slow if N is > ~90k
        cleaned = new Array(N);
        idx = new Array(N);
        offset2rank = new Array(N)
    }
    for (i=0; i < N; i++){
        val = list[i];
        cleaned[i] = isNaN(val) ? 0 : val;
        idx[i] = i;
    }

    idx.sort(function(a,b){ return cleaned[a]-cleaned[b]; });

    for (i=0; i < N; i++){
        offset2rank[idx[i]] = i;
    }

    for (i=0; i < N; i++){
        val = list[i];
        if (val == 0) {
            idx[i] = 0;
        } else if (isNaN(val)) {
            idx[i] = -3;
        } else {
            idx[i] = Math.round((offset2rank[i] + 1) / N * 10);
        }
    }
    return idx;
}

module.exports = percentiles;
