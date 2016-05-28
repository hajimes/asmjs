/**
 * Returns a signed 32-bit hash value by using MurmurHash3_x86_32.
 *
 * Use ">>> 0" to convert its result to an unsigned integer.
 *
 * @param {int} p - byte offset to the start of a byte sequence
 * @param {int} len - length of the specified byte sequence
 * @param {int} seed - unsigned 32-bit integer used as a seed
 * @returns {signed} - signed 32-bit hash value
 */
export default function MurmurHash3_x86_32(p, len, seed) {    
 /*
  * Type annotations
  */
  p = p | 0;
  len = len | 0;
  seed = seed | 0;

 /*
  * Local variables
  */
  var end = 0;
  var i = 0;
  var k1 = 0;
  var k1f = 0.0;
  var h1 = 0;
  var h1f = 0.0;
  var keyLength = 0;
  var tailLength = 0;
  var bodyLength = 0;

 /*
  * Main
  */
  keyLength = len;
  tailLength = keyLength & 3;
  bodyLength = (keyLength - tailLength) | 0;
  h1 = seed >>> 0;

  // body
  end = (p + bodyLength) | 0;
  // console.log(from + ' ' + tailLength + ' ' + end);
  while ((p | 0) < (end | 0)) {
   k1 = U4[p >> 2] | 0;
   p = (p + 4) | 0;

   k1 = imul(k1, 0xcc9e2d51) >>> 0;

   k1 = (k1 << 15) | (k1 >>> 17);

   k1 = imul(k1, 0x1b873593) >>> 0;

   h1 = (h1 ^ k1) | 0;
   h1 = (h1 << 13) | (h1 >>> 19);

   h1 = imul(h1, 5) >>> 0;
   h1 = (h1 + 0xe6546b64) >>> 0;
  }

  // tail
  k1 = 0;

  switch (tailLength | 0) {
    case 3:
      k1 = (k1 ^ (U1[(p + 2) >> 0] << 16)) | 0;
      // fall through
    case 2:
      k1 = (k1 ^ (U1[(p + 1) >> 0] << 8)) | 0;
      // fall through
    case 1:
      k1 = (k1 ^ (U1[p >> 0] | 0)) | 0;
      k1 = imul(k1, 0xcc9e2d51) >>> 0;

      k1 = (k1 << 15) | (k1 >>> 17);

      k1 = imul(k1, 0x1b873593) >>> 0;

      h1 = (h1 ^ k1) | 0;
  }

  // finalization
  h1 = (h1 ^ keyLength) | 0;
  h1 = (h1 ^ (h1 >>> 16)) | 0;

  h1 = imul(h1, 0x85ebca6b) >>> 0;

  h1 = (h1 ^ (h1 >>> 13)) | 0;

  h1 = imul(h1, 0xc2b2ae35) >>> 0;

  h1 = h1 ^ (h1 >>> 16);    

  return h1 | 0;
}