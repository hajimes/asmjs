/**
 * Returns the number of 1s in a 32-bit integer and
 * writes out the actual indices of the 1s (0 <= i < 32) into <code>outP</code>.
 * Each index occupies one byte, so at most 32 bytes (32 int8 integers) will
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
export default function deBruijnSelect(tableP, n, outP) {
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