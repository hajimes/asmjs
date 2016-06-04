/**
 * Initializes a table used in <code>deBruijnSelect</code>.
 * Exactly 32 bytes will be written into outP.
 */
export default function deBruijnSelectInit(outP) {
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