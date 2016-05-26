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
    
    var I1 = new stdlib.Int8Array(heap);
    var I2 = new stdlib.Int16Array(heap);
    var I4 = new stdlib.Int32Array(heap);
    var U1 = new stdlib.Uint8Array(heap);
    var U2 = new stdlib.Uint16Array(heap);
    var U4 = new stdlib.Uint32Array(heap);
    var F4 = new stdlib.Float32Array(heap);
    var F8 = new stdlib.Float64Array(heap);
    
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

      switch (tailLength | 0) {
        case 3:
          k1 = (k1 ^ (u8heap[(p + 2) >> 0] << 16)) | 0;
          // fall through
        case 2:
          k1 = (k1 ^ (u8heap[(p + 1) >> 0] << 8)) | 0;
          // fall through
        case 1:
          k1 = (k1 ^ (u8heap[p >> 0] | 0)) | 0;
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
    
    
    /**
     * @parma {number} b - first byte of a utf-8 sequence
     * @returns {number} - number of trailing bytes for the sequence
     */
    function uc_trailingBytesForUtf8(b) {
      /*
       * Type annotations
       */
      b = b | 0;
      
      /*
       * Main
       */   
      b = b & 0xff;
      if ((b | 0) < 192) {
        return 0;
      } else if ((b | 0) < 224) {
        return 1;
      } else if ((b | 0) < 240) {
        return 2;
      } else if ((b | 0) < 248){
        return 3;
      }
      
      
      // invalid
      return 0xff;
    }
    
    /**
     * Based on ConvertUTF.c by Unicode, Inc.
     * Endian dependent.
     *
     * @param {number} inPP - byte offset to a byte offset to uint16s
     * @param {number} inEnd - byte offset to the end of inputs
     * @param {number} outPP - byte offset to a byte offset to uint8s
     * @param {number} outEnd - byte offset to the end of outputs
     * @returns {number} - error code
     */
    function uc_convertUtf16toUtf8(inPP, inEnd, outPP, outEnd) {
      /*
       * Type annotations
       */
      inPP = inPP | 0;
      inEnd = inEnd | 0;
      outPP = outPP | 0;
      outEnd = outEnd | 0;
      
      /*
       * Local variables
       */
      var SUR_HIGH_START = 0xd800;
      var SUR_HIGH_END = 0xdbff;
      var SUR_LOW_START = 0xdc00;
      var SUR_LOW_END = 0xdfff;
      var HALF_SHIFT = 10;
      var HALF_BASE = 0x0010000;
      var HALF_MASK = 0x3ff;
      var BYTE_MASK = 0xBF;
      var BYTE_MARK = 0x80;
      var ERROR_SOURCE_EXHAUSTED = 1;
      var ERROR_TARGET_EXHAUSTED = 2;
      var ERROR_SOURCE_ILLEGAL = 3;
      var ch = 0;
      var ch2 = 0;
      var bytesToWrite = 0;
      var inP = 0;
      var outP = 0;
      var firstByteMask = 0;
      
      /*
       * Main
       */
      inP = u32heap[inPP >> 2] | 0;
      outP = u32heap[outPP >> 2] | 0;      
      while ((inP | 0) < (inEnd | 0)) {
        ch = u16heap[inP >> 1] | 0;
        inP = (inP + 2) | 0;
        
        // check if ch is a high surrogate
        if (((ch | 0) >= (SUR_HIGH_START | 0)) &
              ((ch | 0) <= (SUR_HIGH_END | 0))) {
          if ((inP | 0) < (inEnd | 0)) {
            ch2 = u16heap[inP >> 1] | 0;
            
            // check if ch2 is a low surrogate
            if (((ch2 | 0) >= (SUR_LOW_START | 0)) &
                ((ch2 | 0) <= (SUR_LOW_END | 0))) {
              ch = (((ch - SUR_HIGH_START) << HALF_SHIFT) +
                ((ch2 - SUR_LOW_START) + HALF_BASE)) | 0;
              inP = (inP + 2) | 0;
            }
          } else {
            // Input utf-16 string is ill-formed.
            inP = (inP - 2) | 0;
            return ERROR_SOURCE_ILLEGAL | 0;
          }
          
          u8heap[outP >> 0] = ch;
        } // end if surroge
        
        // How many bytes will the result require?
        if ((ch | 0) < 0x80) {
          bytesToWrite = 1;
        } else if ((ch | 0) < 0x800) {
          bytesToWrite = 2;
        } else if ((ch | 0) < 0x10000) {
          bytesToWrite = 3;
        } else if ((ch | 0) < 0x110000) {
          bytesToWrite = 4;
        } else {
          bytesToWrite = 3;
          ch = 0xffffffff;
        }
        
        // Write bytes
        outP = (outP + bytesToWrite) | 0;
        if ((outP | 0) > (outEnd | 0)) {
          return ERROR_TARGET_EXHAUSTED | 0;
        }
        
        switch (bytesToWrite | 0) {
          case 4:
            outP = (outP - 1) | 0;
            u8heap[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
            ch = ch >> 6;
            // fall through
          case 3:
            outP = (outP - 1) | 0;
            u8heap[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
            ch = ch >> 6;
            // fall through
          case 2:
            outP = (outP - 1) | 0;
            u8heap[outP >> 0] = (ch | BYTE_MARK) & BYTE_MASK;
            ch = ch >> 6;
            // fall through
          case 1:
            outP = (outP - 1) | 0;
            if ((bytesToWrite | 0) == 1){
              firstByteMask = 0;
            } else if ((bytesToWrite | 0) == 2) {
              firstByteMask = 0xc0;
            } else if ((bytesToWrite | 0) == 3) {
              firstByteMask = 0xe0;              
            } else {
              firstByteMask = 0xf0;
            }

            u8heap[outP >> 0] = (ch | firstByteMask);
        } // end switch
        outP = (outP + bytesToWrite) | 0;
      } // end while
      
      u32heap[inPP >> 2] = inP | 0;
      u32heap[outPP >> 2] = outP | 0;
      
      return 0;
    }
    
    /**
     * Based on ConvertUTF.c by Unicode, Inc.
     * Endian dependent.
     *
     * @param {number} inPP - byte offset to a byte offset to uint16s
     * @param {number} inEnd - byte offset to the end of inputs
     * @param {number} outPP - byte offset to a byte offset to uint8s
     * @param {number} outEnd - byte offset to the end of outputs
     * @returns {number} - error code
     */
    function uc_convertUtf8toUtf16(inPP, inEnd, outPP, outEnd) {
      /*
       * Type annotations
       */
      inPP = inPP | 0;
      inEnd = inEnd | 0;
      outPP = outPP | 0;
      outEnd = outEnd | 0;
      
      /*
       * Local variables
       */
      var SUR_HIGH_START = 0xd800;
      var SUR_LOW_START = 0xdc00;
      var SUR_LOW_END = 0xdfff;
      var HALF_SHIFT = 10;
      var HALF_BASE = 0x0010000;
      var HALF_MASK = 0x3ff;
      var ERROR_SOURCE_EXHAUSTED = 1;
      var ERROR_TARGET_EXHAUSTED = 2;
      var ERROR_SOURCE_ILLEGAL = 3;
      var result = 0;
      var ch = 0;
      var v = 0;
      var inP = 0;
      var outP = 0;
      var extraBytesToRead = 0;
      
      /*
       * Main
       */
      inP = u32heap[inPP >> 2] | 0;
      outP = u32heap[outPP >> 2] | 0;  
      while ((inP | 0) < (inEnd | 0)) {
        ch = 0;
        v = u8heap[inP >> 0] | 0;
        extraBytesToRead = uc_trailingBytesForUtf8(v) | 0;
        if ((extraBytesToRead | 0) >= ((inEnd - inP) | 0)) {
          result = ERROR_SOURCE_EXHAUSTED | 0;
          break;
        }
        
        // if (!isLegalUtf8)
                
        switch (extraBytesToRead | 0) {
          case 3:
            v = u8heap[inP >> 0] | 0;
            ch = (ch + v) | 0;
            inP = (inP + 1) | 0;
            ch = ch << 6;
            // fall through
          case 2:
            v = u8heap[inP >> 0] | 0;
            ch = (ch + v) | 0;
            inP = (inP + 1) | 0;
            ch = ch << 6;
            // fall through
          case 1:
            v = u8heap[inP >> 0] | 0;
            ch = (ch + v) | 0;
            inP = (inP + 1) | 0;
            ch = ch << 6;
            // fall through
          case 0:
            v = u8heap[inP >> 0] | 0;
            ch = (ch + v) | 0;
            inP = (inP + 1) | 0;
        }
        
        switch (extraBytesToRead | 0) {
          case 3:
            ch = (ch - 0x3c82080) | 0;
            break;
          case 2:
            ch = (ch - 0xe2080) | 0;
            break;
          case 1:
            ch = (ch - 0x3080) | 0;
            break;
        }

        if ((outP | 0) >= (outEnd | 0)) {
          inP = (inP - extraBytesToRead + 1) | 0;
          result = ERROR_TARGET_EXHAUSTED;
          break;
        }
        
        if ((ch | 0) <= 0xffff) {
          // if BMP
          if (((ch | 0) >= (SUR_HIGH_START | 0)) &
            ((ch | 0) <= (SUR_LOW_END | 0))) {
            inP = (inP - extraBytesToRead + 1) | 0;
            result = ERROR_SOURCE_ILLEGAL = 3;
            break;
          } else {
            u16heap[outP >> 1] = ch | 0;
            outP = (outP + 2) | 0;
          }
        } else if ((ch | 0) > 0x10ffff) {
          // if outside Unicode
          result = ERROR_SOURCE_ILLEGAL | 0;
          inP = (inP - extraBytesToRead + 1) | 0;
          break;
        } else {
          // if non-BMP
          if ((outP | 0) >= (outEnd | 0)) {
            inP = (inP - extraBytesToRead + 1) | 0;
            result = ERROR_TARGET_EXHAUSTED;
            break;
          }
          ch = (ch - HALF_BASE) | 0;
          u16heap[outP >> 1] = ((ch >> HALF_SHIFT) + SUR_HIGH_START) | 0;
          outP = (outP + 2) | 0;
          u16heap[outP >> 1] = ((ch & HALF_MASK) + SUR_LOW_START) | 0;
        }
        
      } // end while
      
      u32heap[inPP >> 2] = inP | 0;
      u32heap[outPP >> 2] = outP | 0;
      
      return result | 0;
    }
    
    /**
     * Check if the current environment is little-endian or not.
     *
     * @returns {number} - 1 if little-endian otherwise 0
     */
    function isLittleEndian() {
      /*
       * Type annotations
       */
      var c = 0;
      var result = 0;
      
      /*
       * Main
       */
      c = u16heap[0 >> 1] | 0;
      u8heap[0 >> 0] = 0;
      u8heap[1 >> 0] = 1;
      result = u16heap[0 >> 1] >>> 8;
      u16heap[0 >> 1] = c | 0;
      
      return result | 0;
    }
    
    
    /********************
     * Vector functions
     ********************/
    /**
     * Returns the dot product between a sparse vector x and a dense vector y.
     * Unlike the original Sparse BLAS, repeated indices in x are allowed.
     */
    function vec_susdot(nz, xP, indexP, yP, outP) {
      /*
       * Type annotations
       */
      nz = nz | 0;
      xP = xP | 0;
      indexP = indexP | 0;
      yP = yP | 0;
      outP = outP | 0;
     
      /*
       * Local variables
       */
      var result = 0.0;
      var end = 0;
      var index = 0;
      var value = 0.0;

      /*
       * Main
       */
      end = (indexP + (nz << 2)) | 0;
      while ((indexP | 0) < (end | 0)) {
        index = u32heap[indexP >> 2] | 0;
        value = +f32heap[xP >> 2];
        
        result = +(result + value * +f32heap[(yP + (index << 2)) >> 2]);
        
        indexP = (indexP + 4) | 0;
        xP = (xP + 4) | 0;
      }
      
      f32heap[outP >> 2] = result;
    }
    
    /********************
     * CRF and machine learning-related functions
     ********************/
    /**
     * Each instance is structured as
     *
     * +---+---+=====+========+=========+
     * |IID|FTM| NZS | VALUES | INDICES |
     * +---+---+=====+========+=========+
     *
     * IID: instance id
     * FTM: uint32, the time of the final state of a markov path
     * NZS: uint32[FTM]
     * VALUES: float32[FTM][NZS[i]] for i in [0, FTM)
     * VALUES: uint32[FTM][NZS[i]] for i in [0, FTM)
     */
    /**
     * Reduce the dimensionality of a sparse vectory by using the unbiased
     * feature hashing algorithm (Weinberger et al., 2009).
     *
     * Note that the resulting sparse vector may repeat the same index.
     * For example, {index: [1, 10, 100], value: [1.0, 2.0, 3.0]} can be hashed
     * to {index: [2, 4, 2], value: [-1.0, 2.0, 3.0]}.
     * Repeated indices are not allowed in several standards such as
     * Sparse BLAS (see Section 3.4.3 of the BLAS Technical Forum standard)
     * but are ok if all you need is dot product, since dotting is
     * distributive (a * (b + c) = a * b + a * c).
     */
    function crf_featureHashing(nz, valueP, indexP, seed, mask,
      outValueP, outIndexP) {
      /*
       * Type annotations
       */
      nz = nz | 0;
      valueP = valueP | 0;
      indexP = indexP | 0;
      seed = seed | 0;
      mask = mask | 0;
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

      /*
       * Main
       */
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
        
    /**
     * Updates a sequence of state scores.
     *
     * A sequence of state scores is a 2-dimensional array
     * float[finalTime][numberOfStates].
     * score[i][j] represents the state score where the current time is i and
     * the current state is j.
     *
     * @param {number} nz - 
     * @param {number} weightP - byte offset to a dense weight vector
     * @param {number} freeP - byte offset to a free working space
     */
    function crf_updateStateScores(instanceP, weightP, numberOfStates,
      freeP, outP) {
      /*
       * Type annotations
       */
      instanceP = instanceP | 0;
      weightP = weightP | 0;
      numberOfStates = numberOfStates | 0;
      freeP = freeP | 0;
      outP = outP | 0;
      
      /*
       * Local variables
       */
      var i = 0;
      var p = 0;
      var end = 0;
      var valueP = 0;
      var indexP = 0;
      var nzP = 0;
      var nz = 0;
      var finalTime = 0;
      
      finalTime = U4[(instanceP + 4) >> 2] | 0;
      nzP = (instanceP + 8) | 0;
      end = (nzP + finalTime << 2) | 0;
      
      /*
       * Main
       */
      while ((nzP | 0) < (end | 0)) {
        nz = U4[nzP >> 2] | 0;
        // vec_featureHashing();
        for (i = 0; (i | 0) < (numberOfStates | 0); i = (i + 1) | 0) {
          valueP = freeP | 0;
          indexP = (freeP + (nz << 2)) | 0;
          vec_susdot(nz, valueP, indexP, weightP, outP);
        }
        nzP = (nzP + 4) | 0;
        outP = (outP + 4) | 0;
      }
      
      // var p = 0;
      // var end = 0;
      //
      // time = stateFeaturesP;
      // end = (time + (n << 2)) | 0;
      //
      // for (time = 0; (time | 0) < (end | 0); time = (time + 1) | 0) {
      //   p = u32heap[time >> 2];
      //
      //   CRF_hashing_dot(weightP, p, numberOfStates);
      //   vec_susdot
      //
      //   scoresP = (scoresP + 12) | 0;
      // }
    }
    
    return {
      ufmap_create: ufmap_create,
      ufmap_has: ufmap_has,
      ufmap_add: ufmap_add,
      ufmap_get: ufmap_get,
      ufmap_size: ufmap_size,
      maxFloat32: maxFloat32,
      logsumexp: logsumexp,
      vec_susdot: vec_susdot,
      crf_featureHashing: crf_featureHashing,
      uc_convertUtf16toUtf8: uc_convertUtf16toUtf8,
      uc_convertUtf8toUtf16: uc_convertUtf8toUtf16,
      hash: hash,
      isLittleEndian: isLittleEndian
    };
  }
  
  return myAsmjsModule;
}));