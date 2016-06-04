/**
 * Check if the current environment is little-endian or not.
 *
 * @returns {signed} - 1 if little-endian, otherwise 0
 */
export default function isLittleEndian() {
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