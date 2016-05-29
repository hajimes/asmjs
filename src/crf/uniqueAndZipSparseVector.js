import sort from '../util/qsortBM';

/**
 * Given a sparse vector with the form
 *   | index1 | value1 | index2 | value2 | ... 
 * where indices may be repeated, this function makes the indices unique and
 * returns it with the double array representation.
 *
 * TODO: this function is too specific. Break down this to
 * some general functions.
 *
 * Current implementation sorts elements by indices but this behavior may change
 * in future.
 */
export default function uniqueAndZipSparseVector(nz, inP,
    outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  inP = inP | 0;
  outNzP = outNzP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var value = 0.0;
  var index = 0;
  var previousIndex = 0;
  var newNz = 0;
  var newValue = 0.0;

  /*
   * Main
   */
  if ((nz | 0) <= 0) {
    return;
  }
  
  sort(inP, nz, 8, 0);

  index = U4[inP >> 2] >>> 0;
  inP = (inP + 4) | 0;
  value = +F4[inP >> 2];
  inP = (inP + 4) | 0;
  newValue = value;
  previousIndex = index;

  for (i = 1; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    index = U4[inP >> 2] >>> 0;
    inP = (inP + 4) | 0;
    value = +F4[inP >> 2];
    inP = (inP + 4) | 0;
    
    if ((index >>> 0) == (previousIndex >>> 0)) {
      newValue = newValue + value;
    } else {
      F4[outValueP >> 2] = newValue;
      U4[outIndexP >> 2] = previousIndex;
      
      newValue = value;
      
      newNz = (newNz + 1) | 0;
      outValueP = (outValueP + 4) | 0;
      outIndexP = (outIndexP + 4) | 0;
    }
    
    previousIndex = index;
  }

  newNz = (newNz + 1) | 0;
  I4[outNzP >> 2] = newNz;
  F4[outValueP >> 2] = newValue;
  U4[outIndexP >> 2] = previousIndex;
}