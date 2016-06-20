/**
 * Returns the number of 1s in a 32-bit integer and
 * writes out the actual indices of the 1s (0 <= i < 32) into <code>outP</code>.
 * Each index occupies one byte, so at most 32 bytes (32 uint8 integers) will
 * be written into <code>outP</code>.
 *
 * Faster than the de Bruijn version for dense cases
 */
export default function select(n, outP) {
  /*
   * Type annotations
   */
  n = n | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var bit = 0;
  var result = 0;

  /*
   * Main
   */
  for (; (i | 0) < 32; i = (i + 1) | 0) {
    bit = n & 1;
    if ((bit | 0) == 1) {
      U1[(outP + result) >> 0] = i | 0;
    }
    result = (result + bit) | 0;
    n = n >>> 1;
  }
  
  return result | 0;
}