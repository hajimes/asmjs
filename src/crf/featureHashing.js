import hash from '../util/MurmurHash3_x86_32';

/**
 * Reduce the dimensionality of a sparse vectory by using the unbiased
 * feature hashing algorithm (Weinberger et al., 2009).
 *
 * Exactly (nz * 4) bytes will be written into outValueP,
 * as well as into outIndexP.
 *
 * Note that the resulting sparse vector may repeat the same index.
 * For example, {index: [1, 10, 100], value: [1.0, 2.0, 3.0]} can be hashed
 * to {index: [2, 4, 2], value: [-1.0, 2.0, 3.0]}.
 * Repeated indices are not allowed in several standards such as
 * Sparse BLAS (see Section 3.4.3 of the BLAS Technical Forum standard)
 * but are ok if all you need is dot product, since dotting is
 * distributive (a * (b + c) = a * b + a * c).
 */
export default function featureHashing(nz, valueP, indexP, seed, dimension,
  outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  seed = seed | 0;
  dimension = dimension | 0; // must be a power of 2
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var hashValue = 0;
  var sign = 0.0;
  var value = 0.0;
  var index = 0;
  var mask = 0;

  /*
   * Main
   */
  mask = (dimension - 1) | 0;
  for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
    value = +F4[valueP >> 2];
    hashValue = hash(indexP, 1, seed) | 0;
    sign = +((hashValue >> 31) | 1);
    value = sign * value;
    // console.log(value);
    index = (hashValue & mask) | 0;

    F4[outValueP >> 2] = value;
    U4[outIndexP >> 2] = index;
    
    valueP = (valueP + 4) | 0;
    indexP = (indexP + 4) | 0;
    outValueP = (outValueP + 4) | 0;
    outIndexP = (outIndexP + 4) | 0;
  }
}