import size from './size';

/**
 * Exactly 4 bytes will be writen into <code>outNzP</code>.
 * At most 4 * I4[outNzP >> 2] bytes will be written into each
 * <code>outValueP</code> and <code>outIndexP</code>
 */
export default function sparseBuilderBuild(p, outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  p = p | 0;
  outNzP = outNzP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP| 0;

  /*
   * Local variables
   */
  var endP = 0;
  var linkedListP = 0;
  var value = 0.0;
  var nz = 0;
  
  /*
   * Main
   */
  linkedListP = (p + (I4[(p + 20) >> 2] | 0)) | 0;
  endP = (linkedListP + imul((size(p) | 0) << 2, 3)) | 0;
  
  for (; (linkedListP | 0) < (endP | 0); linkedListP = (linkedListP + 12) | 0) {
    value = +F4[(linkedListP + 4) >> 2];
    if (value != 0.0) {
      F4[outValueP >> 2] = value;
      I4[outIndexP >> 2] = I4[linkedListP >> 2] | 0;
      outValueP = (outValueP + 4) | 0;
      outIndexP = (outIndexP + 4) | 0;
      nz = (nz + 1) | 0;
    }
  }
  
  I4[outNzP >> 2] = nz;
}