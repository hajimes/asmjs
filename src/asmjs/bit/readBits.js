/**
 * Retrieves (bitLength) bits from a heap.
 *
 * <code>p</code> must be a multiple of 4. If this condition is violated,
 * the behavior is undefined.
 *
 * @param {number} p - base index in bytes which must be aligned to 4 bytes
 * @param {number} bitIndex - relative index in bits
 * @param {number} bitLength - length in bits (<= 32)
 * @returns {number} retrieved bits as a signed 32-bit integer (not unsigned)
 */
export default function readBits(p, bitIndex, bitLength) {
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
  var result = 0;
  var bitsCurrent = 0;
  var bitsNext = 0;

  /*
   * Main
   */
  byteOffset = (p + (bitIndex >>> 3)) | 0;
  bitOffset = bitIndex & 0x1f;

  // When we need some bits from the next, mask becomes 0xffffffff, otherwise 0.
  mask = -((bitOffset + bitLength - 1) >>> 5) | 0;

  bitsCurrent = U4[byteOffset >> 2] | 0;
  bitsNext = U4[(byteOffset + 4) >> 2] | 0;

  result = result | (bitsCurrent >>> bitOffset);
  
  // Mask is needed since (a << 32) does not give 0
  result = result | (mask & (bitsNext << (32 - bitOffset)));
 
  return (result & (0xffffffff >>> (32 - bitLength))) | 0;
}