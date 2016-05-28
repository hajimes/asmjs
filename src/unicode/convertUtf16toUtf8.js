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
export default function uc_convertUtf16toUtf8(inPP, inEnd, outPP, outEnd) {
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
  var SUR_HIGH_END = 0xdbff;
  var SUR_LOW_START = 0xdc00;
  var SUR_LOW_END = 0xdfff;
  var HALF_SHIFT = 10;
  var HALF_BASE = 0x0010000;
  // var HALF_MASK = 0x3ff;
  var BYTE_MASK = 0xBF;
  var BYTE_MARK = 0x80;
  // var ERROR_SOURCE_EXHAUSTED = 1;
  var ERROR_TARGET_EXHAUSTED = 2;
  var ERROR_SOURCE_ILLEGAL = 3;
  var ch = 0;
  var ch2 = 0;
  var bytesToWrite = 0;
  var inP = 0;
  var outP = 0;
  var firstByteMask = 0;
  
  /*
   * Main
   */
  inP = U4[inPP >> 2] | 0;
  outP = U4[outPP >> 2] | 0;      
  while ((inP | 0) < (inEnd | 0)) {
    ch = U2[inP >> 1] | 0;
    inP = (inP + 2) | 0;
    
    // check if ch is a high surrogate
    if (((ch | 0) >= (SUR_HIGH_START | 0)) &
          ((ch | 0) <= (SUR_HIGH_END | 0))) {
      if ((inP | 0) < (inEnd | 0)) {
        ch2 = U2[inP >> 1] | 0;
        
        // check if ch2 is a low surrogate
        if (((ch2 | 0) >= (SUR_LOW_START | 0)) &
            ((ch2 | 0) <= (SUR_LOW_END | 0))) {
          ch = (((ch - SUR_HIGH_START) << HALF_SHIFT) +
            ((ch2 - SUR_LOW_START) + HALF_BASE)) | 0;
          inP = (inP + 2) | 0;
        }
      } else {
        // Input utf-16 string is ill-formed.
        inP = (inP - 2) | 0;
        return ERROR_SOURCE_ILLEGAL | 0;
      }
      
      U1[outP >> 0] = ch;
    } // end if surroge
    
    // How many bytes will the result require?
    if ((ch | 0) < 0x80) {
      bytesToWrite = 1;
    } else if ((ch | 0) < 0x800) {
      bytesToWrite = 2;
    } else if ((ch | 0) < 0x10000) {
      bytesToWrite = 3;
    } else if ((ch | 0) < 0x110000) {
      bytesToWrite = 4;
    } else {
      bytesToWrite = 3;
      ch = 0xffffffff;
    }
    
    // Write bytes
    outP = (outP + bytesToWrite) | 0;
    if ((outP | 0) > (outEnd | 0)) {
      return ERROR_TARGET_EXHAUSTED | 0;
    }
    
    switch (bytesToWrite | 0) {
      case 4:
        outP = (outP - 1) | 0;
        U1[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
        ch = ch >> 6;
        /* falls through */
      case 3:
        outP = (outP - 1) | 0;
        U1[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
        ch = ch >> 6;
        /* falls through */
      case 2:
        outP = (outP - 1) | 0;
        U1[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
        ch = ch >> 6;
        /* falls through */
      case 1:
        outP = (outP - 1) | 0;
        if ((bytesToWrite | 0) == 1){
          firstByteMask = 0;
        } else if ((bytesToWrite | 0) == 2) {
          firstByteMask = 0xc0;
        } else if ((bytesToWrite | 0) == 3) {
          firstByteMask = 0xe0;              
        } else {
          firstByteMask = 0xf0;
        }

        U1[outP >> 0] = (ch | firstByteMask);
    } // end switch
    outP = (outP + bytesToWrite) | 0;
  } // end while
  
  U4[inPP >> 2] = inP | 0;
  U4[outPP >> 2] = outP | 0;
  
  return 0;
}