/********************
 * SparseBuilder
 *
 * A builder to create a double-array sparse vector.
 * This implementation uses a hash map where
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
 * Creates a new sparse vector builder.
 *
 * `tableSize` must be a power of 2. No validation is employed.
 *
 * This map uses (32 + tableSize * 4 + maxNumberOfKeys * 12) at <code>p</code>.
 *
 * @param {int} p - byte offset
 * @param {int} tableSize - size of table
 * @param {int} maxNumberOfKeys - unsigned 32-bit integer
 *   to specify the maximum number of keys
 */
export default function sparseBuilderCreate(p, tableSize, maxNumberOfKeys) {
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
  I4[(p + 0) >> 2] = 0;
  I4[(p + 4) >> 2] = 0;
  I4[(p + 8) >> 2] = tableSize;
  I4[(p + 12) >> 2] = 0;
  I4[(p + 16) >> 2] = maxNumberOfKeys;
  linkedListP = (32 + (tableSize << 2)) | 0;
  I4[(p + 20) >> 2] = linkedListP;
  I4[(p + 24) >> 2] = linkedListP;
}