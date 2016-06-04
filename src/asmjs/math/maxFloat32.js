/**
 * Returns the largest number of one or more 32-bit floats.
 * If the specified length is less than 1, the behavior is undefined.
 *
 * @param {int} p - byte offset
 * @param {int} len - length
 * @returns {double} - max value
 */
export default function maxFloat32(p, len) {
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
  end = (p + (len << 2)) | 0;
  result = +F4[p >> 2];
  p = (p + 4) | 0;

  for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = +F4[p >> 2];

    if (v >= result) {
      result = v;
    }
  }

  return +result;
}