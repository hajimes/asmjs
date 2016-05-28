import maxFloat32 from './maxFloat32';

/**
 * Returns the logsumexp of one or more 32-bit floats.
 * Always 0.0 if the specified length is less than 1.
 *
 * @param {int} p - byte offset
 * @param {int} len - length
 * @returns {double} - result of logsumexp
 */
export default function logsumexpFloat32(p, len) {
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
  var maxValue = 0.0;
  var result = 0.0;

 /*
  * Main
  */
  if ((len | 0) <= 0) {
    return 0.0;
  }
  
  maxValue = +maxFloat32(p, len);
  end = (p + (len << 2)) | 0;

  for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
    v = +F4[p >> 2];

    // exp(-20) = 2.06e-9, machine epsilon for float32 = 5.96e-08
    if (v - maxValue > -20.0) {
      result = +(result + (+exp(v - maxValue)));
    }
  }

  return +(maxValue + (+log(result)));
}