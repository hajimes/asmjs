import sort from '../util/qsortBM';

/**
 * Sort the element in a sparse vector with ascending order of indices.
 *
 * This method uses exactly (nz * 4) bytes at tmpP.
 * Exactly (nz * 4) will be written into each of outValueP and outIndexP.
 */
export default function sortSparseVectorElements(nz, valueP, indexP, tmpP,
    outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  tmpP = tmpP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;

  /*
   * Local variables
   */
  var i = 0;
  var p = 0;

  /*
   * Main
   */
  if ((nz | 0) <= 0) {
    return;
  }
  
  for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    I4[(tmpP + (i << 2)) >> 2] = (indexP + (i << 2)) | 0;
  }

  sort(tmpP, nz, 4, 2);
  
  for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    p = I4[(tmpP + (i << 2)) >> 2] | 0;
    I4[outIndexP >> 2] = I4[p >> 2] | 0;
    p = (p - indexP) | 0;
    F4[outValueP >> 2] = F4[(valueP + p) >> 2];
    
    outValueP = (outValueP + 4) | 0;
    outIndexP = (outIndexP + 4) | 0;
  }
}