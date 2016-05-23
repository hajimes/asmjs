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
  
    var i32heap = new stdlib.Int32Array(heap);
    var u8heap = new stdlib.Uint8Array(heap);
    var u16heap = new stdlib.Uint16Array(heap);
    var u32heap = new stdlib.Uint32Array(heap);
    var f32heap = new stdlib.Float32Array(heap);
    
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
    * @param {number} p - byte offset
    * @param {number} tableSize - size of table
    * @param {number} maxNumberOfKeys - unsigned 32-bit integer
    *   to specify the maximum number of keys
    */
   function ufmap_create(p, tableSize, maxNumberOfKeys) {
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
     u32heap[(p + 8) >> 2] = tableSize;
     u32heap[(p + 12) >> 2] = 0;
     u32heap[(p + 16) >> 2] = maxNumberOfKeys;
     linkedListP = (32 + tableSize) | 0;
     u32heap[(p + 20) >> 2] = linkedListP;
     u32heap[(p + 24) >> 2] = linkedListP;
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
    * @param {number} p - byte offset
    * @param {number} key - 32-bit unsigned integer
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

     mask = ((u32heap[(p + TBS) >> 2] | 0) - 1) >>> 0;
     u32heap[tmp1P >> 2] = key;
     hashValue = hash(tmp1P, 1, SEED) | 0;

     prevP = (TABLE_START + (hashValue & mask)) | 0;
     nextP = u32heap[(p + prevP) >> 2] | 0;
     
     // while (nextP is not empty and key is not matched)
     while (((nextP | 0) != 0) & ((k >>> 0) != (key >>> 0))) {
       entryP = nextP;
       k = u32heap[(p + entryP) >> 2] | 0;
       prevP = entryP;
       nextP = u32heap[((p + entryP + 8) | 0) >> 2] | 0;
     }
     
     u32heap[(p + TMP2) >> 2] = prevP | 0;

     if ((k | 0) == (key | 0)) {
       // Key matched
       u32heap[tmp1P >> 2] = entryP | 0;
     } else {
       u32heap[tmp1P >> 2] = 0;
     }
   }

   /**
    * @param {number} p - byte offset
    * @param {number} key - 32-bit unsigned integer
    */
   function ufmap_has(p, key) {
     /*
      * Type annotations
      */
     p = p | 0;
     key = key | 0;
     
     /*
      * Local variables
      */
     var TMP1 = 0;
     var TMP2 = 0;
     var matched = 0;

     /*
      * Main
      */
     _ufmap_find(p, key);
     matched = u32heap[(p + TMP1) >> 2] | 0;
     
     if ((matched | 0) != 0) {
       // Key matched
       return 1;
     }
     
     return 0;
   }

   /**
    * Updates the value by the following formula
    * map[key] = coef * map[key] + value
    *
    * @param {number} p - byte offset
    * @param {number} key - 32-bit unsigned integer
    * @param {number} value - 64-bit float
    * @param {number} coef - 64-bit float
    */
   function ufmap_add(p, key, value, coef) {
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
     var matched = 0;
     var freeAbsP = 0; // byte offset for a new entry
     var entryP = 0;
     var prevP = 0;
     var nextP = 0;
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
     entryP = u32heap[(p + TMP1) >> 2] | 0;
     prevP = u32heap[(p + TMP2) >> 2] | 0;

     if ((entryP | 0) != 0) {
       // Key matched
       valueAbsP = (p + entryP + 4) | 0;
       v = +f32heap[valueAbsP >> 2];
       v = coef * v + value;
       f32heap[valueAbsP >> 2] = v;
       return;
     }

     currentSize = u32heap[lenP >> 2] >>> 0;
     maximumNumberOfKeys = u32heap[mnkP >> 2] >>> 0;
     
     if ((currentSize >>> 0) == (maximumNumberOfKeys >>> 0)) {       
       return;
     }

     // Add a new entry
     freeAbsP = (p + (u32heap[frpP >> 2] | 0)) | 0;
     u32heap[(p + prevP) >> 2] = (freeAbsP - p) | 0;
     u32heap[freeAbsP >> 2] = key;
     freeAbsP = (freeAbsP + 4) | 0;
     f32heap[freeAbsP >> 2] = value;
     freeAbsP = (freeAbsP + 4) | 0;
     u32heap[frpP >> 2] = (freeAbsP - p) | 0;

     // increment the number of entries
     u32heap[lenP >> 2]
       = (currentSize + 1) >>> 0;
   }
   
   /**
    * @param {number} p - byte offset
    * @param {number} key - 32-bit unsigned integer
    */
   function ufmap_get(p, key) {
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
     var nextP = 0;
     var k = 0;
     var v = 0.0;

     /*
      * Main
      */
     _ufmap_find(p, key);
     matched = u32heap[(p + TMP1) >> 2] | 0;
     entryP = (p + matched) | 0;
     prevP = (p + (u32heap[(p + TMP2) >> 2] | 0)) | 0;

     if ((matched | 0) != 0) {
       // Key matched
       return +f32heap[(entryP + 4) >> 2];
     }
     
     return 0.0;
   }
   
   /**
    * Returns the number of entries contained in this map.
    *
    * @param {number} p - byte offset
    * @returns {number} - size 
    */
   function ufmap_size(p) {
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
     return u32heap[(p + LEN) >> 2] | 0;
   }
    
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
     /*
      * Type annotations
      */
      p = p | 0;
      len = len | 0;
    
     /*
      * Local variables
      */
      var end = 0;
      var v = 0.0;
      var result = 0.0;
    
     /*
      * Main
      */
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
     /*
      * Type annotations
      */
      p = p | 0;
      len = len | 0;

     /*
      * Local variables
      */
      var end = 0;
      var v = 0.0;
      var maxValue = 0.0;
      var result = 0.0;

     /*
      * Main
      */
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
    * @returns {number} - signed 32-bit hash value
    */
    function hash(p, len, seed) {    
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
      ufmap_create: ufmap_create,
      ufmap_has: ufmap_has,
      ufmap_add: ufmap_add,
      ufmap_get: ufmap_get,
      ufmap_size: ufmap_size,
      maxFloat32: maxFloat32,
      logsumexp: logsumexp,
      hash: hash
    };
  }
  
  return myAsmjsModule;
}));