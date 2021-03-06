import deBruijnSelect from './deBruijnSelect';
import nextPow2 from './nextPow2';

/**
 * Calculates the exact byte size required by the Elias-Fano structure for a
 * sequence of unique 32-bit unsigned integers.
 *
 * This code uses 4 bytes at tmpP.
 *
 * In terms of space complexity, this structure uses B(m, n) + O(n) bits,
 * where B(m, n) = log2(ceil(binomial_coefficient(m, n))).
 */
export default function eliasFanoByteSize(maxValue, len, deBruijnTableP, tmpP) {
  maxValue = maxValue | 0;
  len = len | 0;
  deBruijnTableP = deBruijnTableP | 0;
  tmpP = tmpP | 0;
  
  /*
   * Local variables
   */
  var headerByteSize = 0;
  var lowerBitsByteSize = 0;
  var higherBitsByteSize = 0;

  var lowerBitsSize = 0;
  var lowerBitsSizePow2 = 0;
  var numberOfBuckets = 0;
  var t = 0.0;
  var t2 = 0;  

  /*
   * Main
   */
  headerByteSize = 16;
  t = (+(maxValue | 0)) + 1.0;
  t = t / (+(len | 0));
  t2 = (nextPow2(~~ceil(t)) | 0) >>> 0;
  t2 = deBruijnSelect(deBruijnTableP, t2, tmpP) | 0;
  lowerBitsSize = U1[tmpP >> 0] | 0;
  lowerBitsSizePow2 = (1 << lowerBitsSize) | 0;
  numberOfBuckets = ~~ceil(t / +(lowerBitsSizePow2 | 0));

  // conversion from bit size to byte size
  // TODO: imul(len, beta) must be in [1, 2^32 - 1]. Check this.
  lowerBitsByteSize = (((imul(lowerBitsSize, len) - 1) >>> 5) + 1) << 2;

  // conversion from bit size to byte size
  // TODO: len + numberOfBuckets must be in [1, 2^32 - 1]. Check this.
  higherBitsByteSize = ((((len + numberOfBuckets) - 1) >>> 5) + 1) << 2;

  return (headerByteSize + lowerBitsByteSize + higherBitsByteSize) | 0;
}