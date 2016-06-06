import hash from '../../../util/MurmurHash3_x86_32';

/**
 * Updates the value by the following formula in 32-bit precision
 * map[key] = coef * map[key] + value
 *
 * @param {int} p - byte offset
 * @param {int} key - 32-bit unsigned integer
 * @param {double} value - 64-bit float
 * @param {double} coef - 64-bit float.
 */
export default function sparseBuilderAdd(p, key, value, coef) {
  /*
   * Type annotations
   */
  p = p | 0;
  key = key | 0;
  value = +value;
  coef = +coef;

  /*
   * Local variables
   */
  var TMP1 = 0;
  var TMP2 = 4;
  var LEN = 12;
  var MNK = 16;
  var FRP = 24;
  var lenP = 0;
  var mnkP = 0;
  var frpP = 0;
  var freeAbsP = 0; // byte offset for a new entry
  var entryP = 0;
  var prevP = 0;
  var valueAbsP = 0;
  var v = 0.0;
  var currentSize = 0;
  var maximumNumberOfKeys = 0;

  /*
   * Main
   */
  lenP = (p + LEN) | 0;
  mnkP = (p + MNK) | 0;
  frpP = (p + FRP) | 0;
    
  _find(p, key);
  entryP = I4[(p + TMP1) >> 2] | 0;
  prevP = I4[(p + TMP2) >> 2] | 0;

  if ((entryP | 0) != 0) {
    // Key matched
    valueAbsP = (p + entryP + 4) | 0;
    v = +F4[valueAbsP >> 2];
    v = v + value * coef;
    F4[valueAbsP >> 2] = v;
    return;
  }

  currentSize = I4[lenP >> 2] | 0;
  maximumNumberOfKeys = I4[mnkP >> 2] | 0;
  
  if ((currentSize | 0) == (maximumNumberOfKeys | 0)) {       
    return;
  }

  // Add a new entry
  freeAbsP = (p + (U4[frpP >> 2] | 0)) | 0;
  I4[(p + prevP) >> 2] = (freeAbsP - p) | 0;
  I4[freeAbsP >> 2] = key;
  freeAbsP = (freeAbsP + 4) | 0;
  F4[freeAbsP >> 2] = value;
  freeAbsP = (freeAbsP + 4) | 0;
  I4[freeAbsP >> 2] = 0; // space for the next linked list entry
  freeAbsP = (freeAbsP + 4) | 0;
  U4[frpP >> 2] = (freeAbsP - p) | 0;

  // increment the number of entries
  I4[lenP >> 2] = (currentSize + 1) | 0;
}

/**
 * Find an entry for a key.
 *
 * After this operation, byte offset to the start of an entry (relative to
 * the start of this map) is written into the first 32-bit of TMP
 * relative byte offset to a position where the pointer to the entry is
 * written into the second 32-bit of TMP.
 *
 * When the key is not found, the first 32-bit of TMP will be 0.
 * The second 32-bit of TMP will be ...
 *
 * @param {int} p - byte offset
 * @param {int} key - 32-bit unsigned integer
 */
function _find(p, key) {
  /*
   * Type annotations
   */
  p = p | 0;
  key = key | 0;
  
  /*
   * Local variables
   */
  var TMP1 = 0;
  var TMP2 = 4;
  var TBS = 8;
  var TABLE_START = 32;
  var SEED = 42; // 42 is a seed chosen arbitrarily
  var mask = 0;
  var hashValue = 0;
  var k = 0;
  var prevP = 0;
  var nextP = 0;
  var entryP = 0;
  var tmp1P = 0;
  
  /*
   * Main
   */
  tmp1P = (p + TMP1) | 0;

  mask = ((I4[(p + TBS) >> 2] >>> 0) - 1) >>> 0;
  I4[tmp1P >> 2] = key;
  hashValue = hash(tmp1P, 4, SEED) | 0;

  prevP = (TABLE_START + ((hashValue & mask) << 2)) | 0;
  nextP = I4[(p + prevP) >> 2] | 0;
  
  // while (nextP is not empty and key is not matched)
  while (((nextP | 0) != 0) & ((k | 0) != (key | 0))) {
    entryP = nextP;
    k = I4[(p + entryP) >> 2] | 0;
    prevP = entryP;
    nextP = U4[((p + entryP + 8) | 0) >> 2] | 0;
  }
  
  I4[(p + TMP2) >> 2] = prevP | 0;

  if ((k | 0) == (key | 0)) {
    // Key matched
    I4[tmp1P >> 2] = entryP | 0;
  } else {
    I4[tmp1P >> 2] = 0;
  }
}