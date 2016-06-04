/**
 * Performs temporary updating for the first order information and
 * second order information of AdaGrad with a gradient.
 * Actual values will be calculated lazily.
 *
 * @param {int} nz - number of non-zero elements in a gradient
 * @param {int} xP - byte offset to float values of a gradient
 * @param {int} indexP - byte offset to uint32 indices of a gradient
 * @param {int} foiP - byte offset to a float dense vec 1st order info
 * @param {int} soiP - byte offset to a float dense vec 2nd order info
 */
export default function updateTemporary(nz, xP, indexP, foiP, soiP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  xP = xP | 0;
  indexP = indexP | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;

  /*
   * Local variables
   */
  var end = 0;
  var index = 0;
  var value = 0.0;
  var p1 = 0;
  var p2 = 0;

  /*
   * Main
   */
  end = (indexP + (nz << 2)) | 0;
  while ((indexP | 0) < (end | 0)) {
    index = I4[indexP >> 2] | 0;
    value = +F4[xP >> 2];
     
    p1 = (foiP + (index << 2)) | 0;
    p2 = (soiP + (index << 2)) | 0;
    
    F4[p1 >> 2] = +F4[p1 >> 2] + value;
    F4[p2 >> 2] = +F4[p2 >> 2] + (value * value);

    indexP = (indexP + 4) | 0;
    xP = (xP + 4) | 0;
  }
}
