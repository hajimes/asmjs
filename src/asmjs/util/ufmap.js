import hash from './MurmurHash3_x86_32';

/********************
 * ufmap
 *
 * A hash map implementation where
 * a key is limited to an unsigned 32-bit integer and
 * a value is limited to a 32-bit float.
 *
 * For efficiency, the maximum number of keys must be specified at creation.
 *
 * +-------+---+---+---+---+---+---+
 * |  TMP  |TBS|LEN|MNK|LLP|FRP|FLG| (more-->)
 * +-------+---+---+---+---+---+---+
 *
 * +===============+===============+
 * |... BUCKETS ...|... ENTRIES ...|
 * +===============+===============+
 *
 * TMP: free 64-bit space to allocate temporary variables
 * TBS: table size
 * LEN: current number of items in this map
 * MNK: maximum number of keys this map can contain
 * LLP: relative byte offset to the linked list
 * FRP: relative byte offset to the next free entry space
 * FLG: flags
 * BUCKETS: hash table
 * ENTRIES: a sequence of entries
 *
 * This data structure uses 
 * 32 + tableSize * 4 (bytes) + maxNumberOfKeys * 12 (bytes)
 *
 * This hash map uses separated chaining with linked lists as collision
 * resolution. Each bucket uses signed 32-bit integer as a pointer to the
 * first entry of a linked list. 0 denotes the key is not used.
 *
 * Each entry occupies 12 bytes.
 *
 * +---+---+---+
 * |KEY|VAL|NXT|
 * +---+---+---+
 *
 * KEY: 32-bit unsigned value for a key
 * VAL: 32-bit float value for a value
 * NXT: relative byte offset to the next entry
 *
 * NXT == 0 indicates that the entry is the last one in a linked list.
 * NXT == 0xffffffff indicates that the entry is free and can be
 * reallocated, and in this case KEY represents the relative byte offset to
 * next free space.
 ********************/

/**
 * Creates a new hash map.
 *
 * `tableSize` must be a power of 2. No validation is employed.
 *
 * @param {int} p - byte offset
 * @param {int} tableSize - size of table
 * @param {int} maxNumberOfKeys - unsigned 32-bit integer
 *   to specify the maximum number of keys
 */
export function ufmap_create(p, tableSize, maxNumberOfKeys) {
  /*
   * Type annotations
   */
  p = p | 0;
  tableSize = tableSize | 0;
  maxNumberOfKeys = maxNumberOfKeys | 0;
  
  /*
   * Local variables
   */
  var linkedListP = 0; // byte offset to the first linked list entry
  
  /*
   * Main
   */
  U4[(p + 8) >> 2] = tableSize;
  U4[(p + 12) >> 2] = 0;
  U4[(p + 16) >> 2] = maxNumberOfKeys;
  linkedListP = (32 + tableSize) | 0;
  U4[(p + 20) >> 2] = linkedListP;
  U4[(p + 24) >> 2] = linkedListP;
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
function _ufmap_find(p, key) {
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

  mask = ((U4[(p + TBS) >> 2] | 0) - 1) >>> 0;
  U4[tmp1P >> 2] = key;
  hashValue = hash(tmp1P, 1, SEED) | 0;

  prevP = (TABLE_START + (hashValue & mask)) | 0;
  nextP = U4[(p + prevP) >> 2] | 0;
  
  // while (nextP is not empty and key is not matched)
  while (((nextP | 0) != 0) & ((k >>> 0) != (key >>> 0))) {
    entryP = nextP;
    k = U4[(p + entryP) >> 2] | 0;
    prevP = entryP;
    nextP = U4[((p + entryP + 8) | 0) >> 2] | 0;
  }
  
  U4[(p + TMP2) >> 2] = prevP | 0;

  if ((k | 0) == (key | 0)) {
    // Key matched
    U4[tmp1P >> 2] = entryP | 0;
  } else {
    U4[tmp1P >> 2] = 0;
  }
}

/**
 * @param {int} p - byte offset
 * @param {signed} key - 32-bit unsigned integer
 */
export function ufmap_has(p, key) {
  /*
   * Type annotations
   */
  p = p | 0;
  key = key | 0;
  
  /*
   * Local variables
   */
  var TMP1 = 0;
  var matched = 0;

  /*
   * Main
   */
  _ufmap_find(p, key);
  matched = U4[(p + TMP1) >> 2] | 0;
  
  if ((matched | 0) != 0) {
    // Key matched
    return 1;
  }
  
  return 0;
}

/**
 * Updates the value by the following formula in 32-bit precision
 * map[key] = coef * map[key] + value
 *
 * @param {int} p - byte offset
 * @param {int} key - 32-bit unsigned integer
 * @param {double} value - 64-bit float
 * @param {double} coef - 64-bit float
 */
export function ufmap_add(p, key, value, coef) {
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
  
  _ufmap_find(p, key);
  entryP = U4[(p + TMP1) >> 2] | 0;
  prevP = U4[(p + TMP2) >> 2] | 0;

  if ((entryP | 0) != 0) {
    // Key matched
    valueAbsP = (p + entryP + 4) | 0;
    v = +F4[valueAbsP >> 2];
    v = coef * v + value;
    F4[valueAbsP >> 2] = v;
    return;
  }

  currentSize = U4[lenP >> 2] >>> 0;
  maximumNumberOfKeys = U4[mnkP >> 2] >>> 0;
  
  if ((currentSize >>> 0) == (maximumNumberOfKeys >>> 0)) {       
    return;
  }

  // Add a new entry
  freeAbsP = (p + (U4[frpP >> 2] | 0)) | 0;
  U4[(p + prevP) >> 2] = (freeAbsP - p) | 0;
  U4[freeAbsP >> 2] = key;
  freeAbsP = (freeAbsP + 4) | 0;
  F4[freeAbsP >> 2] = value;
  freeAbsP = (freeAbsP + 4) | 0;
  U4[frpP >> 2] = (freeAbsP - p) | 0;

  // increment the number of entries
  U4[lenP >> 2] = (currentSize + 1) >>> 0;
}

/**
 * @param {int} p - byte offset
 * @param {int} key - 32-bit unsigned integer
 */
export function ufmap_get(p, key) {
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
  var matched = 0;
  var entryP = 0;
  var prevP = 0;

  /*
   * Main
   */
  _ufmap_find(p, key);
  matched = U4[(p + TMP1) >> 2] | 0;
  entryP = (p + matched) | 0;
  prevP = (p + (U4[(p + TMP2) >> 2] | 0)) | 0;

  if ((matched | 0) != 0) {
    // Key matched
    return +F4[(entryP + 4) >> 2];
  }
  
  return 0.0;
}

/**
 * Returns the number of entries contained in this map.
 *
 * @param {int} p - byte offset
 * @returns {signed} - size 
 */
export function ufmap_size(p) {
  /*
   * Type annotations
   */
  p = p | 0;

  /*
   * Local variables
   */
  var LEN = 12;

  /*
   * Main
   */
  return U4[(p + LEN) >> 2] | 0;
}