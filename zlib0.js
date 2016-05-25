module.exports = {
    copy: function(a) {
        var o = new Array(a.length);
        for (var i=0; i<a.length; i++) {
            o[i] = a[i];
        }
        return o;
    },
    adler32: function(adler, buf, len, pos) {
        var s1 = (adler & 0xffff)
          , s2 = ((adler >>> 16) & 0xffff)
          , n = 0;

        while (len !== 0) {
          // Set limit ~ twice less than 5552, to keep
          // s2 in 31-bits, because we force signed ints.
          // in other case %= will fail.
          n = len > 2000 ? 2000 : len;
          len -= n;

          do {
            s1 = (s1 + buf[pos++]);
            s2 = (s2 + s1);
          } while (--n);

          s1 %= 65521;
          s2 %= 65521;
        }

        return (s1 | (s2 << 16));
    },
    deflate0: function(a, zlib) {
        var i = 0,
            j = 0,
            CHUNK = 65531, // BLOCK Size
            len,
            lenA,
            lenB,
            out,
            pointer = 0,
            adler = 1,
            s1 = (adler & 0xffff) | 0,
            s2 = ((adler >>> 16) & 0xffff) | 0,
            n = 0,
            byt;

        if (zlib) {
            out = new Array( (Math.ceil(a.length / CHUNK) * 5) + a.length + 6);
            out[pointer++] = 120;
            out[pointer++] = 1;
        } else {
            out = new Array( (Math.ceil(a.length / CHUNK) * 5) + a.length);
        }
        for (i = 0; i < a.length; i+=CHUNK) {
            len = CHUNK;
            if (i+len > a.length) {
                out[pointer++] = 1; // BFINAL
                len = a.length - i;
            } else {
                out[pointer++] = 0;
            }
            lenA = len & 0xff;
            lenB = len >> 8;
            out[pointer++] = lenA;
            out[pointer++] = lenB;
            out[pointer++] = lenA ^ 0xff;
            out[pointer++] = lenB ^ 0xff;
            for (j = i; j < i + len; j++) {
                byt = a[j];
                out[pointer++] = byt;

                if (zlib) {
                    s1 = (s1 + byt) | 0;
                    s2 = (s2 + s1) | 0;
                    n++;
                    if (n > 2048) {
                        s1 %= 65521;
                        s2 %= 65521;
                        n=0;
                    }
                    
                }
            }
        }

        if (zlib) {
            s1 %= 65521;
            s2 %= 65521;
            adler = (s1 | (s2 << 16)) | 0;
            //adler = adler32(1, a, a.length, 0);
            out[pointer++] = (adler >> 24) & 0xff;
            out[pointer++] = (adler >> 16) & 0xff;
            out[pointer++] = (adler >> 8) & 0xff;
            out[pointer++] = adler & 0xff;
        }
        return out;
    }
}
