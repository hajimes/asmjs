/**
 * Writes (bitLength) bits into a heap.
 *
 * <code>p</code> must be a multiple of 4. <code>value</code> must be less
 * than <code>2^bitLength</code>. Destination must be initialized to 0 
 * beforehand. If these conditions are violated, the behavior is undefined.
 *
 * @param {number} p - base index in bytes which must be aligned to 4 bytes
 * @param {number} bitIndex - relative index in bits
 * @param {number} bitLength - length in bits (<= 32)
 * @param {number} value - values to be written
 */
export default function writeBits(p, bitIndex, bitLength, value) {
  /*
   * Type annotations
   */
  p = p | 0;
  bitIndex = bitIndex | 0;
  bitLength = bitLength | 0;
  
  /*
   * Local variables
   */
  var byteOffset = 0;
  var bitOffset = 0;
  var mask = 0;

  /*
   * Main
   */
  byteOffset = (p + (bitIndex >>> 3)) | 0;
  bitOffset = bitIndex & 0x1f;

  // When we need some bits from the next, mask becomes 0xffffffff, otherwise 0.
  mask = -((bitOffset + bitLength - 1) >>> 5) | 0;
  
  U4[byteOffset >> 2] = U4[byteOffset >> 2] | (value << bitOffset);
  byteOffset = (byteOffset + 4) | 0;
  U4[byteOffset >> 2] = U4[byteOffset >> 2] |
    (mask & (value >>> (32 - bitOffset)));
}