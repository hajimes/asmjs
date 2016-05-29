export default function compareInt32(xP, yP) {
  /*
   * Type annotations
   */
  xP = xP | 0;
  yP = yP | 0;  
  
  /*
   * Main
   */
  return ((I4[xP >> 2] | 0) - (I4[yP >> 2] | 0)) | 0;
}