
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
export default function nextPow2(v) {
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