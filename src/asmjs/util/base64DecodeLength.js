/**
 * @param {int} len
 * @returns {signed} maximum number of bytes to be writtenif the length is
 *   valid, otherwise negative value
 * @see RFC 4648 (S. Joefsson. 2006.
 *   The Base16, Base32, and Base64 Data Encodings.)
 */
export default function base64DecodeLength(len) {
  /*
   * Type annotations
   */
  len = len | 0;
  
  /*
   * Main
   */
  if (((len | 0) < 0) | (len & 3)) {
    return -1;
  }
  
  return imul(((len - 1) >> 2) + 1, 3);
}