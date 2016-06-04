export default function compareUint32(xP, yP) {
  /*
   * Type annotations
   */
  xP = xP | 0;
  yP = yP | 0;  
  
  /*
   * Main
   */
  return ((U4[xP >> 2] >>> 0) - (U4[yP >> 2] >>> 0)) | 0;
}