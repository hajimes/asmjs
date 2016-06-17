import popcount from './popcount';
import deBruijnSelect from './deBruijnSelect';

/**
 * Returns the smallest value in an Elias-Fano set which is equal to or more
 * than a given value <code>n</code>.
 *
 * If n is higher than maxValue, this code returns 0xffffffff.
 * (It is ok because in situations where 0xffffffff is a valid value,
 * that is, if maxValue = 0xffffffff, n is never higher than maxValue).
 */
export default function eliasFanoSucc(n, lowerBitsP, higherBitsP, len, maxValue,
    lowerBitsSize, deBruijnTableP) {
  /*
   * Type annotations
   */
  n = n | 0;
  lowerBitsP = lowerBitsP | 0;
  higherBitsP = higherBitsP | 0;
  len = len | 0;
  maxValue = maxValue | 0;
  lowerBitsSize = lowerBitsSize | 0;
  deBruijnTableP = deBruijnTableP | 0;

  /*
   * Local variables
   */
  var bitPosition = 0;
  // var bucketRange = 0;
  var bucketId = 0;
  var itemId = 0;
  var numberOfZeros = 0;
  var previousNumberOfZeros = 0;
  var bitBlock = 0;
  var t = 0;
  var t2 = 0;
  // var bit = 0;
  
  var outP = 0;

  /*
   * Main
   */
  n = n >>> 0;
  
  if ((n | 0) > (maxValue | 0)) {
    return 0xffffffff;
  }
  
  //
  // Step 1: rank0(upperBits)
  // the position of the n-th bucket can be retrived by finding the n-th 0.
  //
  
  // If n is in Elias-Fano, it must be in the (n >> lowerBitsSize)-th bucket
  // where indexing is 0-based.
  // For eaxmple, if lowerBitsSize is 2, then the bucket range is
  // 4 (= 2^lowerBitsSize), and the first bucket represents [0, 4),
  // the second [4, 8), etc. In this case, 0 is in (0 >> 2) = 0-th bucket,
  // 3 is in (3 >> 2) = 0-th bucket, and 4 is in (4 >> 2) = 1st bucket.
  bucketId = n >> lowerBitsSize;
  
  // Since the starting position of a bucket is marked with a 0 in the
  // upper-bits, we can retrieve the position of a bucket by using
  // rank0(bucketId), that is, finding the (bucketId)-th 0.
  // Note that due to 0-based indexing, if bucketId = 4, we need to see 5 zeros.
  // We therefore use <= (rather than <) in the following while loop.
  while ((numberOfZeros | 0) <= (bucketId | 0)) {
    // TODO: speed comparison
    // popcount is generally faster than de Bruijn
    // but in extremely sparse cases de Bruijn might be better
    bitBlock = U4[higherBitsP >> 2] | 0;
    numberOfZeros = (numberOfZeros + (32 - popcount(bitBlock))) | 0;

    previousNumberOfZeros = numberOfZeros;
    bitPosition = (bitPosition + 8) | 0;
    higherBitsP = (higherBitsP + 4) | 0;
  }
  // unread one bit block
  bitPosition = (bitPosition - 8); // ?
  numberOfZeros = previousNumberOfZeros;

  // re-read the block by using de Bruijn
  t = deBruijnSelect(deBruijnTableP, bitBlock, outP);
  // the t2-th 0 in the bit block is our target ("t2-th" is also 0-based)
  t2 = (bucketId - numberOfZeros) | 0;
  t = U4[(outP + t2) | 0]; // now t contains the inner bit index
  bitPosition = (bitPosition + t) | 0;
  
  // There are (bucketId + 1) 0s in the first (bitPosition + 1) bits,
  // indicating that (bitPosition - bucketId) 1s so far. So the next 1
  // represents (bitPosition - bucketId)-th item (0-based) in the set.
  itemId = (bitPosition - bucketId) | 0;
  // if ((n | 0) == (maxValue | 0)) {
  //   // TODO: implement here
  // }

  //
  // Step 2:
  // Search n in the block. There are three possible patterns;
  // 1. if n is in the block, the algorithm returns n
  // 2. if n is not in the block, but if there are some values higher than n
  //   in the block, it return the smallest value of those values.
  // 3. if 1 or 2 is not satisfied, it finds the first 1 in the upper bits after
  //   the point and reconstructs the smallest v such that n <= v.
  //
  
  // Note that since we have already treated the case (n >= maxValue) so far,
  // there is at least one 1 after the position we retrieved.
  // while (found) {
  //   bit = (bitBlock >>> t) & 1;
  //   bitPosition = (bitPosition + 1) | 0;
  // }
  // if ((t | 0) == 31) {
  // } else {
  //   bit = (bitBlock >>> t);
  //   if (bit) {
  //   }
  // }
  
  
  
}

// function getBitsFromLowerBits(lowerBitsP, lowerBitsSize, index) {
//   /*
//    * Type annotations
//    */
//   lowerBitsP = lowerBitsP | 0;
//   lowerBItsSize = lowerBItsSize | 0;
//   index = index | 0;
//
//   /*
//    * Local variables
//    */
//   var byteOffset = 0;
//   var bitOffsetInUint32 = 0;
//   var bitBlock = 0;
//
//   /*
//    * Main
//    */
//   byteOffset = index >> 3;
//   bitOffsetInUint32 = index & 0x1f;
//   bitBlock = U4[byteOffset >> 2] | 0;
//   U4[byteOffset >> 2] = U4[byteOffset >> 2] | (v << bitOffset);
//
//   byteOffset = bitIndex >>> 5;
//   bitOffset = bitIndex & 0x1f;
//   crossing = (bitOffset + bitLength - 1) >>> 5;
//   U4[byteOffset >> 2] = U4[byteOffset >> 2] | (v << bitOffset);
//   U4[(byteOffset + 4) >> 2] = U4[(byteOffset + 4) >> 2]
//     | (v << bitOffset);
//
//
// }