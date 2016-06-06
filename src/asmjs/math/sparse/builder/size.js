/**
 * Returns the number of entries contained in this builder.
 *
 * @param {int} p - byte offset
 * @returns {signed} - size 
 */
export default function sparseBuilderSize(p) {
  /*
   * Type annotations
   */
  p = p | 0;

  /*
   * Local variables
   */
  var LEN = 12;

  /*
   * Main
   */
  return I4[(p + LEN) >> 2] | 0;
}