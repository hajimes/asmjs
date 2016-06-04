/**
 * Returns the l0 of a dense vector.
 */
export default function l0(p, len) {
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