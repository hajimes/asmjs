import sort from '../sortSparseVectorElements';

/**
 * Sums up repeated indices in a sparse vector
 * and returns a new sparse vector with unique indices.
 *
 * This method uses exactly (nz * 4) bytes at tmpP.
 *
 * Exactly 4 bytes will be written into outNzP.
 * This function uses exactly (nz * 4) bytes at outValueP and outIndexP,
 * even when the resulting vector is smaller than that.
 *
 * The current implementation sorts elements by indices but this behavior may
 * change in future.
 */
export default function unique(nz, valueP, indexP,
    outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
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
  sort(nz, valueP, indexP, outValueP, outIndexP);
  valueP = outValueP;
  indexP = outIndexP;

  index = I4[indexP >> 2] | 0;
  indexP = (indexP + 4) | 0;
  value = +F4[valueP >> 2];
  valueP = (valueP + 4) | 0;
  newValue = value;
  previousIndex = index;

  for (i = 1; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    index = I4[indexP >> 2] | 0;
    indexP = (indexP + 4) | 0;
    value = +F4[valueP >> 2];
    valueP = (valueP + 4) | 0;
    
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