/**
 * Returns the sum of 32-bit floats.
 * 0.0 if the specified length is less than 1.
 *
 * @param {int} p - byte offset
 * @param {int} len - length
 * @returns {double} - sum
 */
export default function sumFloat32(p, len) {
 /*
  * Type annotations
  */
  p = p | 0;
  len = len | 0;

 /*
  * Local variables
  */
  var end = 0;
  var v = 0.0;
  var result = 0.0;

 /*
  * Main
  */
  if ((len | 0) < 0) {
    return 0.0;
  }
  
  end = (p + (len << 2)) | 0;

  for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = +F4[p >> 2];
    result = result + v;
  }

  return +result;
}