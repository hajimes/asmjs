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
export default function popcount(n) {
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