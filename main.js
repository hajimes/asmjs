// UMD pattern
// see https://github.com/umdjs/umd/blob/master/templates/returnExports.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.myAsmjsModule = factory();
  }
}(this, function () {
  'use strict';
  
  function myAsmjsModule(stdlib, foreign, heap) {
    'use asm';

    var abs = stdlib.Math.abs;
    var exp = stdlib.Math.exp;
    var imul = stdlib.Math.imul;
    var log = stdlib.Math.log;
    var max = stdlib.Math.max;
    var sqrt = stdlib.Math.sqrt;
  
    var u8heap = new stdlib.Uint8Array(heap);
    var u16heap = new stdlib.Uint16Array(heap);
    var u32heap = new stdlib.Uint32Array(heap);
    var f32heap = new stdlib.Float32Array(heap);
    
    /********************
     * Math functions
     ********************/
    
    /**
     * Returns the largest number of one or more 32-bit floats.
     * If the specified length is less than 1, the behavior is undefined.
     *
     * @param {number} p - byte offset
     * @param {number} len - length
     * @returns {number} - max value
     */
    function maxFloat32(p, len) {
      // Type annotations
      p = p | 0;
      len = len | 0;
    
      // Local variables
      var end = 0;
      var v = 0.0;
      var result = 0.0;
    
      // Main
      end = (p + (len << 2)) | 0;
      result = +f32heap[p >> 2];
      p = (p + 4) | 0;
    
      for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
        v = +f32heap[p >> 2];

        if (v >= result) {
          result = v;
        }
      }
    
      return +result;
    }
    
    /**
     * Returns the logsumexp of one or more 32-bit floats.
     * If the specified length is less than 1, the behavior is undefined.
     *
     * @param {number} p - byte offset
     * @param {number} len - length
     * @returns {number} - result of logsumexp
     */
    function logsumexp(p, len) {
      // Type annotations
      p = p | 0;
      len = len | 0;

      // Local variables
      var end = 0;
      var v = 0.0;
      var maxValue = 0.0;
      var result = 0.0;

      // Main
      maxValue = +maxFloat32(p, len);
      end = (p + (len << 2)) | 0;
    
      for (; (p | 0) < (end | 0); p = (p + 4) | 0) {
        v = +f32heap[p >> 2];

        // exp(-20) = 2.06e-9, machine epsilon for float32 = 5.96e-08
        if (v - maxValue > -16.0) {
          result = +(result + +exp(v - maxValue));
        }
      }

      return +(maxValue + +log(result));
    }
    
    /********************
     * Util functions
     ********************/
    /**
    * Returns a signed 32-bit hash value by using MurmurHash3_x86_32.
    *
    * Use ">>> 0" to convert its result to an unsigned integer.
    *
    * @param {number} p - byte offset to the start of a byte sequence
    * @param {number} len - length of the specified byte sequence
    * @param {number} seed - unsigned 32-bit integer used as a seed
    * @returns {number} signed 32-bit hash value
    */
    function hash(p, len, seed) {    
      // Type annotations
      p = p | 0;
      len = len | 0;
      seed = seed | 0;

      // Local variables
      var end = 0;
      var i = 0;
      var k1 = 0;
      var k1f = 0.0;
      var h1 = 0;
      var h1f = 0.0;
      var keyLength = 0;
      var tailLength = 0;
      var bodyLength = 0;

      keyLength = len;
      tailLength = keyLength & 3;
      bodyLength = (keyLength - tailLength) | 0;
      h1 = seed >>> 0;

      // body
      end = (p + bodyLength) | 0;
      // console.log(from + ' ' + tailLength + ' ' + end);
      while ((p | 0) < (end | 0)) {
       k1 = u32heap[p >> 2] | 0;
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

      if ((tailLength | 0) == 3) {
       k1 = (k1 ^ (u8heap[(p + 2) >> 0] << 16)) | 0;
      }

      if ((tailLength | 0) >= 2) {
       k1 = (k1 ^ (u8heap[(p + 1) >> 0] << 8)) | 0;
      }

      if ((tailLength | 0) >= 1) {
       k1 = (k1 ^ (u8heap[p >> 0] | 0)) | 0;
      }

      if ((k1 | 0) != 0) {
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
    
    return {
      maxFloat32: maxFloat32,
      logsumexp: logsumexp,
      hash: hash
    };
  }
  
  return myAsmjsModule;
}));