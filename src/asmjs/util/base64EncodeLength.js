/**
 * @param {int} len
 * @returns {signed} number of bytes to be written if the length is valid,
 *   otherwise negative value
 * @see RFC 4648 (S. Joefsson. 2006.
 *   The Base16, Base32, and Base64 Data Encodings.)
 */
export default function base64EncodeLength(len) {
  /*
   * Type annotations
   */
  len = len | 0;
  
  /*
   * Main
   */
  if ((len | 0) <= 0) {
    return len | 0;
  }
  
  return ((((((len - 1) | 0) / 3) | 0) + 1) << 2) | 0;
}