import base64EncodeLength from './base64EncodeLength';

/**
 * Encodes bytes with base64 writing it out into <code>outP</code>,
 * and returns the number of bytes written.
 * The number of bytes to be written can be computed by 
 * <code>base64EncodeLength</code> beforehand.
 *
 * @param {int} inP - byte offset from which data are to be read
 * @param {int} len - number of the bytes of the specified input
 * @param {int} outP - byte offset into which the results are to be written
 * @returns {signed} - number of bytes written
 * @see RFC 4648 (S. Joefsson. 2006.
 *   The Base16, Base32, and Base64 Data Encodings.)
 */
export default function base64Encode(inP, len, outP) {
  /*
   * Type annotations
   */
  inP = inP | 0;
  len = len | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var b1 = 0;
  var b2 = 0;
  var b3 = 0;
  var c = 0;
  var padding = 0;
  var result = 0;
  
  /*
   * Main
   */
  result = base64EncodeLength(len) | 0;

  while ((len | 0) > 0) {
    b1 = U1[inP >> 0] | 0;
    inP = (inP + 1) | 0;
    len = (len - 1) | 0;
    
    c = 0;
    c = b1 >>> 2;
    U1[outP >> 0] = encodeSixBits(c) | 0;
    outP = (outP + 1) | 0;
    
    if ((len | 0) > 0) {
      b2 = U1[inP >> 0] | 0;
      inP = (inP + 1) | 0;
      len = (len - 1) | 0;
    } else {
      padding = 2;
      c = (b1 & 3) << 4;
      U1[outP >> 0] = encodeSixBits(c) | 0;
      outP = (outP + 1) | 0;
      break;
    }
    
    c = 0;
    c = ((b1 & 3) << 4) | (b2 >>> 4);
    U1[outP >> 0] = encodeSixBits(c) | 0;
    outP = (outP + 1) | 0;
   
    if ((len | 0) > 0) {
      b3 = U1[inP >> 0] | 0;
      inP = (inP + 1) | 0;
      len = (len - 1) | 0;
    } else {
      padding = 1;
      c = 0;
      c = (b2 & 15) << 2;
      U1[outP >> 0] = encodeSixBits(c) | 0;
      outP = (outP + 1) | 0;
      break;
    }

    c = 0;
    c = ((b2 & 15) << 2) | (b3 >>> 6);
    U1[outP >> 0] = encodeSixBits(c) | 0;
    outP = (outP + 1) | 0;

    c = 0;
    c = b3 & 63;
    U1[outP >> 0] = encodeSixBits(c) | 0;
    outP = (outP + 1) | 0;
  }
  
  while ((padding | 0) > 0) {
    U1[outP >> 0] = 0x3d; // ASCII for '='
    padding = (padding - 1) | 0;
    outP = (outP + 1) | 0;
  }
  
  return result | 0;
}

// compared with table-based approaches
// maybe slow for 0xfffffff.... but maybe not so slow in common cases
function encodeSixBits(c) {
  /*
   * Type annotations
   */
  c = c | 0;
  
  /*
   * Main
   */
  c = c & 63;
  if ((c | 0) < 26) {
    c = (c + 65) | 0; // 0 + 65 = 65 ('A')
  } else if ((c | 0) < 52) {
    c = (c + 71) | 0; // 26 + 71 = 97 ('a')
  } else if ((c | 0) < 62) {
    c = (c - 4) | 0; // 52 - 4 = 48 ('0')
  } else if ((c | 0) == 62) {
    c = 43; // '+'
  } else {
    c = 47; // '/'
  }
  return c | 0;
}