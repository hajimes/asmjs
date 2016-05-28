import trailingBytesForUtf8 from './trailingBytesForUtf8'

/**
 * Based on ConvertUTF.c by Unicode, Inc.
 * Endian dependent.
 *
 * @param {int} inPP - byte offset to a byte offset to uint16s
 * @param {int} inEnd - byte offset to the end of inputs
 * @param {int} outPP - byte offset to a byte offset to uint8s
 * @param {int} outEnd - byte offset to the end of outputs
 * @returns {signed} - error code
 */
export default function convertUtf8toUtf16(inPP, inEnd, outPP, outEnd) {
  /*
   * Type annotations
   */
  inPP = inPP | 0;
  inEnd = inEnd | 0;
  outPP = outPP | 0;
  outEnd = outEnd | 0;
  
  /*
   * Local variables
   */
  var SUR_HIGH_START = 0xd800;
  var SUR_LOW_START = 0xdc00;
  var SUR_LOW_END = 0xdfff;
  var HALF_SHIFT = 10;
  var HALF_BASE = 0x0010000;
  var HALF_MASK = 0x3ff;
  var ERROR_SOURCE_EXHAUSTED = 1;
  var ERROR_TARGET_EXHAUSTED = 2;
  var ERROR_SOURCE_ILLEGAL = 3;
  var result = 0;
  var ch = 0;
  var v = 0;
  var inP = 0;
  var outP = 0;
  var extraBytesToRead = 0;
  
  /*
   * Main
   */
  inP = U4[inPP >> 2] | 0;
  outP = U4[outPP >> 2] | 0;  
  while ((inP | 0) < (inEnd | 0)) {
    ch = 0;
    v = U1[inP >> 0] | 0;
    extraBytesToRead = trailingBytesForUtf8(v) | 0;
    if ((extraBytesToRead | 0) >= ((inEnd - inP) | 0)) {
      result = ERROR_SOURCE_EXHAUSTED | 0;
      break;
    }
    
    // if (!isLegalUtf8)
            
    switch (extraBytesToRead | 0) {
      case 3:
        v = U1[inP >> 0] | 0;
        ch = (ch + v) | 0;
        inP = (inP + 1) | 0;
        ch = ch << 6;
        // fall through
      case 2:
        v = U1[inP >> 0] | 0;
        ch = (ch + v) | 0;
        inP = (inP + 1) | 0;
        ch = ch << 6;
        // fall through
      case 1:
        v = U1[inP >> 0] | 0;
        ch = (ch + v) | 0;
        inP = (inP + 1) | 0;
        ch = ch << 6;
        // fall through
      case 0:
        v = U1[inP >> 0] | 0;
        ch = (ch + v) | 0;
        inP = (inP + 1) | 0;
    }
    
    switch (extraBytesToRead | 0) {
      case 3:
        ch = (ch - 0x3c82080) | 0;
        break;
      case 2:
        ch = (ch - 0xe2080) | 0;
        break;
      case 1:
        ch = (ch - 0x3080) | 0;
        break;
    }

    if ((outP | 0) >= (outEnd | 0)) {
      inP = (inP - extraBytesToRead + 1) | 0;
      result = ERROR_TARGET_EXHAUSTED;
      break;
    }
    
    if ((ch | 0) <= 0xffff) {
      // if BMP
      if (((ch | 0) >= (SUR_HIGH_START | 0)) &
        ((ch | 0) <= (SUR_LOW_END | 0))) {
        inP = (inP - extraBytesToRead + 1) | 0;
        result = ERROR_SOURCE_ILLEGAL = 3;
        break;
      } else {
        U2[outP >> 1] = ch | 0;
        outP = (outP + 2) | 0;
      }
    } else if ((ch | 0) > 0x10ffff) {
      // if outside Unicode
      result = ERROR_SOURCE_ILLEGAL | 0;
      inP = (inP - extraBytesToRead + 1) | 0;
      break;
    } else {
      // if non-BMP
      if ((outP | 0) >= (outEnd | 0)) {
        inP = (inP - extraBytesToRead + 1) | 0;
        result = ERROR_TARGET_EXHAUSTED;
        break;
      }
      ch = (ch - HALF_BASE) | 0;
      U2[outP >> 1] = ((ch >> HALF_SHIFT) + SUR_HIGH_START) | 0;
      outP = (outP + 2) | 0;
      U2[outP >> 1] = ((ch & HALF_MASK) + SUR_LOW_START) | 0;
    }
    
  } // end while
  
  U4[inPP >> 2] = inP | 0;
  U4[outPP >> 2] = outP | 0;
  
  return result | 0;
}