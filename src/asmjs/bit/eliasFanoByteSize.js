import deBruijnSelect from './deBruijnSelect';
import nextPow2 from './nextPow2';

/**
 * Calculates the exact byte size required by the Elias-Fano structure for a
 * sequence of unique 32-bit unsigned integers.
 *
 * In terms of space complexity, this structure uses B(m, n) + O(n) bits,
 * where B(m, n) = log2(ceil(binomial_coefficient(m, n))).
 */
export default function eliasFanoByteSize(maxValue, len, deBruijnTableP, outP) {
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