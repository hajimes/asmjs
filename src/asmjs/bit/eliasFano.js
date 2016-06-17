import deBruijnSelect from './deBruijnSelect';
import nextPow2 from './nextPow2';

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
export default function eliasFano(p, len, deBruijnTableP, outP) {
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