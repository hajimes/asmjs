/**
 * @parma {int} b - first byte of a utf-8 sequence
 * @returns {signed} - number of trailing bytes for the sequence
 */
export default function trailingBytesForUtf8(b) {
  /*
   * Type annotations
   */
  b = b | 0;
  
  /*
   * Main
   */   
  b = b & 0xff;
  if ((b | 0) < 192) {
    return 0;
  } else if ((b | 0) < 224) {
    return 1;
  } else if ((b | 0) < 240) {
    return 2;
  } else if ((b | 0) < 248){
    return 3;
  }
  
  
  // invalid
  return 0xff;
}