// UMD pattern
// see https://github.com/umdjs/umd/blob/master/templates/returnExports.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.myAsmjsModule = factory();
  }
}(this, function () {
  'use strict';
  
  function myAsmjsModule(stdlib, foreign, heap) {
    'use asm';

    var abs = stdlib.Math.abs;
    var acos = stdlib.Math.acos;
    var asin = stdlib.Math.asin;
    var atan = stdlib.Math.atan;
    var atan2 = stdlib.Math.atan2;
    var ceil = stdlib.Math.ceil;
    var cos = stdlib.Math.cos;
    var exp = stdlib.Math.exp;
    var floor = stdlib.Math.floor;
    var fround = stdlib.Math.fround;
    var imul = stdlib.Math.imul;
    var log = stdlib.Math.log;
    var max = stdlib.Math.max;
    var min = stdlib.Math.min;
    var pow = stdlib.Math.pow;
    var sin = stdlib.Math.sin;
    var sqrt = stdlib.Math.sqrt;
    var tan = stdlib.Math.tan;
    
    var I1 = new stdlib.Int8Array(heap);
    var I2 = new stdlib.Int16Array(heap);
    var I4 = new stdlib.Int32Array(heap);
    var U1 = new stdlib.Uint8Array(heap);
    var U2 = new stdlib.Uint16Array(heap);
    var U4 = new stdlib.Uint32Array(heap);
    var F4 = new stdlib.Float32Array(heap);
    var F8 = new stdlib.Float64Array(heap);

/**
 * Returns the largest number of one or more 32-bit floats.
 * If the specified length is less than 1, the behavior is undefined.
 *
 * @param {int} p - byte offset
 * @param {int} len - length
 * @returns {double} - max value
 */
function maxFloat32(p, len) {
 /*
  * Type annotations
  */
  p = p | 0;
  len = len | 0;

 /*
  * Local variables
  */
  var end = 0;
  var v = 0.0;
  var result = 0.0;

 /*
  * Main
  */
  end = (p + (len << 2)) | 0;
  result = +F4[p >> 2];
  p = (p + 4) | 0;

  for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = +F4[p >> 2];

    if (v >= result) {
      result = v;
    }
  }

  return +result;
}

/**
 * Returns the sum of 32-bit floats.
 * 0.0 if the specified length is less than 1.
 *
 * @param {int} p - byte offset
 * @param {int} len - length
 * @returns {double} - sum
 */
function sumFloat32(p, len) {
 /*
  * Type annotations
  */
  p = p | 0;
  len = len | 0;

 /*
  * Local variables
  */
  var end = 0;
  var v = 0.0;
  var result = 0.0;

 /*
  * Main
  */
  if ((len | 0) < 0) {
    return 0.0;
  }
  
  end = (p + (len << 2)) | 0;

  for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = +F4[p >> 2];
    result = result + v;
  }

  return +result;
}

/**
 * Returns the sum of 32-bit signed integers.
 * 0 if the specified length is less than 1.
 *
 * @param {int} p - byte offset
 * @param {int} len - length
 * @returns {signed} - sum
 */
function sumInt32(p, len) {
 /*
  * Type annotations
  */
  p = p | 0;
  len = len | 0;

 /*
  * Local variables
  */
  var end = 0;
  var v = 0;
  var result = 0;

 /*
  * Main
  */
  if ((len | 0) < 0) {
    return 0;
  }
  
  end = (p + (len << 2)) | 0;

  for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = I4[p >> 2] | 0;
    result = (result + v) | 0;
  }

  return result | 0;
}

/**
 * Returns the logsumexp of one or more 32-bit floats.
 * Always 0.0 if the specified length is less than 1.
 *
 * @param {int} p - byte offset
 * @param {int} len - length
 * @returns {double} - result of logsumexp
 */
function logsumexpFloat32(p, len) {
 /*
  * Type annotations
  */
  p = p | 0;
  len = len | 0;

 /*
  * Local variables
  */
  var end = 0;
  var v = 0.0;
  var maxValue = 0.0;
  var result = 0.0;

 /*
  * Main
  */
  if ((len | 0) <= 0) {
    return 0.0;
  }
  
  maxValue = +maxFloat32(p, len);
  end = (p + (len << 2)) | 0;

  for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = +F4[p >> 2];

    // exp(-20) = 2.06e-9, machine epsilon for float32 = 5.96e-08
    if (v - maxValue > -20.0) {
      result = +(result + (+exp(v - maxValue)));
    }
  }

  return +(maxValue + (+log(result)));
}

/**
 * Returns a signed 32-bit hash value by using MurmurHash3_x86_32.
 *
 * Use ">>> 0" to convert its result to an unsigned integer.
 *
 * @param {int} p - byte offset to the start of a byte sequence
 * @param {int} len - length of the specified byte sequence
 * @param {int} seed - unsigned 32-bit integer used as a seed
 * @returns {signed} - signed 32-bit hash value
 */
function MurmurHash3_x86_32(p, len, seed) {    
 /*
  * Type annotations
  */
  p = p | 0;
  len = len | 0;
  seed = seed | 0;

 /*
  * Local variables
  */
  var end = 0;
  var k1 = 0;
  var h1 = 0;
  var keyLength = 0;
  var tailLength = 0;
  var bodyLength = 0;

 /*
  * Main
  */
  keyLength = len;
  tailLength = keyLength & 3;
  bodyLength = (keyLength - tailLength) | 0;
  h1 = seed >>> 0;

  // body
  end = (p + bodyLength) | 0;
  while ((p | 0) < (end | 0)) {
   k1 = U4[p >> 2] | 0;
   p = (p + 4) | 0;

   k1 = imul(k1, 0xcc9e2d51) >>> 0;

   k1 = (k1 << 15) | (k1 >>> 17);

   k1 = imul(k1, 0x1b873593) >>> 0;

   h1 = (h1 ^ k1) | 0;
   h1 = (h1 << 13) | (h1 >>> 19);

   h1 = imul(h1, 5) >>> 0;
   h1 = (h1 + 0xe6546b64) >>> 0;
  }

  // tail
  k1 = 0;

  switch (tailLength | 0) {
    case 3:
      k1 = (k1 ^ (U1[(p + 2) >> 0] << 16)) | 0;
      /* falls through */
    case 2:
      k1 = (k1 ^ (U1[(p + 1) >> 0] << 8)) | 0;
      /* falls through */
    case 1:
      k1 = (k1 ^ (U1[p >> 0] | 0)) | 0;
      k1 = imul(k1, 0xcc9e2d51) >>> 0;

      k1 = (k1 << 15) | (k1 >>> 17);

      k1 = imul(k1, 0x1b873593) >>> 0;

      h1 = (h1 ^ k1) | 0;
  }

  // finalization
  h1 = (h1 ^ keyLength) | 0;
  h1 = (h1 ^ (h1 >>> 16)) | 0;

  h1 = imul(h1, 0x85ebca6b) >>> 0;

  h1 = (h1 ^ (h1 >>> 13)) | 0;

  h1 = imul(h1, 0xc2b2ae35) >>> 0;

  h1 = h1 ^ (h1 >>> 16);    

  return h1 | 0;
}

/********************
 * ufmap
 *
 * A hash map implementation where
 * a key is limited to an unsigned 32-bit integer and
 * a value is limited to a 32-bit float.
 *
 * For efficiency, the maximum number of keys must be specified at creation.
 *
 * +-------+---+---+---+---+---+---+
 * |  TMP  |TBS|LEN|MNK|LLP|FRP|FLG| (more-->)
 * +-------+---+---+---+---+---+---+
 *
 * +===============+===============+
 * |... BUCKETS ...|... ENTRIES ...|
 * +===============+===============+
 *
 * TMP: free 64-bit space to allocate temporary variables
 * TBS: table size
 * LEN: current number of items in this map
 * MNK: maximum number of keys this map can contain
 * LLP: relative byte offset to the linked list
 * FRP: relative byte offset to the next free entry space
 * FLG: flags
 * BUCKETS: hash table
 * ENTRIES: a sequence of entries
 *
 * This data structure uses 
 * 32 + tableSize * 4 (bytes) + maxNumberOfKeys * 12 (bytes)
 *
 * This hash map uses separated chaining with linked lists as collision
 * resolution. Each bucket uses signed 32-bit integer as a pointer to the
 * first entry of a linked list. 0 denotes the key is not used.
 *
 * Each entry occupies 12 bytes.
 *
 * +---+---+---+
 * |KEY|VAL|NXT|
 * +---+---+---+
 *
 * KEY: 32-bit unsigned value for a key
 * VAL: 32-bit float value for a value
 * NXT: relative byte offset to the next entry
 *
 * NXT == 0 indicates that the entry is the last one in a linked list.
 * NXT == 0xffffffff indicates that the entry is free and can be
 * reallocated, and in this case KEY represents the relative byte offset to
 * next free space.
 ********************/

/**
 * Creates a new hash map.
 *
 * `tableSize` must be a power of 2. No validation is employed.
 *
 * @param {int} p - byte offset
 * @param {int} tableSize - size of table
 * @param {int} maxNumberOfKeys - unsigned 32-bit integer
 *   to specify the maximum number of keys
 */
function ufmap_create(p, tableSize, maxNumberOfKeys) {
  /*
   * Type annotations
   */
  p = p | 0;
  tableSize = tableSize | 0;
  maxNumberOfKeys = maxNumberOfKeys | 0;
  
  /*
   * Local variables
   */
  var linkedListP = 0; // byte offset to the first linked list entry
  
  /*
   * Main
   */
  U4[(p + 8) >> 2] = tableSize;
  U4[(p + 12) >> 2] = 0;
  U4[(p + 16) >> 2] = maxNumberOfKeys;
  linkedListP = (32 + tableSize) | 0;
  U4[(p + 20) >> 2] = linkedListP;
  U4[(p + 24) >> 2] = linkedListP;
}

/**
 * Find an entry for a key.
 *
 * After this operation, byte offset to the start of an entry (relative to
 * the start of this map) is written into the first 32-bit of TMP
 * relative byte offset to a position where the pointer to the entry is
 * written into the second 32-bit of TMP.
 *
 * When the key is not found, the first 32-bit of TMP will be 0.
 * The second 32-bit of TMP will be ...
 *
 * @param {int} p - byte offset
 * @param {int} key - 32-bit unsigned integer
 */
function _ufmap_find(p, key) {
  /*
   * Type annotations
   */
  p = p | 0;
  key = key | 0;
  
  /*
   * Local variables
   */
  var TMP1 = 0;
  var TMP2 = 4;
  var TBS = 8;
  var TABLE_START = 32;
  var SEED = 42; // 42 is a seed chosen arbitrarily
  var mask = 0;
  var hashValue = 0;
  var k = 0;
  var prevP = 0;
  var nextP = 0;
  var entryP = 0;
  var tmp1P = 0;
  
  /*
   * Main
   */
  tmp1P = (p + TMP1) | 0;

  mask = ((U4[(p + TBS) >> 2] | 0) - 1) >>> 0;
  U4[tmp1P >> 2] = key;
  hashValue = MurmurHash3_x86_32(tmp1P, 1, SEED) | 0;

  prevP = (TABLE_START + (hashValue & mask)) | 0;
  nextP = U4[(p + prevP) >> 2] | 0;
  
  // while (nextP is not empty and key is not matched)
  while (((nextP | 0) != 0) & ((k >>> 0) != (key >>> 0))) {
    entryP = nextP;
    k = U4[(p + entryP) >> 2] | 0;
    prevP = entryP;
    nextP = U4[((p + entryP + 8) | 0) >> 2] | 0;
  }
  
  U4[(p + TMP2) >> 2] = prevP | 0;

  if ((k | 0) == (key | 0)) {
    // Key matched
    U4[tmp1P >> 2] = entryP | 0;
  } else {
    U4[tmp1P >> 2] = 0;
  }
}

/**
 * @param {int} p - byte offset
 * @param {signed} key - 32-bit unsigned integer
 */
function ufmap_has(p, key) {
  /*
   * Type annotations
   */
  p = p | 0;
  key = key | 0;
  
  /*
   * Local variables
   */
  var TMP1 = 0;
  var matched = 0;

  /*
   * Main
   */
  _ufmap_find(p, key);
  matched = U4[(p + TMP1) >> 2] | 0;
  
  if ((matched | 0) != 0) {
    // Key matched
    return 1;
  }
  
  return 0;
}

/**
 * Updates the value by the following formula in 32-bit precision
 * map[key] = coef * map[key] + value
 *
 * @param {int} p - byte offset
 * @param {int} key - 32-bit unsigned integer
 * @param {double} value - 64-bit float
 * @param {double} coef - 64-bit float
 */
function ufmap_add(p, key, value, coef) {
  /*
   * Type annotations
   */
  p = p | 0;
  key = key | 0;
  value = +value;
  coef = +coef;

  /*
   * Local variables
   */
  var TMP1 = 0;
  var TMP2 = 4;
  var LEN = 12;
  var MNK = 16;
  var FRP = 24;
  var lenP = 0;
  var mnkP = 0;
  var frpP = 0;
  var freeAbsP = 0; // byte offset for a new entry
  var entryP = 0;
  var prevP = 0;
  var valueAbsP = 0;
  var v = 0.0;
  var currentSize = 0;
  var maximumNumberOfKeys = 0;

  /*
   * Main
   */
  lenP = (p + LEN) | 0;
  mnkP = (p + MNK) | 0;
  frpP = (p + FRP) | 0;
  
  _ufmap_find(p, key);
  entryP = U4[(p + TMP1) >> 2] | 0;
  prevP = U4[(p + TMP2) >> 2] | 0;

  if ((entryP | 0) != 0) {
    // Key matched
    valueAbsP = (p + entryP + 4) | 0;
    v = +F4[valueAbsP >> 2];
    v = coef * v + value;
    F4[valueAbsP >> 2] = v;
    return;
  }

  currentSize = U4[lenP >> 2] >>> 0;
  maximumNumberOfKeys = U4[mnkP >> 2] >>> 0;
  
  if ((currentSize >>> 0) == (maximumNumberOfKeys >>> 0)) {       
    return;
  }

  // Add a new entry
  freeAbsP = (p + (U4[frpP >> 2] | 0)) | 0;
  U4[(p + prevP) >> 2] = (freeAbsP - p) | 0;
  U4[freeAbsP >> 2] = key;
  freeAbsP = (freeAbsP + 4) | 0;
  F4[freeAbsP >> 2] = value;
  freeAbsP = (freeAbsP + 4) | 0;
  U4[frpP >> 2] = (freeAbsP - p) | 0;

  // increment the number of entries
  U4[lenP >> 2] = (currentSize + 1) >>> 0;
}

/**
 * @param {int} p - byte offset
 * @param {int} key - 32-bit unsigned integer
 */
function ufmap_get(p, key) {
  /*
   * Type annotations
   */
  p = p | 0;
  key = key | 0;

  /*
   * Local variables
   */
  var TMP1 = 0;
  var TMP2 = 4;
  var matched = 0;
  var entryP = 0;
  var prevP = 0;

  /*
   * Main
   */
  _ufmap_find(p, key);
  matched = U4[(p + TMP1) >> 2] | 0;
  entryP = (p + matched) | 0;
  prevP = (p + (U4[(p + TMP2) >> 2] | 0)) | 0;

  if ((matched | 0) != 0) {
    // Key matched
    return +F4[(entryP + 4) >> 2];
  }
  
  return 0.0;
}

/**
 * Returns the number of entries contained in this map.
 *
 * @param {int} p - byte offset
 * @returns {signed} - size 
 */
function ufmap_size(p) {
  /*
   * Type annotations
   */
  p = p | 0;

  /*
   * Local variables
   */
  var LEN = 12;

  /*
   * Main
   */
  return U4[(p + LEN) >> 2] | 0;
}

/**
 * Returns the dot product between a sparse vector x and a dense vector y.
 * Unlike the original Sparse BLAS, repeated indices in x are allowed.
 */
function susdot(nz, xP, indexP, yP, outP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  xP = xP | 0;
  indexP = indexP | 0;
  yP = yP | 0;
  outP = outP | 0;
 
  /*
   * Local variables
   */
  var result = 0.0;
  var end = 0;
  var index = 0;
  var value = 0.0;

  /*
   * Main
   */
  end = (indexP + (nz << 2)) | 0;
  while ((indexP | 0) < (end | 0)) {
    index = U4[indexP >> 2] | 0;
    value = +F4[xP >> 2];
    
    result = +(result + value * +F4[(yP + (index << 2)) >> 2]);
    
    indexP = (indexP + 4) | 0;
    xP = (xP + 4) | 0;
  }
  
  F4[outP >> 2] = result;
}

/* global CMP_FUNCTION_TABLE */
/**
 * Sorts things quickly.
 *
 * qsortBM uses an improved version of the quick sort algorithm developed by
 * Jon L. Bentley and M. Douglas McIlroy in 1993.
 *
 * TODO: the original B&M variably changes the size used for swap,
 * though currently this implementation swaps data byte by byte.
 * This issue will be solved soon.
 *
 * @param {int} inP - byte offset to an array
 * @param {int} n - number of elements of the specified array
 * @param {int} es - byte size of each element
 * @param {int} cmpId - id of a comparator
 * @see Jon L. Bentley and M. Douglas McIlroy. 1993.
 *   Engineering a sort function. Software: Practice and Experience,
 *   23(11):1249–1265.
 */
function qsortBM(inP, n, es, cmpId) {
  /*
   * Type annotations
   */
  inP = inP | 0;
  n = n | 0;
  es = es | 0;
  cmpId = cmpId | 0;
  
  /*
   * Local variables
   */
  var a = 0;
  var pa = 0;
  var pb = 0;
  var pc = 0;
  var pd = 0;
  var pl = 0;
  var pm = 0;
  var pn = 0;
  var pv = 0;
  
  var r = 0;
  // var swapType = 0;
  // var t = 0;
  var s = 0;
  
  var isTrue1 = 0;
  var isTrue2 = 0;

  /*
   * Main
   */
  // this variable is used only for convenience to compare this code
  // with the original source code of B&M
  a = inP;
  
  // Insertion sort if an array is very small
  if ((n | 0) < 7) {
    //for (pm = a + es; pm < a + n * es; pm += es) 
    pm = (a + es) | 0;
    isTrue1 = (pm | 0) < ((a + imul(n, es)) | 0);
    while (isTrue1) {
      
      // for (pl = pm; pl > a && cmp(pl - es, pl) > 0; pl -= es)
      pl = pm;
      isTrue2 = (pl | 0) > (a | 0);
      if (isTrue2) {
        isTrue2 = (CMP_FUNCTION_TABLE[cmpId & 3]((pl - es) | 0, pl) | 0) > 0;
      }
      while (isTrue2) {
        swap(pl, (pl - es) | 0, es);

        pl = (pl - es) | 0;

        isTrue2 = (pl | 0) > (a | 0);
        if (isTrue2) {
          isTrue2 = (CMP_FUNCTION_TABLE[cmpId & 3]((pl - es) | 0, pl) | 0) > 0;
        }
      }
      
      pm = (pm + es) | 0;
      isTrue1 = (pm | 0) < ((a + imul(n, es)) | 0);
    }
    
    return;
  }
  
  pm = (a + imul(((n | 0) / 2) | 0, es)) | 0;
  
  if ((n | 0) > 7) {
    pl = a;
    pn = (a + imul(n - 1, es)) | 0;
    if ((n | 0) > 40) {
      // big arrays
      s = imul(n >> 3, es);
      pl = med3(pl, (pl + s) | 0, (pl + (s << 1)) | 0, cmpId) | 0;
      pm = med3((pm - s) | 0, pm, (pm + s) | 0, cmpId) | 0;
      pn = med3((pn - (s << 1)) | 0, (pn - s) | 0, pn, cmpId) | 0;
    }
    pm = med3(pl, pm, pn, cmpId) | 0;
  }
  
  // PVINIT
  // Unlike the original C implementation, we always swap here, since
  // in ECMAScript it is impossible to obtain the address of a local variable
  pv = a;
  swap(pv, pm, es);
  
  // pa = pb = a;
  pb = a;
  pa = pb;
  
  // pc = pd = a + (n - 1) * es;
  pd = (a + imul(n - 1, es)) | 0;
  pc = pd;
    
  for (;;) {
    // while (pb <= pc && (r = cmp(pb, pv)) <= 0)
    isTrue1 = (pb | 0) <= (pc | 0);
    if (isTrue1) {
      r = CMP_FUNCTION_TABLE[cmpId & 3](pb, pv) | 0;
      isTrue1 = (r | 0) <= 0;
    }
    
    while (isTrue1) {
      if ((r | 0) == 0) {
        swap(pa, pb, es);
        pa = (pa + es) | 0;
      }

      pb = (pb + es) | 0;
      
      isTrue1 = (pb | 0) <= (pc | 0);
      if (isTrue1) {
        r = CMP_FUNCTION_TABLE[cmpId & 3](pb, pv) | 0;
        isTrue1 = (r | 0) <= 0;
      }
    }
    
    // while (pc >= pb && (r = cmp(pc, pv)) >= 0)
    isTrue1 = (pc | 0) >= (pb | 0);
    if (isTrue1) {
      r = CMP_FUNCTION_TABLE[cmpId & 3](pc, pv) | 0;
      isTrue1 = (r | 0) >= 0;
    }
    while (isTrue1) {
      if ((r | 0) == 0) {
        swap(pc, pd, es);
        pd = (pd - es) | 0;
      }
      
      pc = (pc - es) | 0;

      isTrue1 = (pc | 0) >= (pb | 0);
      if (isTrue1) {
        r = CMP_FUNCTION_TABLE[cmpId & 3](pc, pv) | 0;
        isTrue1 = (r | 0) >= 0;
      }
    }
    
    if ((pb | 0) > (pc | 0)) {
      break;
    }
    
    swap(pb, pc, es);
    pb = (pb + es) | 0;
    pc = (pc - es) | 0;
  }
  
  pn = (a + imul(n, es)) | 0;
  s = min((pa - a) | 0, (pb - pa) | 0);
  vecswap(a, (pb - s) | 0, s);
  s = min((pd - pc) | 0, (pn - pd - es) | 0);
  vecswap(pb, (pn - s) | 0, s);  
  
  s = (pb - pa) | 0;
  if ((s | 0) > (es | 0)) {
    qsortBM(a, ((s | 0) / (es | 0)) | 0, es, cmpId);
  }
  
  s = (pd - pc) | 0;
  if ((s | 0) > (es | 0)) {
    qsortBM((pn - s) | 0, ((s | 0) / (es | 0)) | 0, es, cmpId);
  }
}

function swap(a, b, n) {
  /*
   * Type annotations
   */
  a = a | 0;
  b = b | 0;
  n = n | 0;

  /*
   * Local variables
   */
  var t = 0;

  /*
   * Main
   */  
  for (; (n | 0) > 0; a = (a + 1) | 0, b = (b + 1) | 0, n = (n - 1) | 0) {
    t = U1[a >> 0] | 0;
    U1[a >> 0] = U1[b >> 0];
    U1[b >> 0] = t | 0;
  }
}

function vecswap(a, b, n) {
  /*
   * Type annotations
   */
  a = a | 0;
  b = b | 0;
  n = n | 0;

  /*
   * Main
   */
  if ((n | 0) > 0) {
    swap(a, b, n);    
  }
}

function med3(a, b, c, cmpId) {
  /*
   * Type annotations
   */
  a = a | 0;
  b = b | 0;
  c = c | 0;
  cmpId = cmpId | 0;

  /*
   * Local variables
   */
  var t = 0;

  /*
   * Main
   */
  t = ((CMP_FUNCTION_TABLE[cmpId & 3](a, b) | 0) < 0) | 0;

  if (t) {
    // a < b

    t = ((CMP_FUNCTION_TABLE[cmpId & 3](b, c) | 0) < 0) | 0;
    
    if (t) {
      // a < b <c      
      return b | 0;
    }
    // a < b & b >= c    
    t = ((CMP_FUNCTION_TABLE[cmpId & 3](a, c) | 0) < 0) | 0;

    if (t) {
      // a < c <= b      
      return c | 0;
    }
    // c <= a < b
    return a | 0;
  }
  // b <= a

  t = ((CMP_FUNCTION_TABLE[cmpId & 3](b, c) | 0) > 0) | 0;
  
  if (t) {
    // c < b <= a
    return b | 0;
  }
  
  // b <= a & b <= c
  
  t = ((CMP_FUNCTION_TABLE[cmpId & 3](a, c) | 0) > 0) | 0;
  
  if (t) {
    // b <= c < a
    return c | 0;
  }
  // b <= a <= c
  return a | 0;
}

/**
 * Sort the element in a sparse vector with ascending order of indices.
 *
 * Exactly (nz * 4) will be written into each of outValueP and outIndexP.
 */
function sortSparseVectorElements(nz, valueP, indexP,
    outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;

  /*
   * Local variables
   */
  var i = 0;
  var p = 0;

  /*
   * Main
   */
  if ((nz | 0) <= 0) {
    return;
  }
  
  for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    I4[(outIndexP + (i << 2)) >> 2] = (indexP + (i << 2)) | 0;
  }

  qsortBM(outIndexP, nz, 4, 2);
  
  for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    p = I4[outIndexP >> 2] | 0;
    I4[outIndexP >> 2] = I4[p >> 2] | 0;
    p = (p - indexP) | 0;
    F4[outValueP >> 2] = F4[(valueP + p) >> 2];
    
    outValueP = (outValueP + 4) | 0;
    outIndexP = (outIndexP + 4) | 0;
  }
}

/**
 * Sums up repeated indices in a sparse vector
 * and returns a new sparse vector with unique indices.
 *
 * This method uses exactly (nz * 4) bytes at tmpP.
 *
 * Exactly 4 bytes will be written into outNzP.
 * This function uses exactly (nz * 4) bytes at outValueP and outIndexP,
 * even when the resulting vector is smaller than that.
 *
 * The current implementation sorts elements by indices but this behavior may
 * change in future.
 */
function unique(nz, valueP, indexP,
    outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  outNzP = outNzP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var value = 0.0;
  var index = 0;
  var previousIndex = 0;
  var newNz = 0;
  var newValue = 0.0;

  /*
   * Main
   */
  sortSparseVectorElements(nz, valueP, indexP, outValueP, outIndexP);
  valueP = outValueP;
  indexP = outIndexP;

  index = I4[indexP >> 2] | 0;
  indexP = (indexP + 4) | 0;
  value = +F4[valueP >> 2];
  valueP = (valueP + 4) | 0;
  newValue = value;
  previousIndex = index;

  for (i = 1; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    index = I4[indexP >> 2] | 0;
    indexP = (indexP + 4) | 0;
    value = +F4[valueP >> 2];
    valueP = (valueP + 4) | 0;
    
    if ((index >>> 0) == (previousIndex >>> 0)) {
      newValue = newValue + value;
    } else {
      F4[outValueP >> 2] = newValue;
      U4[outIndexP >> 2] = previousIndex;
      
      newValue = value;
      
      newNz = (newNz + 1) | 0;
      outValueP = (outValueP + 4) | 0;
      outIndexP = (outIndexP + 4) | 0;
    }
    
    previousIndex = index;
  }

  newNz = (newNz + 1) | 0;
  I4[outNzP >> 2] = newNz;
  F4[outValueP >> 2] = newValue;
  U4[outIndexP >> 2] = previousIndex;
}

/**
 * Based on ConvertUTF.c by Unicode, Inc.
 * Endian dependent.
 *
 * @param {int} inPP - byte offset to a byte offset to uint16s
 * @param {int} inEnd - byte offset to the end of inputs
 * @param {int} outPP - byte offset to a byte offset to uint8s
 * @param {int} outEnd - byte offset to the end of outputs
 * @returns {signed} - error code
 */
function uc_convertUtf16toUtf8(inPP, inEnd, outPP, outEnd) {
  /*
   * Type annotations
   */
  inPP = inPP | 0;
  inEnd = inEnd | 0;
  outPP = outPP | 0;
  outEnd = outEnd | 0;
  
  /*
   * Local variables
   */
  var SUR_HIGH_START = 0xd800;
  var SUR_HIGH_END = 0xdbff;
  var SUR_LOW_START = 0xdc00;
  var SUR_LOW_END = 0xdfff;
  var HALF_SHIFT = 10;
  var HALF_BASE = 0x0010000;
  // var HALF_MASK = 0x3ff;
  var BYTE_MASK = 0xBF;
  var BYTE_MARK = 0x80;
  // var ERROR_SOURCE_EXHAUSTED = 1;
  var ERROR_TARGET_EXHAUSTED = 2;
  var ERROR_SOURCE_ILLEGAL = 3;
  var ch = 0;
  var ch2 = 0;
  var bytesToWrite = 0;
  var inP = 0;
  var outP = 0;
  var firstByteMask = 0;
  
  /*
   * Main
   */
  inP = U4[inPP >> 2] | 0;
  outP = U4[outPP >> 2] | 0;      
  while ((inP | 0) < (inEnd | 0)) {
    ch = U2[inP >> 1] | 0;
    inP = (inP + 2) | 0;
    
    // check if ch is a high surrogate
    if (((ch | 0) >= (SUR_HIGH_START | 0)) &
          ((ch | 0) <= (SUR_HIGH_END | 0))) {
      if ((inP | 0) < (inEnd | 0)) {
        ch2 = U2[inP >> 1] | 0;
        
        // check if ch2 is a low surrogate
        if (((ch2 | 0) >= (SUR_LOW_START | 0)) &
            ((ch2 | 0) <= (SUR_LOW_END | 0))) {
          ch = (((ch - SUR_HIGH_START) << HALF_SHIFT) +
            ((ch2 - SUR_LOW_START) + HALF_BASE)) | 0;
          inP = (inP + 2) | 0;
        }
      } else {
        // Input utf-16 string is ill-formed.
        inP = (inP - 2) | 0;
        return ERROR_SOURCE_ILLEGAL | 0;
      }
      
      U1[outP >> 0] = ch;
    } // end if surroge
    
    // How many bytes will the result require?
    if ((ch | 0) < 0x80) {
      bytesToWrite = 1;
    } else if ((ch | 0) < 0x800) {
      bytesToWrite = 2;
    } else if ((ch | 0) < 0x10000) {
      bytesToWrite = 3;
    } else if ((ch | 0) < 0x110000) {
      bytesToWrite = 4;
    } else {
      bytesToWrite = 3;
      ch = 0xffffffff;
    }
    
    // Write bytes
    outP = (outP + bytesToWrite) | 0;
    if ((outP | 0) > (outEnd | 0)) {
      return ERROR_TARGET_EXHAUSTED | 0;
    }
    
    switch (bytesToWrite | 0) {
      case 4:
        outP = (outP - 1) | 0;
        U1[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
        ch = ch >> 6;
        /* falls through */
      case 3:
        outP = (outP - 1) | 0;
        U1[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
        ch = ch >> 6;
        /* falls through */
      case 2:
        outP = (outP - 1) | 0;
        U1[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
        ch = ch >> 6;
        /* falls through */
      case 1:
        outP = (outP - 1) | 0;
        if ((bytesToWrite | 0) == 1){
          firstByteMask = 0;
        } else if ((bytesToWrite | 0) == 2) {
          firstByteMask = 0xc0;
        } else if ((bytesToWrite | 0) == 3) {
          firstByteMask = 0xe0;              
        } else {
          firstByteMask = 0xf0;
        }

        U1[outP >> 0] = (ch | firstByteMask);
    } // end switch
    outP = (outP + bytesToWrite) | 0;
  } // end while
  
  U4[inPP >> 2] = inP | 0;
  U4[outPP >> 2] = outP | 0;
  
  return 0;
}

/**
 * @parma {int} b - first byte of a utf-8 sequence
 * @returns {signed} - number of trailing bytes for the sequence
 */
function trailingBytesForUtf8(b) {
  /*
   * Type annotations
   */
  b = b | 0;
  
  /*
   * Main
   */   
  b = b & 0xff;
  if ((b | 0) < 192) {
    return 0;
  } else if ((b | 0) < 224) {
    return 1;
  } else if ((b | 0) < 240) {
    return 2;
  } else if ((b | 0) < 248){
    return 3;
  }
  
  
  // invalid
  return 0xff;
}

/**
 * Based on ConvertUTF.c by Unicode, Inc.
 * Endian dependent.
 *
 * @param {int} inPP - byte offset to a byte offset to uint16s
 * @param {int} inEnd - byte offset to the end of inputs
 * @param {int} outPP - byte offset to a byte offset to uint8s
 * @param {int} outEnd - byte offset to the end of outputs
 * @returns {signed} - error code
 */
function convertUtf8toUtf16(inPP, inEnd, outPP, outEnd) {
  /*
   * Type annotations
   */
  inPP = inPP | 0;
  inEnd = inEnd | 0;
  outPP = outPP | 0;
  outEnd = outEnd | 0;
  
  /*
   * Local variables
   */
  var SUR_HIGH_START = 0xd800;
  var SUR_LOW_START = 0xdc00;
  var SUR_LOW_END = 0xdfff;
  var HALF_SHIFT = 10;
  var HALF_BASE = 0x0010000;
  var HALF_MASK = 0x3ff;
  var ERROR_SOURCE_EXHAUSTED = 1;
  var ERROR_TARGET_EXHAUSTED = 2;
  var ERROR_SOURCE_ILLEGAL = 3;
  var result = 0;
  var ch = 0;
  var v = 0;
  var inP = 0;
  var outP = 0;
  var extraBytesToRead = 0;
  
  /*
   * Main
   */
  inP = U4[inPP >> 2] | 0;
  outP = U4[outPP >> 2] | 0;  
  while ((inP | 0) < (inEnd | 0)) {
    ch = 0;
    v = U1[inP >> 0] | 0;
    extraBytesToRead = trailingBytesForUtf8(v) | 0;
    if ((extraBytesToRead | 0) >= ((inEnd - inP) | 0)) {
      result = ERROR_SOURCE_EXHAUSTED | 0;
      break;
    }
    
    // if (!isLegalUtf8)
            
    switch (extraBytesToRead | 0) {
      case 3:
        v = U1[inP >> 0] | 0;
        ch = (ch + v) | 0;
        inP = (inP + 1) | 0;
        ch = ch << 6;
        /* falls through */
      case 2:
        v = U1[inP >> 0] | 0;
        ch = (ch + v) | 0;
        inP = (inP + 1) | 0;
        ch = ch << 6;
        /* falls through */
      case 1:
        v = U1[inP >> 0] | 0;
        ch = (ch + v) | 0;
        inP = (inP + 1) | 0;
        ch = ch << 6;
        /* falls through */
      case 0:
        v = U1[inP >> 0] | 0;
        ch = (ch + v) | 0;
        inP = (inP + 1) | 0;
    }
    
    switch (extraBytesToRead | 0) {
      case 3:
        ch = (ch - 0x3c82080) | 0;
        break;
      case 2:
        ch = (ch - 0xe2080) | 0;
        break;
      case 1:
        ch = (ch - 0x3080) | 0;
        break;
    }

    if ((outP | 0) >= (outEnd | 0)) {
      inP = (inP - extraBytesToRead + 1) | 0;
      result = ERROR_TARGET_EXHAUSTED;
      break;
    }
    
    if ((ch | 0) <= 0xffff) {
      // if BMP
      if (((ch | 0) >= (SUR_HIGH_START | 0)) &
        ((ch | 0) <= (SUR_LOW_END | 0))) {
        inP = (inP - extraBytesToRead + 1) | 0;
        result = ERROR_SOURCE_ILLEGAL = 3;
        break;
      } else {
        U2[outP >> 1] = ch | 0;
        outP = (outP + 2) | 0;
      }
    } else if ((ch | 0) > 0x10ffff) {
      // if outside Unicode
      result = ERROR_SOURCE_ILLEGAL | 0;
      inP = (inP - extraBytesToRead + 1) | 0;
      break;
    } else {
      // if non-BMP
      if ((outP | 0) >= (outEnd | 0)) {
        inP = (inP - extraBytesToRead + 1) | 0;
        result = ERROR_TARGET_EXHAUSTED;
        break;
      }
      ch = (ch - HALF_BASE) | 0;
      U2[outP >> 1] = ((ch >> HALF_SHIFT) + SUR_HIGH_START) | 0;
      outP = (outP + 2) | 0;
      U2[outP >> 1] = ((ch & HALF_MASK) + SUR_LOW_START) | 0;
    }
    
  } // end while
  
  U4[inPP >> 2] = inP | 0;
  U4[outPP >> 2] = outP | 0;
  
  return result | 0;
}

/**
 * Check if the current environment is little-endian or not.
 *
 * @returns {signed} - 1 if little-endian, otherwise 0
 */
function isLittleEndian() {
  /*
   * Local variables
   */
  var c = 0;
  var result = 0;
  
  /*
   * Main
   */
  c = U2[0 >> 1] | 0;
  U1[0 >> 0] = 0;
  U1[1 >> 0] = 1;
  result = U2[0 >> 1] >>> 8;
  U2[0 >> 1] = c | 0;
  
  return result | 0;
}

/**
 * Reduce the dimensionality of a sparse vectory by using the unbiased
 * feature hashing algorithm (Weinberger et al., 2009).
 *
 * Exactly (nz * 4) bytes will be written into outValueP,
 * as well as into outIndexP.
 *
 * Note that the resulting sparse vector may repeat the same index.
 * For example, {index: [1, 10, 100], value: [1.0, 2.0, 3.0]} can be hashed
 * to {index: [2, 4, 2], value: [-1.0, 2.0, 3.0]}.
 * Repeated indices are not allowed in several standards such as
 * Sparse BLAS (see Section 3.4.3 of the BLAS Technical Forum standard)
 * but are ok if all you need is dot product, since dotting is
 * distributive (a * (b + c) = a * b + a * c).
 */
function featureHashing(nz, valueP, indexP, seed, dimension,
  outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  seed = seed | 0;
  dimension = dimension | 0; // must be a power of 2
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var hashValue = 0;
  var sign = 0.0;
  var value = 0.0;
  var index = 0;
  var mask = 0;

  /*
   * Main
   */
  mask = (dimension - 1) | 0;
  for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    value = +F4[valueP >> 2];
    hashValue = MurmurHash3_x86_32(indexP, 1, seed) | 0;
    sign = +((hashValue >> 31) | 1);
    value = sign * value;
    // console.log(value);
    index = (hashValue & mask) | 0;

    F4[outValueP >> 2] = value;
    U4[outIndexP >> 2] = index;
    
    valueP = (valueP + 4) | 0;
    indexP = (indexP + 4) | 0;
    outValueP = (outValueP + 4) | 0;
    outIndexP = (outIndexP + 4) | 0;
  }
}

/**
 * Applies feature hashing to an instance for each class/position and
 * generate new sparse vectors
 *
 * If the sum of nzs is x, x * numberOfClasses will be written to
 * each outValueP and 
 */
function featureHashingSequence(nzP, valueP, indexP,
  numberOfClasses, pathLength, dimension, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nzP = nzP | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  numberOfClasses = numberOfClasses | 0;
  pathLength = pathLength | 0;
  dimension = dimension | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;

  /*
   * Local variables
   */
  var i = 0;
  var nz = 0;
  var end = 0;

  /*
   * Main
   */
  end = (nzP + (pathLength << 2)) | 0;

  while ((nzP | 0) < (end | 0)) {
    nz = U4[nzP >> 2] | 0;

    for (i = 0; (i | 0) < (numberOfClasses | 0); i = (i + 1) | 0) {
      featureHashing(nz, valueP, indexP, i, dimension,
        outValueP, outIndexP);
      outValueP = (outValueP + (nz << 2)) | 0;
      outIndexP = (outIndexP + (nz << 2)) | 0;
    }

    nzP = (nzP + 4) | 0;
    valueP = (valueP + (nz << 2)) | 0;
    indexP = (indexP + (nz << 2)) | 0;
  }
}

/**
 * Updates a table of feature scores.
 *
 * A feature score is a dot product between a weight vector and
 * a feature vector. We pre-calculate dot products for transition-type features
 * and state-type features separately, and then combine the results here to
 * obtain correct dot products.
 *
 * A table of feature scores is a 3-dimensional array
 * float[chainLength][numberOfStates][numberOfStates].
 * If i = 0, score[0][0][k] represents the state score where the current
 * time is 0, the previous state is a (hypothetical) initial state,
 * and the current state is k,
 * If i > 0, score[i][j][k] represents the state score where the current
 * time is i, and the previous state is j, and the current state is k.
 *
 * Exactly (chainLength * (numberOfStates ^ 2) * 4) bytes will be written
 * into outP.
 */
function updateFeatureScores(biasScoreP, transitionScoreP,
  stateScoreP, numberOfStates, chainLength, outP) {
  /*
   * Type annotations
   */
  biasScoreP = biasScoreP | 0;
  transitionScoreP = transitionScoreP | 0;
  stateScoreP = stateScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var time = 0;
  var cur = 0;
  var prev = 0;
  var score = 0.0;
  var stateScore = 0.0;
  var transitionScore = 0.0;
  var biasScore = 0.0;
  var stateScorePSave = 0;
  var transitionScorePSave = 0;
  var nosBytes = 0;
    
  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }

  nosBytes = numberOfStates << 2;
  biasScore = +F4[biasScoreP >> 2];
  
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    // stateScores[0][cur]
    stateScore = +F4[stateScoreP >> 2];
    // transitionScores[0][cur]
    transitionScore = +F4[transitionScoreP >> 2];

    score = stateScore + transitionScore + biasScore;
    
    F4[outP >> 2] = score;
    
    stateScoreP = (stateScoreP + 4) | 0;
    transitionScoreP = (transitionScoreP + 4) | 0;
    outP = (outP + 4) | 0;
  }
  
  outP = (outP + ((imul(numberOfStates, numberOfStates - 1) << 2))) | 0;
  
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    transitionScorePSave = transitionScoreP;
    
    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      stateScorePSave = stateScoreP;

      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        // stateScores[time][cur]
        stateScore = +F4[stateScoreP >> 2];
      
        // transitionScores[prev + 1][cur]
        transitionScore = +F4[transitionScoreP >> 2];
        
        score = stateScore + transitionScore + biasScore;
        
        F4[outP >> 2] = score;
        
        stateScoreP = (stateScoreP + 4) | 0;
        transitionScoreP = (transitionScoreP + 4) | 0;
        outP = (outP + 4) | 0;
      }
      
      stateScoreP = stateScorePSave;
    }

    stateScoreP = (stateScoreP + nosBytes) | 0;    
    transitionScoreP = transitionScorePSave;
  }     
}

/**
 * Updates a table of forward scores.
 *
 * A table of forward scores is a 2-dimensional array
 * float[chainLength][numberOfStates].
 *
 * Exactly (chainLength * numberOfStates * 4) bytes will be written into
 * outP. Uses exactly (numberOfStates * 4) bytes at tmpP. They are not
 * required to be initialized to 0.
 * 
 * @param {int} featureScoreP - byte offset to a table of feature scores
 * @param {int} numberOfStates - number of the states of a Markov chain
 * @param {int} chainLength - length of a Markov chain
 * @parma {int} tmpP - byte offset to working space
 * @param {int} outP - byte offset where the output will be written
 */
function updateForwardScores(featureScoreP, numberOfStates,
    chainLength, tmpP, outP) {
  /*
   * Type annotations
   */
  featureScoreP = featureScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  tmpP = tmpP | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var time = 1;
  var cur = 0;
  var prev = 0;
  var featureScore = 0.0;
  var previousScore = 0.0;
  var score = 0.0;
  var p = 0;
  var prevP = 0;
  var prevPSave = 0;
  var nosBytes = 0;

  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }
  
  nosBytes = numberOfStates << 2;
  p = featureScoreP;
  prevP = outP;
  
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    // forwardScores[0][cur] = featureScores[0][0][cur];
    score = +F4[p >> 2];
    F4[outP >> 2] = F4[p >> 2];

    p = (p + 4) | 0;
    outP = (outP + 4) | 0;
  }
  
  p = (p + (imul(numberOfStates, numberOfStates - 1) << 2)) | 0;

  // forwardScores[time][cur] = logsumexp(
  //   featureScores[time][0][cur] + forwardScores[time - 1][0],
  //   featureScores[time][1][cur] + forwardScores[time - 1][1],
  //   ...
  // )
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {  
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      prevPSave = prevP;
      for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
        // featureScores[time][prev][cur]
        featureScore = +F4[p >> 2];
        // forwardScores[time - 1][prev]
        previousScore = +F4[prevP >> 2];
        
        score = featureScore + previousScore;
        
        F4[tmpP >> 2] = score;
        
        p = (p + nosBytes) | 0;
        prevP = (prevP + 4) | 0;
        tmpP = (tmpP + 4) | 0;
      } 
      tmpP = (tmpP - nosBytes) | 0;

      F4[outP >> 2] = +logsumexpFloat32(tmpP, numberOfStates);

      prevP = prevPSave;
      outP = (outP + 4) | 0;
      
      // from featureScores[time][numberOfStates][cur]
      // to featureScores[time][0][cur + 1]
      p = (p - imul(nosBytes, numberOfStates) + 4) | 0;
    }
    // advance prevP to forwardScores[time][0]
    prevP = (prevP + nosBytes) | 0;

    // Note that featureScores[time][0][numberOfStates]
    // is the same as featureScores[time][1][0]
    p = (p + imul(nosBytes, numberOfStates - 1)) | 0;
  }
}

/**
 * Updates a table of backward scores.
 *
 * A table of backward scores is a 2-dimensional array
 * float[chainLength][numberOfStates].
 *
 * Exactly (chainLength * numberOfStates * 4) bytes will be written
 * into outP. Uses exactly (numberOfStates * 4) bytes at tmpP. They are not
 * required to be initialized to 0.
 *
 * @param {int} featureScoreP - byte offset to a table of feature scores
 * @param {int} numberOfStates - number of the states of a Markov chain
 * @param {int} chainLength - length of a Markov chain
 * @parma {int} tmpP - byte offset to working space
 * @param {int} outP - byte offset where the output will be written
 */
function updateBackwardScores(featureScoreP, numberOfStates,
    chainLength, tmpP, outP) {
  /*
   * Type annotations
   */
  featureScoreP = featureScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  tmpP = tmpP | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var time = 1;
  var cur = 0;
  var next = 0;
  var featureScore = 0.0;
  var nextScore = 0.0;
  var score = 0.0;
  var p = 0;
  var nextP = 0;
  var nextPSave = 0;
  var t = 0;
  var nosBytes = 0;
  var nosBytes2 = 0;
  var featureScoreRelocationBytes = 0;
  var featureScoreRelocationBytes2 = 0;

  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }
  
  nosBytes = numberOfStates << 2;
  nosBytes2 = nosBytes << 1;
  featureScoreRelocationBytes = imul(numberOfStates, numberOfStates) << 2;
  featureScoreRelocationBytes2 = featureScoreRelocationBytes << 1;
  
  // backwardScores[chainLength - 1][cur] = 0
  t = imul(numberOfStates, chainLength - 1) << 2;
  outP = (outP + t) | 0;
  nextP = outP; // save position to use it later

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    F4[outP >> 2] = 0.0;
    outP = (outP + 4) | 0;
  }

  outP = (outP - nosBytes2) | 0;
  p = (featureScoreP + imul(featureScoreRelocationBytes,
    chainLength - 1)) | 0;

  // backwardScores[time][cur] = logsumexp(
  //   featureScores[time + 1][cur][0] + backwardScores[time + 1][0],
  //   featureScores[time + 1][cur][1] + backwardScores[time + 1][1],
  //   ...
  // )
  for (time = (chainLength - 2) | 0; (time | 0) >= 0; time = (time - 1) | 0) {  
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      nextPSave = nextP;

      for (next = 0; (next | 0) < (numberOfStates | 0); next = (next + 1) | 0) {
        // featureScores[time][cur][next]
        featureScore = +F4[p >> 2];

        // backwardScores[time + 1][next]
        nextScore = +F4[nextP >> 2];
        
        score = featureScore + nextScore;
        
        F4[tmpP >> 2] = score;
        
        p = (p + 4) | 0;
        nextP = (nextP + 4) | 0;
        tmpP = (tmpP + 4) | 0;
      } 
      tmpP = (tmpP - nosBytes) | 0;
                
      F4[outP >> 2] = +logsumexpFloat32(tmpP, numberOfStates);

      nextP = nextPSave;
      outP = (outP + 4) | 0;
    }
    p = (p - featureScoreRelocationBytes2) | 0;
    nextP = (nextP - nosBytes) | 0;
    outP = (outP - nosBytes2) | 0;
  }
}

function getNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength) {
  /*
   * Type annotations
   */
  forwardScoreP = forwardScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;

  /*
   * Local variables
   */
  var t = 0;

  /*
   * Main
   */
  if ((chainLength | 0) <= 0) {
    return 0.0;
  }
  
  t = imul(numberOfStates << 2, chainLength - 1);
  forwardScoreP = (forwardScoreP + t) | 0;

  return +logsumexpFloat32(forwardScoreP, numberOfStates);
}

/**
 * Updates a table of joint scores, overwriting feature scores.
 *
 * A table of joint scores is a 3-dimensional array
 * float[chainLength][numberOfStates][numberOfStates].
 * If i = 0, score[0][0][k] represents the joint probability in logarithmic
 * scale that the current time is 0, the previous state is a (hypothetical)
 * initial state, and the current state is k.
 * If i > 0, score[i][j][k] represents the joint probability in logarithmic
 * scale that the current time is i, the previous state is j,
 * and the current state is k.
 *
 * Data will be overwrriten into a table of feature scores.
 */
function updateJointScores(featureScoreP, forwardScoreP,
    backwardScoreP, normalizationFactorP, numberOfStates, chainLength) {
  /*
   * Type annotations
   */
  featureScoreP = featureScoreP | 0;
  forwardScoreP = forwardScoreP | 0;
  backwardScoreP = backwardScoreP | 0;
  normalizationFactorP = normalizationFactorP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;

  /*
   * Local variables
   */
  var outP = 0;
  var time = 0;
  var cur = 0;
  var prev = 0;
  var score = 0.0;
  var normalizationFactor = 0.0;
  var forwardScore = 0.0;
  var backwardScore = 0.0;
  var backwardScorePSave = 0;
  var nosBytes = 0;
    
  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }

  normalizationFactor = +F4[normalizationFactorP >> 2];
  outP = featureScoreP; // overwrite
  nosBytes = numberOfStates << 2;
  
  // score[0][0][cur] = featureScores[0][0][cur] +
  //   backwardScores[0][cur] - normalizationFactor
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    backwardScore = +F4[backwardScoreP >> 2];

    score = +F4[outP >> 2];
    score = score + backwardScore - normalizationFactor;
    F4[outP >> 2] = score;
    
    backwardScoreP = (backwardScoreP + 4) | 0;
    outP = (outP + 4) | 0;
  }
  
  outP = (outP + ((imul(numberOfStates, numberOfStates - 1) << 2))) | 0;
  
  // score[time][prev][cur] = featureScores[time][prev][cur] +
  //   forwardScores[time - 1][prev]
  //   backwardScores[time][cur]
  //   - normalizationFactor
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      backwardScorePSave = backwardScoreP;
      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        backwardScore = +F4[backwardScoreP >> 2];
        forwardScore = +F4[forwardScoreP >> 2];

        score = +F4[outP >> 2];
        score = score + forwardScore + backwardScore -
          normalizationFactor;
        F4[outP >> 2] = score;
        
        outP = (outP + 4) | 0;
        backwardScoreP = (backwardScoreP + 4) | 0;
      }
      backwardScoreP = backwardScorePSave;
      forwardScoreP = (forwardScoreP + 4) | 0;
    }
    backwardScoreP = (backwardScoreP + nosBytes) | 0;
  }
}

/**
 * Lazily calculates an updated value for AdaGrad-L1.
 *
 * @param {double} fov
 * @param {double} sov
 * @param {double} round
 * @param {double} delta
 * @param {double} eta
 * @param {double} lambda
 * @returns {double}
 */
function adagradLazyValue(fov, sov, round, delta, eta, lambda) {
  /*
   * Type annotations
   */
  fov = +fov;
  sov = +sov;
  round = +round;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;
  
  /*
   * Local variables
   */
  var result = 0.0;
  
  /*
   * Main
   */
  if (fov == 0.0) {
    return 0.0;
  }

  result = abs(fov) / round;
  result = result - lambda;
  result = max(0.0, result);

  if (result == 0.0) {
   return 0.0;
  }

  if (fov > 0.0) {
   result = result * -1.0;
  }

  result = result * eta * round;

  result = result / (delta + sqrt(sov));

  return +result;
}

function adagradUpdateLazyAt(index, foiP, soiP, weightP,
    round, delta, eta, lambda) {
  /*
   * Type annotations
   */
  index = index | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;
  weightP = weightP | 0;
  round = +round;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;
  
  /*
   * Local variables
   */
  var relativeByteOffset = 0;
  var p1 = 0;
  var p2 = 0;
  var p3 = 0;
  
  /*
   * Main
   */
  relativeByteOffset = index << 2; 
  p1 = (foiP + relativeByteOffset) | 0;
  p2 = (soiP + relativeByteOffset) | 0;
  p3 = (weightP + relativeByteOffset) | 0;
  F4[p3 >> 2] = +adagradLazyValue(
    +F4[p1 >> 2], +F4[p2 >> 2],
    round, delta, eta, lambda
  );
}

function adagradUpdateLazy(nz, indexP, foiP, soiP, weightP,
  round, delta, eta, lambda) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  indexP = indexP | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;
  weightP = weightP | 0;
  round = +round;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;

  /*
   * Local variables
   */
  var end = 0;
  var index = 0;
  
  /*
   * Main
   */
  end = (indexP + (nz << 2)) | 0;
  while ((indexP | 0) < (end | 0)) {
    index = U4[indexP >> 2] | 0;

    adagradUpdateLazyAt(index, foiP, soiP, weightP,
      round, delta, eta, lambda);

    indexP = (indexP + 4) | 0;        
  }
}

/**
 * Performs temporary updating for the first order information and
 * second order information of AdaGrady with a gradient.
 * Actual values will be calculated lazily.
 *
 * @param {int} nz - number of non-zero elements in a gradient
 * @param {int} xP - byte offset to float values of a gradient
 * @param {int} indexP - byte offset to uint32 indices of a gradient
 * @param {int} foiP - byte offset to a float dense vec 1st order info
 * @param {int} soiP - byte offset to a float dense vec 2nd order info
 */
function adagradUpdateTemp(nz, xP, indexP, foiP, soiP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  xP = xP | 0;
  indexP = indexP | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;

  /*
   * Local variables
   */
  var end = 0;
  var index = 0;
  var value = 0.0;
  var p1 = 0;
  var p2 = 0;

  /*
   * Main
   */
  end = (indexP + (nz << 2)) | 0;
  while ((indexP | 0) < (end | 0)) {
    index = U4[indexP >> 2] | 0;
    value = +F4[xP >> 2];
            
    p1 = (foiP + (index << 2)) | 0;
    p2 = (soiP + (index << 2)) | 0;
    
    F4[p1 >> 2] = +F4[p1 >> 2] + value;
    F4[p2 >> 2] = +F4[p2 >> 2] + value * value;
    
    indexP = (indexP + 4) | 0;
    xP = (xP + 4) | 0;
  }
}

/**
 * Updates a table of state scores.
 *
 * A table of state scores is a 2-dimensional array
 * float[chainLength][numberOfStates].
 * score[i][j] represents the state score where the current time is i and
 * the current state is j.
 *
 * Exactly (chainLength * numberOfStates) bytes will be written into outP.
 */
function updateStateScores(nzP, valueP, indexP, weightP,
  numberOfStates, chainLength, outP) {
  /*
   * Type annotations
   */
  nzP = nzP | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  weightP = weightP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var end = 0;
  var nz = 0;
  var nzBytes = 0;
  
  /*
   * Main
   */
  end = (nzP + chainLength << 2) | 0;
  while ((nzP | 0) < (end | 0)) {
    nz = U4[nzP >> 2] | 0;
    for (i = 0; (i | 0) < (numberOfStates | 0); i = (i + 1) | 0) {
      susdot(nz, valueP, indexP, weightP, outP);
      outP = (outP + 4) | 0;
    }
    nzP = (nzP + 4) | 0;
    nzBytes = nz << 2;
    valueP = (valueP + nzBytes) | 0;
    indexP = (indexP + nzBytes) | 0;
  }
}

// import updateJointScores from './updateJointScores';

/**
 * Each instance is structured as
 *
 * +---+---+---+---+---+---+
 * |IID|PLN|STP|NZP|VLP|IXP|
 * +---+---+---+---+---+---+
 *
 * IID: instance id
 * PLN: uint32, the length of a path
 * STP: byte offset to textual information about features. 0 if not exsting
 * NZP: byte offset to NZS
 * VLP: byte offset to VALUES
 * IND: byte offset to INDICES
 *
 * NZS: NZP[i] contains the number of non-zero elements at the position i
 * VALUES: float32[PLN][NZS[i]] for i in [0, PLN)
 * INDICES: uint32[PLN][NZS[i]] for i in [0, PLN)
 *
 * Each instance header occupies 24 bytes
 */
// Incomplete
function trainOnline(numberOfStates, dimension, round,
    foiP, soiP, weightP,
    delta, eta, lambda,
    instanceP, tmpP, hashMapP) {
  /*
   * Type annotations
   */
  numberOfStates = numberOfStates | 0;
  dimension = dimension | 0;
  round = round | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;
  weightP = weightP | 0;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;
  instanceP = instanceP | 0;
  tmpP = tmpP | 0;
  hashMapP = hashMapP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var p = 0;
  var nzP = 0;
  var totalNz = 0;
  var chainLength = 0;
  var valueP = 0;
  var indexP = 0;
  var outValueP = 0;
  var outIndexP = 0;
  var biasScoreP = 0;
  var transitionScoreP = 0;
  var transitionScoreTableSize = 0;
  var stateScoreP = 0;
  var featureScoreP = 0;
  var featureScoreTableSize = 0;
  var forwardScoreP = 0;
  var backwardScoreP = 0;
  var normalizationFactor = 0.0;
  var gradientNzP = 0;
  var gradientValueP = 0;
  var gradientIndexP = 0;
  
  /*
   * Main
   */
  
  //
  // Memory allocation
  // outValue: MAX_SPARSE_SIZE (bytes)
  // outIndex: MAX_SPARSE_SIZE (bytes)
  // stateScores: (chainLength * numberOfState * 4) bytes
  // featureScores/jointScores: (chainLength * (numberOfStates ^ 2) * 4) 
  // forwardScores: (chainLength * numberOfStates * 4) bytes
  // backwardScores: (chainLength * numberOfStates * 4) bytes
  // gradient sparse vector: (4 + ... + ...) bytes
  // temporary working space: (numberOfStates * 4)
  p = tmpP;
  outValueP = p;
  p = (p + 16384) | 0; // allocate 16kb
  outIndexP = p;
  p = (p + 16384) | 0; // allocate 16kb
  
  // Uses the first element of a weight vector as a bias term
  biasScoreP = weightP;

  transitionScoreP = (weightP + 4) | 0;
  transitionScoreTableSize = imul(numberOfStates + 1, numberOfStates);
  stateScoreP = (weightP + 4 + (transitionScoreTableSize << 2)) | 0;  
  
  // Uses the path length of an instance as a Markov chain length
  chainLength = U4[(instanceP + 4) >> 2] | 0;
  valueP = U4[(instanceP + 16) >> 2] | 0;
  indexP = U4[(instanceP + 20) >> 2] | 0;
  nzP = U4[(instanceP + 12) >> 2] | 0;
  
  totalNz = sumInt32(nzP, chainLength) | 0;
  
  featureScoreTableSize = (imul(chainLength, numberOfStates),
    numberOfStates);

  featureScoreP = (outIndexP + (featureScoreTableSize << 2)) | 0;
  
  //
  // main
  //
  featureHashingSequence(nzP, valueP, indexP,
    numberOfStates, chainLength, dimension, outValueP, outIndexP);
    
  // update bias and transition scores positions
  for (i = 0; (i | 0) < ((featureScoreTableSize + 1) | 0);
      i = (i + 1) | 0) {
    adagradUpdateLazyAt(i, foiP, soiP, weightP,
      +(round | 0), delta, eta, lambda);
  }
  adagradUpdateLazy(totalNz, indexP, foiP, soiP, weightP,
    +(round | 0), delta, eta, lambda);

  updateStateScores(nzP, valueP, indexP, weightP,
    numberOfStates, chainLength, stateScoreP);
  updateFeatureScores(biasScoreP, transitionScoreP,
    stateScoreP, numberOfStates, chainLength, featureScoreP);
  updateForwardScores(featureScoreP, numberOfStates,
    chainLength, tmpP, forwardScoreP);
  updateBackwardScores(featureScoreP, numberOfStates,
    chainLength, tmpP, backwardScoreP);
  normalizationFactor = +getNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength);
  // updateJointScores(featureScoreP, forwardScoreP, backwardScoreP,
  //   numberOfStates, chainLength, normalizationFactor);
  //updateMarginalScores();
  // updateGradient();
  adagradUpdateTemp(gradientNzP, gradientValueP, gradientIndexP, foiP, soiP);
  // crf_sufferLoss();
}

/**
 * Computes marginal probabilities from logarithmic joint probabilites.
 *
 * A table of marginal probabilities is
 * float[numberOfStates + 1][numberOfStates].
 * score[0][j] represents a marginal from the (hypothetical) initial state
 * to the state j. For i >= 1, score[i][j] represents a marginal from the
 * state (i - 1) to the state j.
 *
 * Unlike joint scores, values in this table represents probabilities in
 * normal scale, not in logarithmic.
 *
 * This function assumes that its output destination is cleared to 0.
 *
 * Exactly ((numberOfStates + 1) * numberOfStates) bytes will be written into
 * outP.
 */
function updateMarginalProbabilities(jointScoreP,
  numberOfStates, chainLength, outP) {
  /*
   * Type annotations
   */
  jointScoreP = jointScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var t = 0.0;
  var jointScore = 0.0;
  var outPSave = 0;
  var time = 0;
  var prev = 0;
  var cur = 0;

  /*
   * Main
   */
  //
  // Sum of logarithmic joint probabilities (multiplication in normal scale)
  //
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    jointScore = +F4[jointScoreP >> 2];
    F4[outP >> 2] = exp(jointScore);
    outP = (outP + 4) | 0;
    jointScoreP = (jointScoreP + 4) | 0;
  }
  outPSave = outP;
  jointScoreP = (jointScoreP +
    (imul(numberOfStates - 1, numberOfStates) << 2)) | 0;

  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        jointScore = +F4[jointScoreP >> 2];
        
        t = +F4[outP >> 2];
        F4[outP >> 2] = t + exp(jointScore);
        
        jointScoreP = (jointScoreP + 4) | 0;
        outP = (outP + 4) | 0;
      }      
    }
    outP = outPSave;
  }
}

/**
 * Given a sparse vector with the form
 *   | index1 | value1 | index2 | value2 | ... 
 * where indices may be repeated, this function makes the indices unique and
 * returns it with the double array representation.
 *
 * TODO: this function is too specific. Break down this to
 * some general functions.
 *
 * Current implementation sorts elements by indices but this behavior may change
 * in future.
 */
function uniqueAndZipSparseVector(nz, inP,
    outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  inP = inP | 0;
  outNzP = outNzP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var value = 0.0;
  var index = 0;
  var previousIndex = 0;
  var newNz = 0;
  var newValue = 0.0;

  /*
   * Main
   */
  if ((nz | 0) <= 0) {
    return;
  }
  
  qsortBM(inP, nz, 8, 0);

  index = U4[inP >> 2] >>> 0;
  inP = (inP + 4) | 0;
  value = +F4[inP >> 2];
  inP = (inP + 4) | 0;
  newValue = value;
  previousIndex = index;

  for (i = 1; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    index = U4[inP >> 2] >>> 0;
    inP = (inP + 4) | 0;
    value = +F4[inP >> 2];
    inP = (inP + 4) | 0;
    
    if ((index >>> 0) == (previousIndex >>> 0)) {
      newValue = newValue + value;
    } else {
      F4[outValueP >> 2] = newValue;
      U4[outIndexP >> 2] = previousIndex;
      
      newValue = value;
      
      newNz = (newNz + 1) | 0;
      outValueP = (outValueP + 4) | 0;
      outIndexP = (outIndexP + 4) | 0;
    }
    
    previousIndex = index;
  }

  newNz = (newNz + 1) | 0;
  I4[outNzP >> 2] = newNz;
  F4[outValueP >> 2] = newValue;
  U4[outIndexP >> 2] = previousIndex;
}

function compareInt32(xP, yP) {
  /*
   * Type annotations
   */
  xP = xP | 0;
  yP = yP | 0;  
  
  /*
   * Main
   */
  return ((I4[xP >> 2] | 0) - (I4[yP >> 2] | 0)) | 0;
}

function compareUint32(xP, yP) {
  /*
   * Type annotations
   */
  xP = xP | 0;
  yP = yP | 0;  
  
  /*
   * Main
   */
  return ((U4[xP >> 2] >>> 0) - (U4[yP >> 2] >>> 0)) | 0;
}

function compareSparseVectorElement(xP, yP) {
  /*
   * Type annotations
   */
  xP = xP | 0;
  yP = yP | 0;
  
  /*
   * Local variables
   */
  var p0 = 0;
  var p1 = 0;

  /*
   * Main
   */
  p0 = I4[xP >> 2] | 0;
  p1 = I4[yP >> 2] | 0;
  
  return ((I4[p0 >> 2] | 0) - (I4[p1 >> 2] | 0)) | 0;
}

/*
 * Definition of function tables.
 * The size of a table must be a power of 2.
 * In a valid asm.js module, this definition must come after
 * function definitions and before its return statement.
 *
 * The name of this variable will be changed into CMP_FUNCTION_TABLE
 * during gulp building phase.
 */
var CMP_FUNCTION_TABLE = [compareInt32, compareUint32, compareSparseVectorElement, compareInt32];

/*
 * Definition of exported functions
 */
return {
  ufmap_create: ufmap_create,
  ufmap_has: ufmap_has,
  ufmap_add: ufmap_add,
  ufmap_get: ufmap_get,
  ufmap_size: ufmap_size,
  maxFloat32: maxFloat32,
  sumFloat32: sumFloat32,
  sumInt32: sumInt32,
  hash: MurmurHash3_x86_32,
  logsumexp: logsumexpFloat32,
  vec_susdot: susdot,
  vec_sortSparseVectorElements: sortSparseVectorElements,
  math_sparse_unique: unique,
  uc_convertUtf16toUtf8: uc_convertUtf16toUtf8,
  uc_convertUtf8toUtf16: convertUtf8toUtf16,
  crf_trainOnline: trainOnline,
  crf_featureHashing: featureHashing,
  crf_featureHashingSequence: featureHashingSequence,
  crf_updateFeatureScores: updateFeatureScores,
  crf_updateForwardScores: updateForwardScores,
  crf_updateBackwardScores: updateBackwardScores,
  crf_updateMarginalProbabilities: updateMarginalProbabilities,
  crf_getNormalizationFactor: getNormalizationFactor,
  crf_updateJointScores: updateJointScores,
  crf_uniqueAndZipSparseVector: uniqueAndZipSparseVector,
  isLittleEndian: isLittleEndian,
  compareInt32: compareInt32,
  compareUint32: compareUint32,
  qsortBM: qsortBM
};


  }
  
  return myAsmjsModule;
}));
