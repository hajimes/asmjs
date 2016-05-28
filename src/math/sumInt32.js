/**
 * Returns the sum of 32-bit signed integers.
 * 0 if the specified length is less than 1.
 *
 * @param {int} p - byte offset
 * @param {int} len - length
 * @returns {signed} - sum
 */
export default function sumInt32(p, len) {
 /*
  * Type annotations
  */
  p = p | 0;
  len = len | 0;

 /*
  * Local variables
  */
  var end = 0;
  var v = 0;
  var result = 0;

 /*
  * Main
  */
  if ((len | 0) < 0) {
    return 0;
  }
  
  end = (p + (len << 2)) | 0;

  for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = I4[p >> 2] | 0;
    result = (result + v) | 0;
  }

  return result | 0;
}