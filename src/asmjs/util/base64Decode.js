/**
 * Decodes a base64 encoded format into <code>outP</code>,
 * and returns the number of bytes written.
 * The maximum number of bytes to be written can be computed by 
 * <code>base64DecodeLength</code> beforehand.
 *
 * Currently this implementation rejects invalid sequences and
 * returns a negative value in that case.
 *
 * @param {int} inP - byte offset from which data are to be read
 * @param {int} len - number of the bytes of the specified input
 * @param {int} outP - byte offset into which the results are to be written
 * @returns {signed} - number of bytes written if successfully decoded,
 *   otherwise a negative value
 * @see RFC 4648 (S. Joefsson. 2006.
 *   The Base16, Base32, and Base64 Data Encodings.)
 */
export default function base64Decode(inP, len, outP) {
  /*
   * Type annotations
   */
  inP = inP | 0;
  len = len | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var c1 = 0;
  var c2 = 0;
  var c3 = 0;
  var c4 = 0;
  var n = 0;

  /*
   * Main
   */
  if (((len | 0) < 0) | (len & 3)) {
    return -1;
  }
  
  while ((len | 0) > 0) {    
    c1 = decodeSixBits(U1[inP >> 0] | 0) | 0;
    c2 = decodeSixBits(U1[(inP + 1) >> 0] | 0) | 0;
    c3 = decodeSixBits(U1[(inP + 2) >> 0] | 0) | 0;
    c4 = decodeSixBits(U1[(inP + 3) >> 0] | 0) | 0;
    inP = (inP + 4) | 0;

    if ((c1 | 0) >= 64) {
      n = -1;
      break;
    }
    if ((c2 | 0) >= 64) {
      n = -1;
      break;
    }
    if (((c3 | 0) == 64) & ((c4 | 0) == 64)) {
      c3 = 0;
      n = (n - 1) | 0;
    } else if ((c3 | 0) >= 64) {
      n = -1;
      break;
    }
    if ((c4 | 0) == 64) {
      c4 = 0;
      n = (n - 1) | 0;
    } else if ((c4 | 0) > 64) {
      n = -1;
      break;
    }
    
    U1[outP >> 0] = (c1 << 2) | (c2 >>> 4);
    outP = (outP + 1) | 0;
    
    U1[outP >> 0] = (c2 << 4) | (c3 >>> 2);
    outP = (outP + 1) | 0;

    U1[outP >> 0] = (c3 << 6) | c4;
    outP = (outP + 1) | 0;
    
    len = (len - 4) | 0;
    n = (n + 3) | 0;
  }
  
  return n | 0;
}

function decodeSixBits(c) {
  /*
   * Type annotations
   */
  c = c | 0;
  
  /*
   * Main
   */
  c = c & 255;
  
  if (((c | 0) >= 65) & ((c | 0) <= 90)) { // A-Z
    c = (c - 65) | 0;
  } else if (((c | 0) >= 97) & ((c | 0) <= 122)) { // a-z
    c = (c - 71) | 0;
  } else if (((c | 0) >= 48) & ((c | 0) <= 57)) { // 0-9
    c = (c + 4) | 0;
  } else if ((c | 0) == 43) { // '+'
    c = 62;
  } else if ((c | 0) == 47) { // '/'
    c = 63;
  } else if ((c | 0) == 61) { // '='
    c = 64;
  } else {
    c = 255;
  }
  
  return c | 0;
}