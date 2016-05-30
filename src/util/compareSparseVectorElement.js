export default function compareSparseVectorElement(xP, yP) {
  /*
   * Type annotations
   */
  xP = xP | 0;
  yP = yP | 0;
  
  /*
   * Local variables
   */
  var p0 = 0;
  var p1 = 0;

  /*
   * Main
   */
  p0 = I4[xP >> 2] | 0;
  p1 = I4[yP >> 2] | 0;
  
  return ((I4[p0 >> 2] | 0) - (I4[p1 >> 2] | 0)) | 0;
}