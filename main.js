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

    var Infinity = stdlib.Infinity;
    var NaN = stdlib.NaN;

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
 * Returns the number of 1s in a 32-bit integer and
 * writes out the actual indices of the 1s (0 <= i < 32) into <code>outP</code>.
 * Each index occupies one byte, so at most 32 bytes (32 uint8 integers) will
 * be written into <code>outP</code>.
 *
 * Before using this function, precompute a table at <code>tableP</code>
 * by <code>deBruijnSelectInit</code>.
 *
 * @param {int} tableP - byte offset to the precomputed table
 * @param {int} n - 32-bit integer to be examined
 * @param {int} outP - byte offset into which the results are to be written
 * @returns {signed} - number of 1s found in a word
 *
 * @see Peter Wegner. 1960. A Technique for Counting Ones in a Binary Computer.
 *   Communications of the ACM, 3(5):322, May.
 * @see Charles E. Leiserson, Harald Prokop, and Keith H. Randall. 1998. Using
 *   de Bruijn Sequences to Index a 1 in a Computer Word. Technical report.
 */
function deBruijnSelect(tableP, n, outP) {
  /*
   * Type annotations
   */
  tableP = tableP | 0;
  n = n | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var t = 0;
  var offset = 0;

  /*
   * Main
   */
  while ((n | 0) != 0) {
    // Since 2147483648 & -2147483648 returns -2147483648 in ECMAScript,
    // we need type casting (>>> 0) to unsigned.
    t = (n & -n) >>> 0;
    // 0x077cb531 is a de Bruijn sequence 00000111011111001011010100110001
    offset = imul(t, 0x077cb531) >>> 27;
    U1[(outP + i) >> 0] = U1[(tableP + offset) >> 0];
    n = (n - t) | 0;
    i = (i + 1) | 0;
  }

  return i | 0;
}

/**
 * Initializes a table used in <code>deBruijnSelect</code>.
 * Exactly 32 bytes will be written into outP.
 */
function deBruijnSelectInit(outP) {
  /*
   * Type annotations
   */
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var offset = 0;

  /*
   * Main
   */
  for (i = 0; (i | 0) < 32; i = (i + 1) | 0) {
    // 0x077cb531 is a de Bruijn sequence 00000111011111001011010100110001
    offset = (0x077cb531 << i) >>> 27;
    U1[(outP + offset) >> 0] = i;
  }
}

/**
 * Returns the next highest power of 2 for a positive unsigned 32-bit integer
 * in [1, 2^31]. The returned value will be signed due to asm.js constraints,
 * so use <code>>></code> for unsigned type cast. (Specifically, this returns
 * -2147483648 if the input is in (2^30, 2^31]).
 *
 * If the given value is already a power of 2, this function returns the same
 * value. If the given value is 0 or more than 2^31, this function returns 0.
 *
 * This algorithm was first devised by Pete Hart and William Lewis in February
 * of 1997, and later independetly discovered by Sean Anderson in
 * Semptember 14, 2001.
 * See http://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2
 *
 * @param {int} v - unsigned 32-bit integer
 * @returns {signed} - next highest power of 2
 */
function nextPow2(v) {
  /*
   * Type annotations
   */
  v = v | 0;

  /*
   * Main
   */
  v = v >>> 0;
  v = (v - 1) >>> 0;

  v = v | (v >>> 1);
  v = v | (v >>> 2);
  v = v | (v >>> 4);
  v = v | (v >>> 8);
  v = v | (v >>> 16);

  v = (v + 1) >>> 0;
  
  return v | 0;
}

/*
 * Implementation note:
 * Currently
 &
 * +---+---+---+---+
 * |LEN|LIM|LBS|FLG| (more-->)
 * +---+---+---+---+
 *
 * +==================+==================+
 * |... LOWER_BITS ...|... HIGHER_BITS...|
 * +==================+==================+
 *
 * Header
 * LEN: number of items ("number of 1s" if regarded as a rank-select dict.)
 * LIM: max value + 1 ("size of a bitmap" if regarded as a ranke-select dict.)
 * LBS: lower bits size, or the number of bits per item in lower bits
 * FLG: reserved space for future expansions
 */
    
/**
 * Creates an Elias-Fano structure for a sequence of unsigned integers.
 *
 * The structure is useful for compressing a sparse set of unsigned integers
 * with several primitive operations retained (e.g., rank, select, and succ).
 *
 * Before using this function, perform deBruijnSelectInit to precompute a table
 * at <code>deBruijnTableP</code>.
 *
 * If length is 1, ra      [2^31 + 1, 2^32 - 1] are disallowed.
 *
 * Although Elias-Fano can be more efficient by using an auxiliary "rank-select"
 * strucure, currently this code does not implement the strategy.
 *
 * This data structure uses n log (m / n)  + O(n) bits where n is the number
 * of items and m is the maximum value of in a sequence.
 * The exact size in bytes can be estimated by using eliasFanoEstimateByteSize.
 *
 * @param {int} p - byte offset to 32-bit unsigned integers
 * @param {int} len - length of the input
 * @param {int} deBruijnTableP - byte offset to the sequence of de Bruijn consts
 * @param {int} outP - byte offset into which the result will be written
 * @returns {int} - 0 if successfully created, otherwise a positive value
 */
function eliasFano(p, len, deBruijnTableP, outP) {
  /*
   * Type annotations
   */
  p = p | 0;
  len = len | 0;
  deBruijnTableP = deBruijnTableP | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var lim = 0.0;
  var lowerBitsSize = 0;
  var lowerBitsSizePow2 = 0;
  var numberOfBuckets = 0;
  var t = 0.0;
  var t2 = 0;
  
  /*
   * Main
   */

  // TODO: initialize to zero for outP
  // TODO: sort and unique here
  
  lim = (+(U4[(p + ((len - 1) << 2)) >> 2] >>> 0)) + 1.0;
  t = lim / (+(len | 0));
  
  // ceil(log2(t)) == log2(nextPow2(ceil(t))) for [1, 2^31]
  t2 = (nextPow2(~~ceil(t)) | 0) >>> 0;
  t2 = deBruijnSelect(deBruijnTableP, t2, outP) | 0;

  // if ((t2 | 0) != 1) { // asserts t2 is a power of 2
  //   throw new Error('Assertion failed: not power of 2');
  // }  

  lowerBitsSize = U1[outP >> 0] | 0;
  lowerBitsSizePow2 = (1 << lowerBitsSize) | 0;
  numberOfBuckets = ~~ceil(lim / +(lowerBitsSizePow2 | 0));

  U4[outP >> 2] = len;
  U4[(outP + 4) >> 2] = ~~lim;
  U4[(outP + 8) >> 2] = lowerBitsSize;
  U4[(outP + 12) >> 2] = 0;

  outP = (outP + 16) | 0; // header size

  createLowerBits(p, len, lowerBitsSize, outP);
  outP = (outP + imul(lowerBitsSize, len)) | 0; // TODO: correct this to align Uint32

  createHigherBits(p, len, lowerBitsSize, outP);
  
  return 0;
}

function createLowerBits(p, len, lowerBitsSize, outP) {
  /*
   * Type annotations
   */
  p = p | 0;
  len = len | 0;
  lowerBitsSize = lowerBitsSize | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var end = 0;
  var mask = 0;
  
  // variables for the bit output stream idiom
  var v = 0;
  var bitIndex = 0;
  var bitLength = 0;
  var crossing = 0;
  var byteOffset = 0;
  var bitOffset = 0;
  
  /*
   * Main
   */
  if ((lowerBitsSize | 0) == 0) {
    return;
  }

  end = (p + (len << 2)) | 0;
  bitLength = lowerBitsSize;
  mask = 1 << lowerBitsSize;
  
  for (p = 0; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = U4[p >> 2] & mask;
    
    // bit output stream idiom
    byteOffset = bitIndex >>> 5;
    bitOffset = bitIndex & 0x1f;
    crossing = (bitOffset + bitLength - 1) >>> 5;
    U4[byteOffset >> 2] = U4[byteOffset >> 2] | (v << bitOffset);
    U4[(byteOffset + 4) >> 2] = U4[(byteOffset + 4) >> 2]
      | (v << bitOffset);

    bitIndex = (bitIndex + lowerBitsSize) | 0;
  }
}

// Beware that Vigna 2013 and Golynski 2014 have slightly different
// formations for creating higher bits; here we use Golynski 2014
function createHigherBits(p, len, lowerBitsSize, outP) {
  /*
   * Type annotations
   */
  p = p | 0;
  len = len | 0;
  lowerBitsSize = lowerBitsSize | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var end = 0;
  var higherBits = 0;
  var previousHigherBits = 0;
  var unarySize = 0;

  // variables for the bit output stream idiom
  var v = 0;
  var bitIndex = 0;
  var bitLength = 0;
  var byteOffset = 0;
  var crossing = 0;
  var bitOffset = 0;

  /*
   * Main
   */
  end = (p + (len << 2)) | 0;
  
  for (p = 0; (p | 0) < (end | 0); p = (p + 4) | 0) {
    higherBits = U4[p >> 2] >>> lowerBitsSize;
    unarySize = (higherBits - previousHigherBits) | 0;
    bitLength = (unarySize + 1) | 0;
    
    // bit output stream idiom
    byteOffset = bitIndex >>> 3;
    bitOffset = bitIndex & 0x1f;
    crossing = (bitOffset + bitLength - 1) >>> 5;
    U4[byteOffset >> 2] = U4[byteOffset >> 2] | (v << bitOffset);
    U4[(byteOffset + 4) >> 2] = U4[(byteOffset + 4) >> 2]
      | (v << bitOffset);
    
    previousHigherBits = higherBits;
    bitIndex = (bitIndex + unarySize + 1) | 0;
  }
}

/**
 * Calculates the exact byte size required by the Elias-Fano structure for a
 * sequence of unique 32-bit unsigned integers.
 *
 * In terms of space complexity, this structure uses B(m, n) + O(n) bits,
 * where B(m, n) = log2(ceil(binomial_coefficient(m, n))).
 */
function eliasFanoByteSize(maxValue, len, deBruijnTableP, outP) {
  maxValue = maxValue | 0;
  len = len | 0;
  deBruijnTableP = deBruijnTableP | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var headerByteSize = 0;
  var lowerBitsByteSize = 0;
  var higherBitsByteSize = 0;

  var lim = 0.0;
  var lowerBitsSize = 0;
  var lowerBitsSizePow2 = 0;
  var numberOfBuckets = 0;
  var t = 0.0;
  var t2 = 0;  

  /*
   * Main
   */
  headerByteSize = 16;
  lim = (+(maxValue | 0)) + 1.0;
  t = lim / (+(len | 0));
  t2 = (nextPow2(~~ceil(t)) | 0) >>> 0;
  t2 = deBruijnSelect(deBruijnTableP, t2, outP) | 0;
  lowerBitsSize = U1[outP >> 0] | 0;
  lowerBitsSizePow2 = (1 << lowerBitsSize) | 0;
  numberOfBuckets = ~~ceil(lim / +(lowerBitsSizePow2 | 0));

  // conversion from bit size to byte size
  // TODO: imul(len, beta) must be in [1, 2^32 - 1]. Check this.
  lowerBitsByteSize = (((imul(len, lowerBitsSize) - 1) >>> 3) + 1) | 0;
  // conversion from bit size to byte size
  // TODO: len + numberOfBuckets must be in [1, 2^32 - 1]. Check this.
  higherBitsByteSize = ((((len + numberOfBuckets) - 1) >>> 3) + 1) | 0;

  return (headerByteSize + lowerBitsByteSize + higherBitsByteSize) | 0;
}

/**
 * Fast <code>popcount</code> (also known as sideways addition)
 * for 32-bit integers, that is, counting non-zero bits in an integer.
 * 
 * See {@link
 * http://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel}
 * or {@link http://stackoverflow.com/a/15979139/3211373}.
 * 
 * @param {int} n - 32-bit integer
 * @return {signed} number of non-zero bits in <code>n</code>
 */
function popcount(n) {
  /*
   * Type annotations
   */
  n = n |0;

  /*
   * Main
   */
  n = (n - ((n >>> 1) & 0x55555555)) | 0;
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333) | 0;
  return (imul(((n + (n >>> 4)) & 0x0F0F0F0F), 0x01010101) >>> 24) | 0;
}

/**
 * Retrieves (bitLength) bits from a heap.
 *
 * <code>p</code> must be a multiple of 4. If this condition is violated,
 * the behavior is undefined.
 *
 * @param {number} p - base index in bytes which must be aligned to 4 bytes
 * @param {number} bitIndex - relative index in bits
 * @param {number} bitLength - length in bits (<= 32)
 * @returns {number} retrieved bits as a signed 32-bit integer (not unsigned)
 */
function readBits(p, bitIndex, bitLength) {
  /*
   * Type annotations
   */
  p = p | 0;
  bitIndex = bitIndex | 0;
  bitLength = bitLength | 0;
  
  /*
   * Local variables
   */
  var byteOffset = 0;
  var bitOffset = 0;
  var mask = 0;
  var result = 0;
  var bitsCurrent = 0;
  var bitsNext = 0;

  /*
   * Main
   */
  byteOffset = (p + (bitIndex >>> 3)) | 0;
  bitOffset = bitIndex & 0x1f;

  // When we need some bits from the next, mask becomes 0xffffffff, otherwise 0.
  mask = -((bitOffset + bitLength - 1) >>> 5) | 0;

  bitsCurrent = U4[byteOffset >> 2] | 0;
  bitsNext = U4[(byteOffset + 4) >> 2] | 0;

  result = result | (bitsCurrent >>> bitOffset);
  
  // Mask is needed since (a << 32) does not give 0
  result = result | (mask & (bitsNext << (32 - bitOffset)));
 
  return (result & (0xffffffff >>> (32 - bitLength))) | 0;
}

/**
 * Writes (bitLength) bits into a heap.
 *
 * <code>p</code> must be a multiple of 4. <code>value</code> must be less
 * than <code>2^bitLength</code>. Destination must be initialized to 0 
 * beforehand. If these conditions are violated, the behavior is undefined.
 *
 * @param {number} p - base index in bytes which must be aligned to 4 bytes
 * @param {number} bitIndex - relative index in bits
 * @param {number} bitLength - length in bits (<= 32)
 * @param {number} value - values to be written
 */
function writeBits(p, bitIndex, bitLength, value) {
  /*
   * Type annotations
   */
  p = p | 0;
  bitIndex = bitIndex | 0;
  bitLength = bitLength | 0;
  value = value | 0;
  
  /*
   * Local variables
   */
  var byteOffset = 0;
  var bitOffset = 0;
  var mask = 0;

  /*
   * Main
   */
  byteOffset = (p + (bitIndex >>> 3)) | 0;
  bitOffset = bitIndex & 0x1f;

  // When we need some bits from the next, mask becomes 0xffffffff, otherwise 0.
  mask = -((bitOffset + bitLength - 1) >>> 5) | 0;
  
  U4[byteOffset >> 2] = U4[byteOffset >> 2] | (value << bitOffset);
  byteOffset = (byteOffset + 4) | 0;
  U4[byteOffset >> 2] = U4[byteOffset >> 2] |
    (mask & (value >>> (32 - bitOffset)));
}

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
 * Lazily calculates an updated value for AdaGrad-L1 primal-dual subgradient.
 * See p. 2137, Duchi, Hazan, and Singer (2011).
 *
 * @param {double} fov
 * @param {double} sov
 * @param {double} round
 * @param {double} delta
 * @param {double} eta
 * @param {double} lambda
 * @returns {double}
 */
function lazyValue(fov, sov, round, delta, eta, lambda) {
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

// from inclusive, to exclusive
function updateLazyRange(from, to, foiP, soiP, weightP,
    round, delta, eta, lambda) {
  /*
   * Type annotations
   */
  from = from | 0;
  to = to | 0;
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
  var foiV = 0.0;
  var soiV = 0.0;

  /*
   * Main
   */
  if ((to | 0) <= (from | 0)) {
    return;
  }

  relativeByteOffset = (from << 2);
  foiP = (foiP + relativeByteOffset) | 0;
  soiP = (soiP + relativeByteOffset) | 0;
  weightP = (weightP + relativeByteOffset) | 0;

  for (; (from | 0) < (to | 0); from = (from + 1) | 0) {
    foiV = +F4[foiP >> 2];
    
    if (foiV != 0.0) {
      soiV = +F4[soiP >> 2];
      F4[weightP >> 2] = +lazyValue(
        foiV, soiV, round, delta, eta, lambda
      );
    }
    
    foiP = (foiP + 4) | 0;
    soiP = (soiP + 4) | 0;
    weightP = (weightP + 4) | 0;
  }
}

// MurmurHash3 was written by Austin Appleby, and is placed in the public
// domain. The author hereby disclaims copyright to this source code.

/**
 * Returns a signed 32-bit hash value by using MurmurHash3_x86_32.
 *
 * Use ">>> 0" to convert its result to an unsigned integer.
 *
 * The original C code was written by Austin Appleby in 2010-2011
 * under public domain.
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
    hashValue = MurmurHash3_x86_32(indexP, 4, seed) | 0;
    sign = +((hashValue >> 31) | 1);
    value = sign * value;
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
    nz = I4[nzP >> 2] | 0;

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
  var transitionFromAnyScoreP = 0;
  var transitionFromAnyScorePSave = 0;
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
  transitionFromAnyScoreP = (transitionScoreP +
    (imul(numberOfStates + 1, numberOfStates) << 2)) | 0;
  transitionFromAnyScorePSave = transitionFromAnyScoreP;
  
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    // stateScores[0][cur]
    stateScore = +F4[stateScoreP >> 2];
    // transitionScores[0][cur]
    transitionScore = (+F4[transitionScoreP >> 2]) +
      (+F4[transitionFromAnyScoreP >> 2]);

    score = stateScore + transitionScore + biasScore;    
    F4[outP >> 2] = score;
    
    stateScoreP = (stateScoreP + 4) | 0;
    transitionScoreP = (transitionScoreP + 4) | 0;
    transitionFromAnyScoreP = (transitionFromAnyScoreP + 4) | 0;
    outP = (outP + 4) | 0;
  }
  transitionFromAnyScoreP = transitionFromAnyScorePSave;
  
  outP = (outP + ((imul(numberOfStates, numberOfStates - 1) << 2))) | 0;
  
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    transitionScorePSave = transitionScoreP;
    
    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      stateScorePSave = stateScoreP;
      transitionFromAnyScorePSave = transitionFromAnyScoreP;

      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        // stateScores[time][cur]
        stateScore = +F4[stateScoreP >> 2];
      
        // transitionScores[prev + 1][cur]
        transitionScore = (+F4[transitionScoreP >> 2]) +
          (+F4[transitionFromAnyScoreP >> 2]);
        
        score = stateScore + transitionScore + biasScore;

        F4[outP >> 2] = score;
        
        stateScoreP = (stateScoreP + 4) | 0;
        transitionScoreP = (transitionScoreP + 4) | 0;
        transitionFromAnyScoreP = (transitionFromAnyScoreP + 4) | 0;
        outP = (outP + 4) | 0;
      }
      
      stateScoreP = stateScorePSave;
      transitionFromAnyScoreP = transitionFromAnyScorePSave;
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

function updateNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength, outP) {
  /*
   * Type annotations
   */
  forwardScoreP = forwardScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var t = 0;

  /*
   * Main
   */
  if ((chainLength | 0) <= 0) {
    return;
  }
  
  t = imul(numberOfStates << 2, chainLength - 1);
  forwardScoreP = (forwardScoreP + t) | 0;

  F4[outP >> 2] = +logsumexpFloat32(forwardScoreP, numberOfStates);
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
 * Note: the above structure is actually a design mistake.
 * a memory allocation like float[time][currentState][previousState]
 * should lead to cleaner code and can reduce cache misses during
 * gradient computation and viterbi.
 * We may (or may not) refactor this point in the future.
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
        score = score + forwardScore + backwardScore - normalizationFactor;

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

/* global CMP_FUNCTION_TABLE */

/*-
 * Copyright (c) 1992, 1993
 *	The Regents of the University of California.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. All advertising materials mentioning features or use of this software
 *    must display the following acknowledgement:
 *	This product includes software developed by the University of
 *	California, Berkeley and its contributors.
 * 4. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

/**
 * Sorts things quickly.
 *
 * <code>qsortBM</code> uses an improved version of the quick sort algorithm
 * developed by Jon L. Bentley and M. Douglas McIlroy in 1993.
 * The code itself was ported from BSD's qsort implementation.
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
  // TODO: the original B&M variably changes the size used for swap,
  // though currently this implementation swaps data byte by byte.
  // This issue will be solved soon.
  
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
  // Unlike the original C implementation of the paper,
  // we always swap here, since in ECMAScript it is impossible to obtain
  // the address of a local variable
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
  
  // TODO:
  // BSD's code switch to insertion sort here depending on the swap size
  
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
    // Unlike the BSD's implementation (but similar to the original C code)
    // we recursively call the function here
    // since ECMAScript does not have GOTO
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
function sort(nz, valueP, indexP,
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
  
  // fill an array with pointers to the original indices
  for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    I4[(outIndexP + (i << 2)) >> 2] = (indexP + (i << 2)) | 0;
  }

  // sort pointers by their value at destination
  qsortBM(outIndexP, nz, 4, 2);
  
  // write real values
  for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    p = I4[outIndexP >> 2] | 0;
    I4[outIndexP >> 2] = I4[p >> 2] | 0;
    p = (p - indexP) | 0; // get the relative byte offset
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
  sort(nz, valueP, indexP, outValueP, outIndexP);
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
 * Computes a gradient.
 *
 * valueP and outValueP can be the same as well as indexP and outIndexP.
 */
function updateGradient(nzP, valueP, indexP,
    biasScoreP, biasIndex, 
    transitionScoreP, transitionIndex,
    jointScoreP, correctPathP,
    numberOfStates, chainLength,
    tmpValueP, tmpIndexP,
    outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nzP = nzP | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  biasScoreP = biasScoreP | 0;
  biasIndex = biasIndex | 0;
  transitionScoreP = transitionScoreP | 0;
  transitionIndex = transitionIndex | 0;
  jointScoreP = jointScoreP | 0;
  correctPathP = correctPathP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  tmpValueP = tmpValueP | 0;
  tmpIndexP = tmpIndexP | 0;
  outNzP = outNzP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var v = 0.0;

  var time = 0;
  var cur = 0;
  var prev = 0;

  var nz = 0;
  var value = 0.0;
  var index = 0;
  var coef = 0.0;
  var totalCoef = 0.0;
  var correctState = 0;
  var correctPreviousState = 0;
  var tmpValuePSave = 0;
  var tmpIndexPSave = 0;
  var tmpNz = 0;
  var transitionIndexSave = 0;
  var transitionFromAnyIndex = 0;
  var transitionFromAnyIndexSave = 0;

  var nosBytes = 0;
  var jointScoreStepPerPrevLoop = 0;
  var jointScoreStepPerCurLoop = 0;
  var transitionIndexStepPerPrevLoop = 0;
  
  // variables for assertion testing
  // var totalNz = sumInt32(nzP, chainLength) | 0;
  // var assertedMaxNz =
  //   imul(totalNz, numberOfStates) + // state features
  //   imul(chainLength, imul(numberOfStates + 1, numberOfStates)) + // transition features
  //   imul(chainLength, numberOfStates) + // transition from any features
  //   1; // bias term
  
  /*
   * Main
   */
  nz = I4[nzP >> 2] | 0;
  correctState = I4[correctPathP >> 2] | 0;
  tmpValuePSave = tmpValueP;
  tmpIndexPSave = tmpIndexP;
  transitionFromAnyIndex = (transitionIndex + imul(numberOfStates + 1, numberOfStates)) | 0;
  transitionFromAnyIndexSave = transitionFromAnyIndex;

  nosBytes = numberOfStates << 2;
  jointScoreStepPerPrevLoop = ((-imul(nosBytes, numberOfStates) | 0) + 4) | 0;
  jointScoreStepPerCurLoop = imul(nosBytes, numberOfStates - 1) | 0;
  transitionIndexStepPerPrevLoop = ((-imul(numberOfStates,
    numberOfStates) | 0) + 1) | 0;

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    v = +F4[jointScoreP >> 2];
    coef = exp(v);
    
    if ((cur | 0) == (correctState | 0)) {
      coef = coef - 1.0;
    }
    totalCoef = totalCoef + coef;

    I4[tmpIndexP >> 2] = transitionIndex | 0;
    F4[tmpValueP >> 2] = coef;
    tmpIndexP = (tmpIndexP + 4) | 0;
    tmpValueP = (tmpValueP + 4) | 0;
    tmpNz = (tmpNz + 1) | 0;
    
    I4[tmpIndexP >> 2] = transitionFromAnyIndex | 0;
    F4[tmpValueP >> 2] = coef;
    tmpIndexP = (tmpIndexP + 4) | 0;
    tmpValueP = (tmpValueP + 4) | 0;
    tmpNz = (tmpNz + 1) | 0;

    for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
      value = +F4[valueP >> 2];
      index = I4[indexP >> 2] | 0;
      
      F4[tmpValueP >> 2] = value * coef;
      I4[tmpIndexP >> 2] = index;

      valueP = (valueP + 4) | 0;
      indexP = (indexP + 4) | 0;
      tmpValueP = (tmpValueP + 4) | 0;
      tmpIndexP = (tmpIndexP + 4) | 0;
      tmpNz = (tmpNz + 1) | 0;
    }
    
    transitionIndex = (transitionIndex + 1) | 0;
    transitionFromAnyIndex = (transitionFromAnyIndex + 1) | 0;
    transitionScoreP = (transitionScoreP + 4) | 0;
    jointScoreP = (jointScoreP + 4) | 0;
  }
  
  jointScoreP = (jointScoreP +
    (imul(numberOfStates, numberOfStates - 1) << 2)) | 0;
  
  nzP = (nzP + 4) | 0;
  correctPathP = (correctPathP + 4) | 0;
  correctPreviousState = correctState;
  transitionIndexSave = transitionIndex;
  
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    nz = I4[nzP >> 2] | 0;
    correctState = I4[correctPathP >> 2] | 0;
    transitionFromAnyIndex = transitionFromAnyIndexSave;
    transitionIndex = transitionIndexSave;

    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      coef = 0.0;

      for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
        v = +F4[jointScoreP >> 2];
        v = exp(v);

        if ((cur | 0) == (correctState | 0) &
            (prev | 0) == (correctPreviousState | 0)) {
          v = v - 1.0;
        }
        
        coef = coef + v;
        totalCoef = totalCoef + coef;

        I4[tmpIndexP >> 2] = transitionIndex | 0;
        F4[tmpValueP >> 2] = v;
        tmpIndexP = (tmpIndexP + 4) | 0;
        tmpValueP = (tmpValueP + 4) | 0;
        tmpNz = (tmpNz + 1) | 0;

        jointScoreP = (jointScoreP + nosBytes) | 0;
        transitionIndex = (transitionIndex + numberOfStates) | 0;
      }
      
      I4[tmpIndexP >> 2] = transitionFromAnyIndex | 0;
      F4[tmpValueP >> 2] = coef;
      tmpIndexP = (tmpIndexP + 4) | 0;
      tmpValueP = (tmpValueP + 4) | 0;
      tmpNz = (tmpNz + 1) | 0;

      for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
        value = +F4[valueP >> 2];
        index = I4[indexP >> 2] | 0;
    
        F4[tmpValueP >> 2] = value * coef;
        I4[tmpIndexP >> 2] = index;

        valueP = (valueP + 4) | 0;
        indexP = (indexP + 4) | 0;
        tmpValueP = (tmpValueP + 4) | 0;
        tmpIndexP = (tmpIndexP + 4) | 0;
        tmpNz = (tmpNz + 1) | 0;
      }
      
      transitionFromAnyIndex = (transitionFromAnyIndex + 1) | 0;

      // from jointScores[time][numberOfStates][cur]
      // to jointScores[time][0][cur + 1]
      jointScoreP = (jointScoreP + jointScoreStepPerPrevLoop) | 0;
      
      // from transitionIndices[numberOfStates + 1][cur]
      // to transitionIndices[1][cur + 1]
      transitionIndex = (transitionIndex + transitionIndexStepPerPrevLoop) | 0;
    }
    nzP = (nzP + 4) | 0;

    correctPathP = (correctPathP + 4) | 0;
    correctPreviousState = correctState;

    // Note that jointScores[time][0][numberOfStates]
    // is the same as jointScores[time][1][0], where
    // p(jointScores[time][1][0]) + numberOfStates * (numberOfStates - 1) * 4
    // = p(jointScores[time + 1][0][0])
    jointScoreP = (jointScoreP + jointScoreStepPerCurLoop) | 0;
  }
  
  I4[tmpIndexP >> 2] = biasIndex | 0;
  F4[tmpValueP >> 2] = totalCoef;
  tmpIndexP = (tmpIndexP + 4) | 0;
  tmpValueP = (tmpValueP + 4) | 0;
  tmpNz = (tmpNz + 1) | 0;

  // Assertion for tmpNz
  // if (tmpNz > assertedMaxNz) {
  //   throw new Error('assertion failed; tmpNz in gradient computation : ' +
  //     tmpNz + ', ' + assertedMaxNz);
  // }

  tmpValueP = tmpValuePSave;
  tmpIndexP = tmpIndexPSave;

  unique(tmpNz, tmpValueP, tmpIndexP, outNzP, outValueP, outIndexP);
}

function updateLazyAt(index, foiP, soiP, weightP,
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

  F4[p3 >> 2] = +lazyValue(
    +F4[p1 >> 2], +F4[p2 >> 2],
    round, delta, eta, lambda
  );
}

function updateLazy(nz, indexP, foiP, soiP, weightP,
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
    index = I4[indexP >> 2] | 0;

    updateLazyAt(index, foiP, soiP, weightP,
      round, delta, eta, lambda);

    indexP = (indexP + 4) | 0;        
  }
}

/**
 * Performs temporary updating for the first order information and
 * second order information of AdaGrad with a gradient.
 * Actual values will be calculated lazily.
 *
 * @param {int} nz - number of non-zero elements in a gradient
 * @param {int} xP - byte offset to float values of a gradient
 * @param {int} indexP - byte offset to uint32 indices of a gradient
 * @param {int} foiP - byte offset to a float dense vec 1st order info
 * @param {int} soiP - byte offset to a float dense vec 2nd order info
 */
function updateTemporary(nz, xP, indexP, foiP, soiP) {
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
    index = I4[indexP >> 2] | 0;
    value = +F4[xP >> 2];
     
    p1 = (foiP + (index << 2)) | 0;
    p2 = (soiP + (index << 2)) | 0;
    
    F4[p1 >> 2] = +F4[p1 >> 2] + value;
    F4[p2 >> 2] = +F4[p2 >> 2] + (value * value);

    indexP = (indexP + 4) | 0;
    xP = (xP + 4) | 0;
  }
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
    index = I4[indexP >> 2] | 0;
    value = +F4[xP >> 2];
    
    result = +(result + value * +F4[(yP + (index << 2)) >> 2]);
    
    indexP = (indexP + 4) | 0;
    xP = (xP + 4) | 0;
  }
  
  F4[outP >> 2] = result;
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
  end = (nzP + (chainLength << 2)) | 0;
  while ((nzP | 0) < (end | 0)) {
    nz = U4[nzP >> 2] | 0;
    nzBytes = nz << 2;
    for (i = 0; (i | 0) < (numberOfStates | 0); i = (i + 1) | 0) {
      susdot(nz, valueP, indexP, weightP, outP);
      outP = (outP + 4) | 0;
      valueP = (valueP + nzBytes) | 0;
      indexP = (indexP + nzBytes) | 0;
    }
    nzP = (nzP + 4) | 0;
  }
}

/**
 * Suffers loss, or the negative log-likelihood.
 *
 * Exactly 4-bytes will be written into lossP.
 *
 * @param {int} featureScoreP
 * @param {int} normalizationFactorP
 * @param {int} correctPathP - byte offset to a correct path
 * @param {int} numberOfStates - number of the states in this Markov chain
 * @param {int} chainLength - length of this Markov chain
 * @param {int} lossP - byte offset to which the loss will be written
 */
function sufferLoss(featureScoreP, normalizationFactorP,
  correctPathP, numberOfStates, chainLength, lossP) {
  /*
   * Type annotations
   */
  featureScoreP = featureScoreP | 0;
  normalizationFactorP = normalizationFactorP | 0;
  correctPathP = correctPathP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  lossP = lossP | 0;

  /*
   * Local variables
   */
  var i = 0;
  var t = 0.0;
  var logLikelihood = 0.0;
  var offset = 0;
  var currentState = 0;
  var previousState = 0;
  var normalizationFactor = 0.0;
  var nossqb = 0;

  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }

  nossqb = imul(numberOfStates, numberOfStates) << 2;

  currentState = I4[correctPathP >> 2] | 0;
  t = +F4[(featureScoreP + (currentState << 2)) >> 2];
  logLikelihood = t;
  previousState = currentState;
  featureScoreP = (featureScoreP + nossqb) | 0;
  correctPathP = (correctPathP + 4) | 0;
  
  for (i = 1; (i | 0) < (chainLength | 0); i = (i + 1) | 0) {
    currentState = I4[correctPathP >> 2] | 0;
    offset = (imul(numberOfStates, previousState) + currentState) << 2;

    t = +F4[(featureScoreP + offset) >> 2];
    
    logLikelihood = logLikelihood + t;
    
    previousState = currentState;
    featureScoreP = (featureScoreP + nossqb) | 0;
    correctPathP = (correctPathP + 4) | 0;
  }
  
  normalizationFactor = +F4[normalizationFactorP >> 2];
  logLikelihood = logLikelihood - normalizationFactor;

  F4[lossP >> 2] = -logLikelihood;
}

/**
 * Each instance is structured as
 *
 * +---+---+---+---+---+---+---+
 * |IID|PLN|STP|NZP|VLP|IND|CRP|
 * +---+---+---+---+---+---+---|
 *
 * IID: instance id
 * PLN: the length of a path
 * STP: byte offset to textual information on features. negative if not exsting
 * NZP: byte offset to NZS
 * VLP: byte offset to VALUES
 * IND: byte offset to INDICES
 * CRP: byte offset to the supervisory path; negataive if not a training datum
 *
 * NZS: NZP[i] contains the number of non-zero elements at the position i
 * VALUES: float32[PLN][NZS[i]] for i in [0, PLN)
 * INDICES: int32[PLN][NZS[i]] for i in [0, PLN)
 * CRP: int32[PLN]
 *
 * To sum up, each instance header occupies 28 bytes
 */
function trainOnline(instanceP, numberOfStates, dimension, round,
  foiP, soiP, weightP, delta, eta, lambda, tmpP, lossP) {
  /*
   * Type annotations
   */
  instanceP = instanceP | 0;
  numberOfStates = numberOfStates | 0;
  dimension = dimension | 0;
  round = round | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;
  weightP = weightP | 0;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;
  tmpP = tmpP | 0;
  lossP = lossP | 0;
  
  /*
   * Local variables
   */
  var i = 0;

  var nz = 0;
  var nzP = 0;
  var totalNz = 0;
  var chainLength = 0;
  var valueP = 0;
  var indexP = 0;
  var correctPathP = 0;

  var featureHashedValueP = 0;
  var featureHashedIndexP = 0;

  var biasScoreP = 0;
  var transitionScoreP = 0;
  var stateScoreP = 0;
  var featureScoreP = 0;
  var forwardScoreP = 0;
  var backwardScoreP = 0;
  var normalizationFactorP = 0;

  var gradientNzP = 0;
  var gradientValueP = 0;
  var gradientIndexP = 0;
  
  var stateScoreTableSize = 0;
  var transitionScoreTableSize = 0;
  var featureScoreTableSize = 0;
  var gradientMaxSize = 0;
  
  var biasIndex = 0;
  var transitionIndex = 0;

  var tmpValueP = 0;
  var tmpIndexP = 0;
  
  /*
   * Main
   */
  
  //
  // Memory allocation
  //
    
  // Uses the path length of an instance as a Markov chain length
  chainLength = I4[(instanceP + 4) >> 2] | 0;
  nzP = I4[(instanceP + 12) >> 2] | 0;
  valueP = I4[(instanceP + 16) >> 2] | 0;
  indexP = I4[(instanceP + 20) >> 2] | 0;
  correctPathP = I4[(instanceP + 24) >> 2] | 0;
  
  totalNz = sumInt32(nzP, chainLength) | 0;
  
  stateScoreTableSize = imul(chainLength, numberOfStates);
  transitionScoreTableSize = (imul(numberOfStates + 1, numberOfStates) +
    numberOfStates) | 0;
  featureScoreTableSize = imul(stateScoreTableSize, numberOfStates);
  
  // this size can be slightly tighter, but we leave some margin for safety
  gradientMaxSize = (
    imul(totalNz, numberOfStates) + // state features
    imul(chainLength, transitionScoreTableSize) + // transition features
    1 // bias term
  ) | 0;

  biasIndex = (dimension + transitionScoreTableSize) | 0;
  transitionIndex = dimension;

  // We only need (imul(totalNz, numberOfStates) * 4) bytes at feature hashing
  // but we allocate slightly larger bytes so that later the space can be reused
  // as an output space for the gradient calculation.
  featureHashedValueP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;
  
  featureHashedIndexP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;

  biasScoreP = (weightP + (biasIndex << 2)) | 0;
  transitionScoreP = (weightP + (transitionIndex << 2)) | 0;

  stateScoreP = tmpP;
  tmpP = (tmpP + (stateScoreTableSize << 2)) | 0;

  featureScoreP = tmpP;
  tmpP = (tmpP + (featureScoreTableSize << 2)) | 0;

  forwardScoreP = tmpP;
  tmpP = (tmpP + (stateScoreTableSize << 2)) | 0;

  backwardScoreP = tmpP;
  tmpP = (tmpP + (stateScoreTableSize << 2)) | 0;
  
  normalizationFactorP = tmpP;
  tmpP = (tmpP + 4) | 0;

  tmpValueP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;

  tmpIndexP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;
  
  // reuse these spaces
  gradientNzP = normalizationFactorP;
  gradientValueP = featureHashedValueP;
  gradientIndexP = featureHashedIndexP;

  //
  // Main routine
  //
  featureHashingSequence(nzP, valueP, indexP, numberOfStates, chainLength,
    dimension, featureHashedValueP, featureHashedIndexP);
    
  // update bias and transition scores positions
  for (i = 0; (i | 0) < ((transitionScoreTableSize + 1) | 0); i = (i + 1) | 0) {
    updateLazyAt((i + dimension) | 0, foiP, soiP, weightP,
      +(round | 0), delta, eta, lambda);
  }

  updateLazy(imul(totalNz, numberOfStates), featureHashedIndexP, foiP, soiP, weightP,
    +(round | 0), delta, eta, lambda);

  updateStateScores(nzP, featureHashedValueP, featureHashedIndexP, weightP,
    numberOfStates, chainLength, stateScoreP);

  updateFeatureScores(biasScoreP, transitionScoreP,
    stateScoreP, numberOfStates, chainLength, featureScoreP);

  // we reuse the regions allocated for state scores here,
  // since they are no longer needed
  updateForwardScores(featureScoreP, numberOfStates,
    chainLength, stateScoreP, forwardScoreP);
  updateBackwardScores(featureScoreP, numberOfStates,
    chainLength, stateScoreP, backwardScoreP);
  updateNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength, normalizationFactorP);

  sufferLoss(featureScoreP, normalizationFactorP, correctPathP,
    numberOfStates, chainLength, lossP);

  updateJointScores(featureScoreP, forwardScoreP,
    backwardScoreP, normalizationFactorP, numberOfStates, chainLength);

  updateGradient(nzP, featureHashedValueP, featureHashedIndexP,
    biasScoreP, biasIndex,
    transitionScoreP, transitionIndex,
    featureScoreP, correctPathP,
    numberOfStates, chainLength,
    tmpValueP, tmpIndexP,
    gradientNzP, gradientValueP, gradientIndexP);

  nz = I4[gradientNzP >> 2] | 0;
  updateTemporary(nz, gradientValueP, gradientIndexP, foiP, soiP);
}

/**
 * This function uses (numberOfStates * chainLength * 4 * 2) bytes at tmpP.
 * Exactly (chainLength * 4) bytes will be written into predictionP.
 * Exactly 4 bytes will be written into predictionScoreP.
 */
function viterbi(scoreP, numberOfStates, chainLength,
    tmpP, predictionP, predictionScoreP) {
  /*
   * Type annotations
   */
  scoreP = scoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  tmpP = tmpP | 0;
  predictionP = predictionP | 0;
  predictionScoreP = predictionScoreP | 0;

  /*
   * Local variables
   */
  var t = 0.0;
  
  var offset = 0;
  
  var time = 0;
  var cur = 0;
  var prev = 0;
  
  var bestScore = 0.0;
  var bestPath = 0;
  
  var bestScoreP = 0;
  var bestPathP = 0;
  var bestPathPSave = 0;
  
  var prevP = 0;
  var prevPSave = 0;
  var previousScore = 0.0;

  var nosBytes = 0;
  
  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }

  nosBytes = numberOfStates << 2;
  bestScoreP = tmpP;
  bestPathP = (tmpP + imul(nosBytes, chainLength)) | 0;
  prevP = bestScoreP;
  bestPathPSave = bestPathP;

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    F4[bestScoreP >> 2] = +F4[scoreP >> 2];
    I4[bestPathP >> 2] = -1;

    scoreP = (scoreP + 4) | 0;
    bestScoreP = (bestScoreP + 4) | 0;
    bestPathP = (bestPathP + 4) | 0;
  }
  scoreP = (scoreP + (imul(numberOfStates, numberOfStates - 1) << 2)) | 0;
  
  
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      prevPSave = prevP;
      bestPath = -1;
      bestScore = -Infinity;

      for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
        // scores[time][prev][cur] + bestScores[time - 1][prev]
        t = +F4[scoreP >> 2];
        previousScore = +F4[prevP >> 2];
        
        t = t + previousScore;
        
        if (t > bestScore) {
          bestPath = prev;
          bestScore = t;
        }        
        
        scoreP = (scoreP + nosBytes) | 0;
        prevP = (prevP + 4) | 0;
      }
      
      F4[bestScoreP >> 2] = bestScore;
      I4[bestPathP >> 2] = bestPath;
      
      bestScoreP = (bestScoreP + 4) | 0;
      bestPathP = (bestPathP + 4) | 0;
      
      prevP = prevPSave;
      
      // from scores[time][numberOfStates][cur]
      // to scores[time][0][cur + 1]
      scoreP = (scoreP - imul(nosBytes, numberOfStates) + 4) | 0;
    }
    
    // advance prevP to bestScores[time][0]
    prevP = (prevP + nosBytes) | 0;

    // Note that scores[time][0][numberOfStates]
    // is the same as scores[time][1][0]
    scoreP = (scoreP + imul(nosBytes, numberOfStates - 1)) | 0;
  }

  // back track
  bestScoreP = (bestScoreP - nosBytes) | 0;
  bestPath = 0;
  bestScore = -Infinity;

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    t = +F4[bestScoreP >> 2];

    if (t > bestScore) {
      bestPath = cur;
      bestScore = t;
    }
    
    bestScoreP = (bestScoreP + 4) | 0;
  }
  
  F4[predictionScoreP >> 2] = bestScore;
  
  bestPathP = bestPathPSave;
  
  predictionP = (predictionP + ((chainLength - 1) << 2)) | 0;
  I4[predictionP >> 2] = bestPath;
  for (time = (chainLength - 2) | 0; (time | 0) >= 0; time = (time - 1) | 0) {
    predictionP = (predictionP - 4) | 0;
    offset = (imul(nosBytes, time + 1) + (bestPath << 2)) | 0;
    
    bestPath = I4[(bestPathP + offset) >> 2] | 0;
    I4[predictionP >> 2] = bestPath;
  }
}

function predict(instanceP, numberOfStates, stateDimension,
    weightP, tmpP, lossP, predictionP, predictionScoreP) {
  /*
   * Type annotations
   */
  instanceP = instanceP | 0;
  numberOfStates = numberOfStates | 0;
  stateDimension = stateDimension | 0;
  weightP = weightP | 0;
  tmpP = tmpP | 0;
  lossP = lossP | 0;
  predictionP = predictionP | 0;
  predictionScoreP = predictionScoreP | 0;

  /*
   * Local variables
   */
  var nzP = 0;
  var valueP = 0;
  var indexP = 0;

  var chainLength = 0;
  var correctPathP = 0;
  
  var totalNz = 0;
  
  var stateScoreTableSize = 0;
  var transitionScoreTableSize = 0;
  var featureScoreTableSize = 0;
  var gradientMaxSize = 0;

  var featureHashedValueP = 0;
  var featureHashedIndexP = 0;

  var stateScoreP = 0;
  var biasScoreP = 0;
  var transitionScoreP = 0;

  var featureScoreP = 0;
  var forwardScoreP = 0;
  var normalizationFactorP = 0;
  var viterbiTmpP = 0;
  
  var biasIndex = 0;
  var transitionIndex = 0;
  
  /*
   * Main
   */
  // retrieve data
  chainLength = I4[(instanceP + 4) >> 2] | 0;
  nzP = I4[(instanceP + 12) >> 2] | 0;
  valueP = I4[(instanceP + 16) >> 2] | 0;
  indexP = I4[(instanceP + 20) >> 2] | 0;
  correctPathP = I4[(instanceP + 24) >> 2] | 0;
  
  totalNz = sumInt32(nzP, chainLength) | 0;
  
  stateScoreTableSize = imul(chainLength, numberOfStates);
  transitionScoreTableSize = (imul(numberOfStates + 1, numberOfStates) +
    numberOfStates) | 0;
  featureScoreTableSize = imul(stateScoreTableSize, numberOfStates);
  gradientMaxSize =
    (imul(totalNz, transitionScoreTableSize) + 
    imul(featureScoreTableSize, 2)) | 0;
  
  biasIndex = (stateDimension + transitionScoreTableSize) | 0;
  transitionIndex = stateDimension;
  
  // memory allocation
  featureHashedValueP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;
  
  featureHashedIndexP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;
  
  biasScoreP = (weightP + (biasIndex << 2)) | 0;
  transitionScoreP = (weightP + (transitionIndex << 2)) | 0;
  
  stateScoreP = tmpP;
  tmpP = (tmpP + (stateScoreTableSize << 2)) | 0;
  
  featureScoreP = tmpP;
  tmpP = (tmpP + (featureScoreTableSize << 2)) | 0;
  
  forwardScoreP = tmpP;
  tmpP = (tmpP + (stateScoreTableSize << 2)) | 0;
  
  normalizationFactorP = tmpP;
  tmpP = (tmpP + 4) | 0;
  
  viterbiTmpP = tmpP;
  tmpP = (tmpP + (imul(numberOfStates, chainLength) << 3)) | 0;
  
  // main routine
  featureHashingSequence(nzP, valueP, indexP, numberOfStates, chainLength,
    stateDimension, featureHashedValueP, featureHashedIndexP);

  updateStateScores(nzP, featureHashedValueP, featureHashedIndexP, weightP,
    numberOfStates, chainLength, stateScoreP);

  updateFeatureScores(biasScoreP, transitionScoreP,
    stateScoreP, numberOfStates, chainLength, featureScoreP);

  // we reuse the regions allocated for state scores here,
  // since they are no longer needed
  updateForwardScores(featureScoreP, numberOfStates,
    chainLength, stateScoreP, forwardScoreP);
  updateNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength, normalizationFactorP);

  if ((correctPathP | 0) != 0) {
    sufferLoss(featureScoreP, normalizationFactorP, correctPathP,
      numberOfStates, chainLength, lossP);      
  }
    
  viterbi(featureScoreP, numberOfStates, chainLength,
    viterbiTmpP, predictionP, predictionScoreP);
  
  F4[predictionScoreP >> 2] = (+F4[predictionScoreP >> 2]) -
    (+F4[normalizationFactorP >> 2]);
}

/**
 * Returns the byte size used by this CRF implementation during training.
 * This value does not include weight vector and other denses.
 */
function getByteSize(numberOfStates,
    maxChainLength, maxTotalNz) {
  /*
   * Type annotations
   */
  numberOfStates = numberOfStates | 0;
  maxChainLength = maxChainLength | 0;
  maxTotalNz = maxTotalNz | 0;
  
  /*
   * Local variables
   */
  var result = 0;
  
  var stateScoreTableSize = 0;
  var transitionScoreTableSize = 0;
  var featureScoreTableSize = 0;
  var gradientMaxSize = 0;
  
  /*
   * Main
   */
  stateScoreTableSize = imul(maxChainLength, numberOfStates);
  transitionScoreTableSize = (imul(numberOfStates + 1, numberOfStates) +
    numberOfStates) | 0;
  featureScoreTableSize = imul(stateScoreTableSize, numberOfStates);
  gradientMaxSize = (
    imul(maxTotalNz, numberOfStates) + // state features
    imul(maxChainLength, transitionScoreTableSize) + // transition features
    1 // bias term
  ) | 0;
  
  // feature hashed values
  result = (result + (gradientMaxSize << 2)) | 0;

  // feature hashed indices
  result = (result + (gradientMaxSize << 2)) | 0;

  // state scores
  result = (result + (stateScoreTableSize << 2)) | 0;

  // feature scores
  result = (result + (featureScoreTableSize << 2)) | 0;

  // forward scores
  result = (result + (stateScoreTableSize << 2)) | 0;

  // backward scores
  result = (result + (stateScoreTableSize << 2)) | 0;

  // normalization factor
  result = (result + 4) | 0;

  // tmp vec values
  result = (result + (gradientMaxSize << 2)) | 0;

  // tmp vec indices
  result = (result + (gradientMaxSize << 2)) | 0;
  
  return result | 0;
}

/**
 * Returns the l0 of a dense vector.
 */
function l0(p, len) {
  /*
   * Type annotations
   */
  p = p | 0;
  len = len | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var l0 = 0;

  /*
   * Main
   */
  for (i = 0; (i | 0) < (len | 0); i = (i + 1) | 0) {
    if (+F4[p >> 2] != 0.0) {
      l0 = (l0 + 1) | 0;
    }
    
    p = (p + 4) | 0;
  }
  
  return l0 | 0;
}

function rounding(p, len, m, degree) {
  /*
   * Type annotations
   */
  p = p | 0;
  len = len | 0;
  m = m | 0;
  degree = degree | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var v = 0.0;
  var t = 0;
  var quant = 0.0;
  var maxValue = 0;
  var minValue = 0;

  /*
   * Main
   */
  quant = pow(2.0, +(degree | 0));
  maxValue = ((1 << (m + degree)) - 1) | 0;
  minValue = -maxValue | 0;
  
  for (i = 0; (i | 0) < (len | 0); i = (i + 1) | 0) {
    v = +F4[p >> 2];

    v = v * quant;
    t = ~~v;
    
    t = min(t | 0, maxValue | 0);
    t = max(t | 0, minValue | 0);
    v = +(t | 0);
    v = v / quant;

    F4[p >> 2] = v;
    
    p = (p + 4) | 0;
  }
}

/********************
 * SparseBuilder
 *
 * A builder to create a double-array sparse vector.
 * This implementation uses a hash map where
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
 * Creates a new sparse vector builder.
 *
 * `tableSize` must be a power of 2. No validation is employed.
 *
 * This map uses (32 + tableSize * 4 + maxNumberOfKeys * 12) at <code>p</code>.
 *
 * @param {int} p - byte offset
 * @param {int} tableSize - size of table
 * @param {int} maxNumberOfKeys - unsigned 32-bit integer
 *   to specify the maximum number of keys
 */
function sparseBuilderCreate(p, tableSize, maxNumberOfKeys) {
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
  I4[(p + 0) >> 2] = 0;
  I4[(p + 4) >> 2] = 0;
  I4[(p + 8) >> 2] = tableSize;
  I4[(p + 12) >> 2] = 0;
  I4[(p + 16) >> 2] = maxNumberOfKeys;
  linkedListP = (32 + (tableSize << 2)) | 0;
  I4[(p + 20) >> 2] = linkedListP;
  I4[(p + 24) >> 2] = linkedListP;
}

/**
 * Updates the value by the following formula in 32-bit precision
 * map[key] = coef * map[key] + value
 *
 * @param {int} p - byte offset
 * @param {int} key - 32-bit unsigned integer
 * @param {double} value - 64-bit float
 * @param {double} coef - 64-bit float.
 */
function sparseBuilderAdd(p, key, value, coef) {
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
    
  _find(p, key);
  entryP = I4[(p + TMP1) >> 2] | 0;
  prevP = I4[(p + TMP2) >> 2] | 0;

  if ((entryP | 0) != 0) {
    // Key matched
    valueAbsP = (p + entryP + 4) | 0;
    v = +F4[valueAbsP >> 2];
    v = v + value * coef;
    F4[valueAbsP >> 2] = v;
    return;
  }

  currentSize = I4[lenP >> 2] | 0;
  maximumNumberOfKeys = I4[mnkP >> 2] | 0;
  
  if ((currentSize | 0) == (maximumNumberOfKeys | 0)) {       
    return;
  }

  // Add a new entry
  freeAbsP = (p + (U4[frpP >> 2] | 0)) | 0;
  I4[(p + prevP) >> 2] = (freeAbsP - p) | 0;
  I4[freeAbsP >> 2] = key;
  freeAbsP = (freeAbsP + 4) | 0;
  F4[freeAbsP >> 2] = value;
  freeAbsP = (freeAbsP + 4) | 0;
  I4[freeAbsP >> 2] = 0; // space for the next linked list entry
  freeAbsP = (freeAbsP + 4) | 0;
  U4[frpP >> 2] = (freeAbsP - p) | 0;

  // increment the number of entries
  I4[lenP >> 2] = (currentSize + 1) | 0;
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
function _find(p, key) {
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

  mask = ((I4[(p + TBS) >> 2] >>> 0) - 1) >>> 0;
  I4[tmp1P >> 2] = key;
  hashValue = MurmurHash3_x86_32(tmp1P, 4, SEED) | 0;

  prevP = (TABLE_START + ((hashValue & mask) << 2)) | 0;
  nextP = I4[(p + prevP) >> 2] | 0;
  
  // while (nextP is not empty and key is not matched)
  while (((nextP | 0) != 0) & ((k | 0) != (key | 0))) {
    entryP = nextP;
    k = I4[(p + entryP) >> 2] | 0;
    prevP = entryP;
    nextP = U4[((p + entryP + 8) | 0) >> 2] | 0;
  }
  
  I4[(p + TMP2) >> 2] = prevP | 0;

  if ((k | 0) == (key | 0)) {
    // Key matched
    I4[tmp1P >> 2] = entryP | 0;
  } else {
    I4[tmp1P >> 2] = 0;
  }
}

/**
 * Returns the number of entries contained in this builder.
 *
 * @param {int} p - byte offset
 * @returns {signed} - size 
 */
function sparseBuilderSize(p) {
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
  return I4[(p + LEN) >> 2] | 0;
}

/**
 * Exactly 4 bytes will be writen into <code>outNzP</code>.
 * At most 4 * I4[outNzP >> 2] bytes will be written into each
 * <code>outValueP</code> and <code>outIndexP</code>
 */
function sparseBuilderBuild(p, outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  p = p | 0;
  outNzP = outNzP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP| 0;

  /*
   * Local variables
   */
  var endP = 0;
  var linkedListP = 0;
  var value = 0.0;
  var nz = 0;
  
  /*
   * Main
   */
  linkedListP = (p + (I4[(p + 20) >> 2] | 0)) | 0;
  endP = (linkedListP + imul((sparseBuilderSize(p) | 0) << 2, 3)) | 0;
  
  for (; (linkedListP | 0) < (endP | 0); linkedListP = (linkedListP + 12) | 0) {
    value = +F4[(linkedListP + 4) >> 2];
    if (value != 0.0) {
      F4[outValueP >> 2] = value;
      I4[outIndexP >> 2] = I4[linkedListP >> 2] | 0;
      outValueP = (outValueP + 4) | 0;
      outIndexP = (outIndexP + 4) | 0;
      nz = (nz + 1) | 0;
    }
  }
  
  I4[outNzP >> 2] = nz;
}

function sparseBuilderByteLength(tableSize, maxNumberOfKeys) {
  /*
   * Type annotations
   */
  tableSize = tableSize | 0;
  maxNumberOfKeys = maxNumberOfKeys | 0;

  /*
   * Main
   */
  return (32 + (tableSize << 2) + imul(maxNumberOfKeys << 2, 3)) | 0;
}

/*
 * Copyright 2001-2004 Unicode, Inc.
 * 
 * Disclaimer
 * 
 * This source code is provided as is by Unicode, Inc. No claims are
 * made as to fitness for any particular purpose. No warranties of any
 * kind are expressed or implied. The recipient agrees to determine
 * applicability of information provided. If this file has been
 * purchased on magnetic or optical media from Unicode, Inc., the
 * sole remedy for any claim will be exchange of defective media
 * within 90 days of receipt.
 * 
 * Limitations on Rights to Redistribute This Code
 * 
 * Unicode, Inc. hereby grants the right to freely use the information
 * supplied in this file in the creation of products supporting the
 * Unicode Standard, and to make copies of this file in any form
 * for internal or external distribution as long as this notice
 * remains attached.
 */

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

/*-
 * Copyright (c) 1990, 1993
 *	The Regents of the University of California.  All rights reserved.
 *
 * This code is derived from software contributed to Berkeley by
 * Chris Torek.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 4. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */
// Ported from Chris Torek's C code with less alignment handling
function memmove(destP, srcP, length) {
  /*
   * Type annotations
   */
  destP = destP | 0;
  srcP = srcP | 0;
  length = length | 0;
  
  /*
   * Local variables
   */
  var end = 0;
  var t = 0;
  var destPSave = 0;

  /*
   * Main
   */
  destPSave = destP;
  end = (srcP + length) | 0;
  
  if (((length | 0) <= 0) | ((destP | 0) == (srcP | 0))) {
    return destPSave | 0;
  }
  
  if ((destP | 0) < (srcP | 0)) {
    // copy forwards
    
    t = srcP;

    // copy whole words if aligned
    if (((t & 7) | (destP & 7)) == 0) {
      t = length >> 3;
      if (t) {
        do {
          // F8[destP >> 3] = F8[srcP >> 3];
          U4[destP >> 2] = U4[srcP >> 2];
          U4[(destP + 4) >> 2] = U4[(srcP + 4) >> 2];

          srcP = (srcP + 8) | 0;
          destP = (destP + 8) | 0;

          t = (t - 1) | 0;
        } while (t);
      }
      t = length & 7;
    } else {
      t = length;
    }
    
    // handle the remaining
    if (t) {
      do {
        U1[destP >> 0] = U1[srcP >> 0];        

        srcP = (srcP + 1) | 0;
        destP = (destP + 1) | 0;
        t = (t - 1) | 0;
      } while (t);
    }
  } else {
    // copy backwards
    srcP = (srcP + length) | 0;
    destP = (destP + length) | 0;
    
    t = srcP;
    
    if (((t & 7) | (destP & 7)) == 0) {
      t = length >> 3;

      if (t) {
        do {
          srcP = (srcP - 8) | 0;
          destP = (destP - 8) | 0;
        
          F8[destP >> 3] = F8[srcP >> 3];
        
          t = (t - 1) | 0;
        } while (t);
      }
    
      t = length & 7;    
    } else {
      t = length;
    }
    
    if (t) {
      do {
        srcP = (srcP - 1) | 0;
        destP = (destP - 1) | 0;
        U1[destP >> 0] = U1[srcP >> 0];        
        t = (t - 1) | 0;
      } while (t);
    }
  }
  
  return destPSave | 0;
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
 * Decodes a base64 encoded format into <code>outP</code>,
 * and returns the number of bytes written.
 * The maximum number of bytes to be written can be computed by 
 * <code>base64DecodeLength</code> beforehand.
 *
 * Currently this implementation rejects invalid sequences and
 * returns a negative value in that case.
 *
 * @param {int} inP - byte offset from which data are to be read
 * @param {int} len - number of the bytes of the specified input
 * @param {int} outP - byte offset into which the results are to be written
 * @returns {signed} - number of bytes written if successfully decoded,
 *   otherwise a negative value
 * @see RFC 4648 (S. Joefsson. 2006.
 *   The Base16, Base32, and Base64 Data Encodings.)
 */
function base64Decode(inP, len, outP) {
  /*
   * Type annotations
   */
  inP = inP | 0;
  len = len | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var c1 = 0;
  var c2 = 0;
  var c3 = 0;
  var c4 = 0;
  var n = 0;

  /*
   * Main
   */
  if (((len | 0) < 0) | (len & 3)) {
    return -1;
  }
  
  while ((len | 0) > 0) {    
    c1 = decodeSixBits(U1[inP >> 0] | 0) | 0;
    c2 = decodeSixBits(U1[(inP + 1) >> 0] | 0) | 0;
    c3 = decodeSixBits(U1[(inP + 2) >> 0] | 0) | 0;
    c4 = decodeSixBits(U1[(inP + 3) >> 0] | 0) | 0;
    inP = (inP + 4) | 0;

    if ((c1 | 0) >= 64) {
      n = -1;
      break;
    }
    if ((c2 | 0) >= 64) {
      n = -1;
      break;
    }
    if (((c3 | 0) == 64) & ((c4 | 0) == 64)) {
      c3 = 0;
      n = (n - 1) | 0;
    } else if ((c3 | 0) >= 64) {
      n = -1;
      break;
    }
    if ((c4 | 0) == 64) {
      c4 = 0;
      n = (n - 1) | 0;
    } else if ((c4 | 0) > 64) {
      n = -1;
      break;
    }
    
    U1[outP >> 0] = (c1 << 2) | (c2 >>> 4);
    outP = (outP + 1) | 0;
    
    U1[outP >> 0] = (c2 << 4) | (c3 >>> 2);
    outP = (outP + 1) | 0;

    U1[outP >> 0] = (c3 << 6) | c4;
    outP = (outP + 1) | 0;
    
    len = (len - 4) | 0;
    n = (n + 3) | 0;
  }
  
  return n | 0;
}

function decodeSixBits(c) {
  /*
   * Type annotations
   */
  c = c | 0;
  
  /*
   * Main
   */
  c = c & 255;
  
  if (((c | 0) >= 65) & ((c | 0) <= 90)) { // A-Z
    c = (c - 65) | 0;
  } else if (((c | 0) >= 97) & ((c | 0) <= 122)) { // a-z
    c = (c - 71) | 0;
  } else if (((c | 0) >= 48) & ((c | 0) <= 57)) { // 0-9
    c = (c + 4) | 0;
  } else if ((c | 0) == 43) { // '+'
    c = 62;
  } else if ((c | 0) == 47) { // '/'
    c = 63;
  } else if ((c | 0) == 61) { // '='
    c = 64;
  } else {
    c = 255;
  }
  
  return c | 0;
}

/**
 * @param {int} len
 * @returns {signed} maximum number of bytes to be writtenif the length is
 *   valid, otherwise negative value
 * @see RFC 4648 (S. Joefsson. 2006.
 *   The Base16, Base32, and Base64 Data Encodings.)
 */
function base64DecodeLength(len) {
  /*
   * Type annotations
   */
  len = len | 0;
  
  /*
   * Main
   */
  if (((len | 0) < 0) | (len & 3)) {
    return -1;
  }
  
  return imul(((len - 1) >> 2) + 1, 3);
}

/**
 * @param {int} len
 * @returns {signed} number of bytes to be written if the length is valid,
 *   otherwise negative value
 * @see RFC 4648 (S. Joefsson. 2006.
 *   The Base16, Base32, and Base64 Data Encodings.)
 */
function base64EncodeLength(len) {
  /*
   * Type annotations
   */
  len = len | 0;
  
  /*
   * Main
   */
  if ((len | 0) <= 0) {
    return len | 0;
  }
  
  return ((((((len - 1) | 0) / 3) | 0) + 1) << 2) | 0;
}

/**
 * Encodes bytes with base64 writing it out into <code>outP</code>,
 * and returns the number of bytes written.
 * The number of bytes to be written can be computed by 
 * <code>base64EncodeLength</code> beforehand.
 *
 * @param {int} inP - byte offset from which data are to be read
 * @param {int} len - number of the bytes of the specified input
 * @param {int} outP - byte offset into which the results are to be written
 * @returns {signed} - number of bytes written
 * @see RFC 4648 (S. Joefsson. 2006.
 *   The Base16, Base32, and Base64 Data Encodings.)
 */
function base64Encode(inP, len, outP) {
  /*
   * Type annotations
   */
  inP = inP | 0;
  len = len | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var b1 = 0;
  var b2 = 0;
  var b3 = 0;
  var c = 0;
  var padding = 0;
  var result = 0;
  
  /*
   * Main
   */
  result = base64EncodeLength(len) | 0;

  while ((len | 0) > 0) {
    b1 = U1[inP >> 0] | 0;
    inP = (inP + 1) | 0;
    len = (len - 1) | 0;
    
    c = 0;
    c = b1 >>> 2;
    U1[outP >> 0] = encodeSixBits(c) | 0;
    outP = (outP + 1) | 0;
    
    if ((len | 0) > 0) {
      b2 = U1[inP >> 0] | 0;
      inP = (inP + 1) | 0;
      len = (len - 1) | 0;
    } else {
      padding = 2;
      c = (b1 & 3) << 4;
      U1[outP >> 0] = encodeSixBits(c) | 0;
      outP = (outP + 1) | 0;
      break;
    }
    
    c = 0;
    c = ((b1 & 3) << 4) | (b2 >>> 4);
    U1[outP >> 0] = encodeSixBits(c) | 0;
    outP = (outP + 1) | 0;
   
    if ((len | 0) > 0) {
      b3 = U1[inP >> 0] | 0;
      inP = (inP + 1) | 0;
      len = (len - 1) | 0;
    } else {
      padding = 1;
      c = 0;
      c = (b2 & 15) << 2;
      U1[outP >> 0] = encodeSixBits(c) | 0;
      outP = (outP + 1) | 0;
      break;
    }

    c = 0;
    c = ((b2 & 15) << 2) | (b3 >>> 6);
    U1[outP >> 0] = encodeSixBits(c) | 0;
    outP = (outP + 1) | 0;

    c = 0;
    c = b3 & 63;
    U1[outP >> 0] = encodeSixBits(c) | 0;
    outP = (outP + 1) | 0;
  }
  
  while ((padding | 0) > 0) {
    U1[outP >> 0] = 0x3d; // ASCII for '='
    padding = (padding - 1) | 0;
    outP = (outP + 1) | 0;
  }
  
  return result | 0;
}

// compared with table-based approaches
// maybe slow for 0xfffffff.... but maybe not so slow in common cases
function encodeSixBits(c) {
  /*
   * Type annotations
   */
  c = c | 0;
  
  /*
   * Main
   */
  c = c & 63;
  if ((c | 0) < 26) {
    c = (c + 65) | 0; // 0 + 65 = 65 ('A')
  } else if ((c | 0) < 52) {
    c = (c + 71) | 0; // 26 + 71 = 97 ('a')
  } else if ((c | 0) < 62) {
    c = (c - 4) | 0; // 52 - 4 = 48 ('0')
  } else if ((c | 0) == 62) {
    c = 43; // '+'
  } else {
    c = 47; // '/'
  }
  return c | 0;
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
  bit_deBruijnSelect: deBruijnSelect,
  bit_deBruijnSelectInit: deBruijnSelectInit,
  bit_eliasFano: eliasFano,
  bit_eliasFanoByteSize: eliasFanoByteSize,
  bit_nextPow2: nextPow2,
  bit_popcount: popcount,
  bit_readBits: readBits,
  bit_writeBits: writeBits,

  learn_adagrad_updateLazyRange: updateLazyRange,
  learn_crf_trainOnline: trainOnline,
  learn_crf_sufferLoss: sufferLoss,
  learn_crf_featureHashing: featureHashing,
  learn_crf_featureHashingSequence: featureHashingSequence,
  learn_crf_updateFeatureScores: updateFeatureScores,
  learn_crf_updateForwardScores: updateForwardScores,
  learn_crf_updateBackwardScores: updateBackwardScores,
  learn_crf_updateNormalizationFactor: updateNormalizationFactor,
  learn_crf_updateJointScores: updateJointScores,
  learn_crf_updateGradient: updateGradient,
  learn_crf_getByteSize: getByteSize,
  learn_crf_viterbi: viterbi,
  learn_crf_predict: predict,
  isLittleEndian: isLittleEndian,
  
  math_rounding: rounding,
  math_sparse_susdot: susdot,
  math_sparse_sort: sort,
  math_sparse_unique: unique,
  
  math_sparse_builder_create : sparseBuilderCreate,
  math_sparse_builder_add : sparseBuilderAdd,
  math_sparse_builder_size : sparseBuilderSize,
  math_sparse_builder_build : sparseBuilderBuild,
  math_sparse_builder_byteLength : sparseBuilderByteLength,
  
  maxFloat32: maxFloat32,
  sumFloat32: sumFloat32,
  sumInt32: sumInt32,
  logsumexp: logsumexpFloat32,
  math_l0: l0,

  ufmap_create: ufmap_create,
  ufmap_has: ufmap_has,
  ufmap_add: ufmap_add,
  ufmap_get: ufmap_get,
  ufmap_size: ufmap_size,

  hash: MurmurHash3_x86_32,
  uc_convertUtf16toUtf8: uc_convertUtf16toUtf8,
  uc_convertUtf8toUtf16: convertUtf8toUtf16,
  compareInt32: compareInt32,
  compareUint32: compareUint32,
  qsortBM: qsortBM,
  memmove: memmove,
  util_base64Decode: base64Decode,
  util_base64DecodeLength: base64DecodeLength,
  util_base64Encode: base64Encode,
  util_base64EncodeLength: base64EncodeLength
};


  }
  
  return myAsmjsModule;
}));
