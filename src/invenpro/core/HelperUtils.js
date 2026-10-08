(function () {
  var root = (window.InvenPro = window.InvenPro || {});

  function camelize(obj) {
    if (Array.isArray(obj)) return obj.map(camelize);
    if (obj !== null && typeof obj === "object") {
      var out = {};
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          out[k.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); })] = camelize(obj[k]);
        }
      }
      return out;
    }
    return obj;
  }

  function snakify(obj) {
    if (Array.isArray(obj)) return obj.map(snakify);
    if (obj !== null && typeof obj === "object") {
      var out = {};
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          out[k.replace(/[A-Z]/g, function (c) { return "_" + c.toLowerCase(); })] = obj[k];
        }
      }
      return out;
    }
    return obj;
  }

  var hashPass = async function (plain) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  };

  function md5Hex(value) {
    var input = String(value ?? "");
    var K = [
      0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,
      0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,
      0x6b901122,0xfd987193,0xa679438e,0x49b40821,0xf61e2562,0xc040b340,
      0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
      0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,
      0x676f02d9,0x8d2a4c8a,0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,
      0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,
      0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
      0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,
      0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,
      0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
    ];
    var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
      5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
      4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
      6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    function leftRotate(v,s){return(v<<s)|(v>>>(32-s));}
    function md5Cycle(f,x,y,z,m,s,t){return leftRotate((f+x+y+z+m+t)|0,s)+y|0;}
    function ff(a,b,c,d,x,s,t){return md5Cycle((b&c)|(~b&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return md5Cycle((b&d)|(c&~d),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return md5Cycle(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return md5Cycle(c^(b|~d),a,b,x,s,t);}
    var bytes = new TextEncoder().encode(input);
    var words = new Int32Array(((bytes.length+9+63)>>6)*16);
    for(var i=0;i<bytes.length;i++) words[i>>2]|=bytes[i]<<((i%4)*8);
    words[bytes.length>>2]|=0x80<<((bytes.length%4)*8);
    words[((bytes.length+8)>>6)*16-2]=bytes.length*8;
    var a=0x67452301,b=0xefcdab89,c=0x98badcfe,d=0x10325476;
    for(var i=0;i<words.length;i+=16){
      var AA=a,BB=b,CC=c,DD=d;
      a=ff(a,b,c,d,words[i+0],S[0],K[0]);d=ff(d,a,b,c,words[i+1],S[1],K[1]);c=ff(c,d,a,b,words[i+2],S[2],K[2]);b=ff(b,c,d,a,words[i+3],S[3],K[3]);
      a=ff(a,b,c,d,words[i+4],S[4],K[4]);d=ff(d,a,b,c,words[i+5],S[5],K[5]);c=ff(c,d,a,b,words[i+6],S[6],K[6]);b=ff(b,c,d,a,words[i+7],S[7],K[7]);
      a=ff(a,b,c,d,words[i+8],S[8],K[8]);d=ff(d,a,b,c,words[i+9],S[9],K[9]);c=ff(c,d,a,b,words[i+10],S[10],K[10]);b=ff(b,c,d,a,words[i+11],S[11],K[11]);
      a=ff(a,b,c,d,words[i+12],S[12],K[12]);d=ff(d,a,b,c,words[i+13],S[13],K[13]);c=ff(c,d,a,b,words[i+14],S[14],K[14]);b=ff(b,c,d,a,words[i+15],S[15],K[15]);
      a=gg(a,b,c,d,words[i+1],S[16],K[16]);d=gg(d,a,b,c,words[i+6],S[17],K[17]);c=gg(c,d,a,b,words[i+11],S[18],K[18]);b=gg(b,c,d,a,words[i+0],S[19],K[19]);
      a=gg(a,b,c,d,words[i+5],S[20],K[20]);d=gg(d,a,b,c,words[i+10],S[21],K[21]);c=gg(c,d,a,b,words[i+15],S[22],K[22]);b=gg(b,c,d,a,words[i+4],S[23],K[23]);
      a=gg(a,b,c,d,words[i+9],S[24],K[24]);d=gg(d,a,b,c,words[i+14],S[25],K[25]);c=gg(c,d,a,b,words[i+3],S[26],K[26]);b=gg(b,c,d,a,words[i+8],S[27],K[27]);
      a=gg(a,b,c,d,words[i+13],S[28],K[28]);d=gg(d,a,b,c,words[i+2],S[29],K[29]);c=gg(c,d,a,b,words[i+7],S[30],K[30]);b=gg(b,c,d,a,words[i+12],S[31],K[31]);
      a=hh(a,b,c,d,words[i+5],S[32],K[32]);d=hh(d,a,b,c,words[i+8],S[33],K[33]);c=hh(c,d,a,b,words[i+11],S[34],K[34]);b=hh(b,c,d,a,words[i+14],S[35],K[35]);
      a=hh(a,b,c,d,words[i+1],S[36],K[36]);d=hh(d,a,b,c,words[i+4],S[37],K[37]);c=hh(c,d,a,b,words[i+7],S[38],K[38]);b=hh(b,c,d,a,words[i+10],S[39],K[39]);
      a=hh(a,b,c,d,words[i+13],S[40],K[40]);d=hh(d,a,b,c,words[i+0],S[41],K[41]);c=hh(c,d,a,b,words[i+3],S[42],K[42]);b=hh(b,c,d,a,words[i+6],S[43],K[43]);
      a=hh(a,b,c,d,words[i+9],S[44],K[44]);d=hh(d,a,b,c,words[i+12],S[45],K[45]);c=hh(c,d,a,b,words[i+15],S[46],K[46]);b=hh(b,c,d,a,words[i+2],S[47],K[47]);
      a=ii(a,b,c,d,words[i+0],S[48],K[48]);d=ii(d,a,b,c,words[i+7],S[49],K[49]);c=ii(c,d,a,b,words[i+14],S[50],K[50]);b=ii(b,c,d,a,words[i+5],S[51],K[51]);
      a=ii(a,b,c,d,words[i+12],S[52],K[52]);d=ii(d,a,b,c,words[i+3],S[53],K[53]);c=ii(c,d,a,b,words[i+10],S[54],K[54]);b=ii(b,c,d,a,words[i+1],S[55],K[55]);
      a=ii(a,b,c,d,words[i+8],S[56],K[56]);d=ii(d,a,b,c,words[i+15],S[57],K[57]);c=ii(c,d,a,b,words[i+6],S[58],K[58]);b=ii(b,c,d,a,words[i+13],S[59],K[59]);
      a=ii(a,b,c,d,words[i+4],S[60],K[60]);d=ii(d,a,b,c,words[i+11],S[61],K[61]);c=ii(c,d,a,b,words[i+2],S[62],K[62]);b=ii(b,c,d,a,words[i+9],S[63],K[63]);
      a=(a+AA)|0;b=(b+BB)|0;c=(c+CC)|0;d=(d+DD)|0;
    }
    var out=[a,b,c,d],hex="";
    for(var j=0;j<out.length;j++){var v=out[j]>>>0;hex+=("00000000"+v.toString(16)).slice(-8);}
    return hex;
  }

  function fmtCOP(n) {
    if (n == null || isNaN(n)) return "\u2014";
    return "$" + Math.round(n).toLocaleString("es-CO");
  }

  function daysFromNow(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var ms = d - today;
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }

  var todayStr = new Date().toISOString().slice(0, 10);

  var Helpers = { camelize: camelize, snakify: snakify, hashPass: hashPass, md5Hex: md5Hex, fmtCOP: fmtCOP, daysFromNow: daysFromNow, todayStr: todayStr };
  root.Helpers = Helpers;
  window.Helpers = Helpers;
})();
