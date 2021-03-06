describe('This handwritten asm.js module', function() {
  'use strict';

  var chai = {};
  var expect = {};
  var _ = {};

  var myAsmjsModule = {};

  var exp = Math.exp;
  var log = Math.log;

  var heap = {};
  var I4 = {};
  var U1 = {};
  var U2 = {};
  var U4 = {};
  var F4 = {};
  var mod = {};
  var root = {};
  
  function putUint32(u4, p, uint32s) {
    var i = 0;
    
    for (i = 0; i < uint32s.length; i += 1) {
      u4[(p + (i << 2)) >> 2] = uint32s[i] >>> 0;
    }
  }

  function putInt32(i4, p, int32s) {
    var i = 0;
    
    for (i = 0; i < int32s.length; i += 1) {
      i4[(p + (i << 2)) >> 2] = int32s[i] | 0;
    }
  }
  
  function putFloat(f4, p, floats) {
    var i = 0;
    
    for (i = 0; i < floats.length; i += 1) {
      f4[(p + (i << 2)) >> 2] = +floats[i];
    }
  }
  
  function getASCII(U1, pos, len) {
    var i = 0;
    var str = [];
    
    for (i = 0; i < len; i += 1) {
      str.push(U1[pos + i]);
    }
    
    return String.fromCharCode.apply(null, str);
  }
  
  function setASCII(U1, pos, str) {
    var i = 0;
    
    for (i = 0; i < str.length; i += 1) {
      U1[pos + i] = (str.charCodeAt(i) & 0xff);
    }
  }
  
  // Endian dependent
  function putUtf16(str, U2, pos) {
    var i = 0;
    var ch = 0;
    
    for (i = 0; i < str.length; i += 1) {
      ch = str.charCodeAt(i);
      U2[pos >> 1] = ch;
      pos += 2;
    }
  }
  
  if (typeof window === 'undefined') {
    root = global;
    chai = require('chai');
    _ = require('lodash');
    myAsmjsModule = require('../main');
  } else {
    root = window;
    chai = window.chai;
    _ = window._;
    myAsmjsModule = window.myAsmjsModule;
  }
  expect = chai.expect;  
  
  beforeEach(function() {      
    heap = new ArrayBuffer(1 << 20);
    I4 = new Int32Array(heap);
    U1 = new Uint8Array(heap);
    U2 = new Uint16Array(heap);
    U4 = new Uint32Array(heap);
    F4 = new Float32Array(heap);
    mod = myAsmjsModule(root, {}, heap);
  });
  
  afterEach(function() {
    heap = null;
  })

  describe('implements efficient bitwise operations such as', function() {
    it('Elias-Fano for rank-select on sparse bitsets', function() {
      var deBruijnTableP = 0;
      var p = 1000;
      var outP = 10000;
      var tmpP = 20000;
      var lowerBitsSize = 0;
      var lowerBitsP = 0;
      var higherBitsP = 0;
      var seq = [];
      
      mod.bit_deBruijnSelectInit(deBruijnTableP);

      seq = [0, 10, 42, 50];
      putUint32(U4, p, seq);
      mod.bit_eliasFano(p, seq.length, deBruijnTableP, outP);
      expect(U4[outP >> 2]).to.equal(seq.length);
      expect(U4[(outP + 4) >> 2]).to.equal(51);
      lowerBitsSize = 4; // Math.ceil(Math.log2(51 / 4))
      expect(U4[(outP + 8) >> 2]).to.equal(lowerBitsSize);
      expect(U4[(outP + 12) >> 2]).to.equal(0);
      lowerBitsP = outP + 16;
      expect(mod.bit_readBits(lowerBitsP, 0, lowerBitsSize)).to.equal(0);
      expect(mod.bit_readBits(lowerBitsP, 4, lowerBitsSize)).to.equal(10);
      expect(mod.bit_readBits(lowerBitsP, 8, lowerBitsSize)).to.equal(10);
      expect(mod.bit_readBits(lowerBitsP, 12, lowerBitsSize)).to.equal(2);
      higherBitsP = lowerBitsP + 4;
      expect(mod.bit_readBits(higherBitsP, 0, 3)).to.equal(6); // LSB 011 MSB
      expect(mod.bit_readBits(higherBitsP, 3, 3)).to.equal(4); // LSB 001 MSB
      expect(mod.bit_readBits(higherBitsP, 6, 2)).to.equal(2); // LSB 01 MSB
      
      expect(mod.bit_eliasFanoSucc(0, outP, deBruijnTableP, tmpP)).to.equal(0);
      expect(mod.bit_eliasFanoSucc(1, outP, deBruijnTableP, tmpP)).to.equal(10);
      expect(mod.bit_eliasFanoSucc(9, outP, deBruijnTableP, tmpP)).to.equal(10);
      expect(mod.bit_eliasFanoSucc(10, outP, deBruijnTableP, tmpP))
        .to.equal(10);
      expect(mod.bit_eliasFanoSucc(11, outP, deBruijnTableP, tmpP))
        .to.equal(42);
      expect(mod.bit_eliasFanoSucc(42, outP, deBruijnTableP, tmpP))
        .to.equal(42);
      expect(mod.bit_eliasFanoSucc(43, outP, deBruijnTableP, tmpP))
        .to.equal(50);
      expect(mod.bit_eliasFanoSucc(50, outP, deBruijnTableP, tmpP))
        .to.equal(50);

      expect(mod.bit_eliasFanoSucc(51, outP, deBruijnTableP, tmpP))
        .to.equal(0xffffffff | 0);

      // The real usage is 22 bytes but its space must be aligned to 4 bytes
      expect(mod.bit_eliasFanoByteSize(50, seq.length, deBruijnTableP, tmpP))
        .to.equal(24);

      seq = [0, 10, 42, 50, 12933, 192839, 7818723];
      p = 3000;
      outP = 40000;
      tmpP = 50000;
      putUint32(U4, p, seq);
      mod.bit_eliasFano(p, seq.length, deBruijnTableP, outP);
      expect(mod.bit_eliasFanoSucc(76888, outP, deBruijnTableP, tmpP))
        .to.equal(192839);
      expect(mod.bit_eliasFanoSucc(192839, outP, deBruijnTableP, tmpP))
        .to.equal(192839);
    });
    
    it('popcount to count the number of bits in a 32-bit integer', function () {
      expect(mod.bit_popcount(0)).to.equal(0);
      expect(mod.bit_popcount(7)).to.equal(3);
      expect(mod.bit_popcount(0x80000000)).to.equal(1);
      expect(mod.bit_popcount(0x80000001)).to.equal(2);
      expect(mod.bit_popcount(0x80000080)).to.equal(2);
      expect(mod.bit_popcount(0xaaaaaaaa)).to.equal(16);
      expect(mod.bit_popcount(0xfffeffff)).to.equal(31);
      expect(mod.bit_popcount(0xffffffff)).to.equal(32);
      expect(mod.bit_popcount(-1)).to.equal(32);
      expect(mod.bit_popcount(-2147483648)).to.equal(1);
    });
    
    it('bitwise select with a naive method', function() {
      var i = 0;
      var isResultValid = true;
      var p = 1000;
      var outP = 2000;
      var numberOfOnes = 0;

      numberOfOnes = mod.bit_select(1, outP);
      expect(numberOfOnes).to.equal(1);
      expect(U1[outP]).to.equal(0);

      numberOfOnes = mod.bit_select(2, outP);
      expect(numberOfOnes).to.equal(1);
      expect(U1[outP]).to.equal(1);
      
      numberOfOnes = mod.bit_select(0x80003001, outP);
      expect(numberOfOnes).to.equal(4);
      expect(U1[outP]).to.equal(0);
      expect(U1[outP + 1]).to.equal(12);
      expect(U1[outP + 2]).to.equal(13);
      expect(U1[outP + 3]).to.equal(31);
  
      numberOfOnes = mod.bit_select(0xffffffff, outP);
      expect(numberOfOnes).to.equal(32);
      isResultValid = true;
      for (i = 0; i < 32; i += 1) {
        isResultValid = isResultValid && (U1[outP + i] === i);
      }
      expect(isResultValid).to.be.true;
    });
    
    it('fast bitwise select with a de Bruijn sequence', function() {
      var i = 0;
      var isTableValid = true;
      var isResultValid = true;
      var p = 1000;
      var outP = 2000;
      var numberOfOnes = 0;
      var deBruijn32Table = [
        0, 1, 28, 2, 29, 14, 24, 3,
        30, 22, 20, 15, 25, 17, 4, 8,
        31, 27, 13, 23, 21, 19, 16, 7,
        26, 12, 18, 6, 11, 5, 10, 9
      ];
      
      U1[p + 32] = 255;
      
      mod.bit_deBruijnSelectInit(p);
      
      isTableValid = true;
      for (i = 0; i < 32; i += 1) {
        isTableValid = isTableValid && (U1[p + i] === deBruijn32Table[i]);
      }
 
      expect(isTableValid).to.be.true;
      expect(U1[p + 32]).to.equal(255); // this area should remain untouched
      
      numberOfOnes = mod.bit_deBruijnSelect(p, 1, outP);
      expect(numberOfOnes).to.equal(1);
      expect(U1[outP]).to.equal(0);

      numberOfOnes = mod.bit_deBruijnSelect(p, 2, outP);
      expect(numberOfOnes).to.equal(1);
      expect(U1[outP]).to.equal(1);
      
      numberOfOnes = mod.bit_deBruijnSelect(p, 0x80003001, outP);
      expect(numberOfOnes).to.equal(4);
      expect(U1[outP]).to.equal(0);
      expect(U1[outP + 1]).to.equal(12);
      expect(U1[outP + 2]).to.equal(13);
      expect(U1[outP + 3]).to.equal(31);
  
      numberOfOnes = mod.bit_deBruijnSelect(p, 0xffffffff, outP);
      expect(numberOfOnes).to.equal(32);
      isResultValid = true;
      for (i = 0; i < 32; i += 1) {
        isResultValid = isResultValid && (U1[outP + i] === i);
      }
      expect(isResultValid).to.be.true;
    });
    
    it('fast bitwise select with a de Bruijn seq (w/o table)', function() {
      var i = 0;
      var isResultValid = true;
      var p = 1000;
      var outP = 2000;
      var numberOfOnes = 0;

      numberOfOnes = mod.bit_deBruijnSelectNoTable(1, outP);
      expect(numberOfOnes).to.equal(1);
      expect(U1[outP]).to.equal(0);

      numberOfOnes = mod.bit_deBruijnSelectNoTable(2, outP);
      expect(numberOfOnes).to.equal(1);
      expect(U1[outP]).to.equal(1);
      
      numberOfOnes = mod.bit_deBruijnSelectNoTable(0x80003001, outP);
      expect(numberOfOnes).to.equal(4);
      expect(U1[outP]).to.equal(0);
      expect(U1[outP + 1]).to.equal(12);
      expect(U1[outP + 2]).to.equal(13);
      expect(U1[outP + 3]).to.equal(31);
  
      numberOfOnes = mod.bit_deBruijnSelectNoTable(0xffffffff, outP);
      expect(numberOfOnes).to.equal(32);
      isResultValid = true;
      for (i = 0; i < 32; i += 1) {
        isResultValid = isResultValid && (U1[outP + i] === i);
      }
      expect(isResultValid).to.be.true;
    });
    
    it('fast operation for finding the next highest power of 2', function() {
      expect(mod.bit_nextPow2(1)).to.equal(1);
      expect(mod.bit_nextPow2(2)).to.equal(2);
      expect(mod.bit_nextPow2(4)).to.equal(4);
      expect(mod.bit_nextPow2(1 << 30)).to.equal(1 << 30);

      expect(mod.bit_nextPow2(3)).to.equal(4);
      expect(mod.bit_nextPow2(5)).to.equal(8);
      expect(mod.bit_nextPow2((1 << 29) + 1)).to.equal(1 << 30);

      // results are signed
      expect(mod.bit_nextPow2((1 << 30) + 1)).
        to.equal((1 << 31) | 0);
      expect(mod.bit_nextPow2((1 << 31) >>> 0)).
        to.equal((1 << 31) | 0);
      
      // returns 0 for invalid inputs
      expect(mod.bit_nextPow2(0)).to.equal(0);
      expect(mod.bit_nextPow2(((1 << 31) >>> 0) + 1)).to.equal(0);
      expect(mod.bit_nextPow2(0xffffffff)).to.equal(0);
      expect(mod.bit_nextPow2(-1)).to.equal(0);
    });
    
    it('read n bits (n in [0, 32]) from an arbitrary bit position', function() {
      // Currently this test assumes little-endian environments.
      // In big-endian machines, it will fail.
      // It also assumes 0b... of ES6 is implemented in the browser
      var p = 1000;
      var a = [];

      a = [
        0b11100000000000000000000000101000,
        0b10000000000000000000000000000101, 
      ];

      putUint32(U4, p, a);

      expect(mod.bit_readBits(p, 0, 4) >>> 0).to.equal(0b1000);
      expect(mod.bit_readBits(p, 1, 4) >>> 0).to.equal(0b0100);
      expect(mod.bit_readBits(p, 2, 4) >>> 0).to.equal(0b1010);
      expect(mod.bit_readBits(p, 3, 4) >>> 0).to.equal(0b0101);
      expect(mod.bit_readBits(p, 28, 2) >>> 0).to.equal(0b10);
      expect(mod.bit_readBits(p, 31, 2) >>> 0).to.equal(0b11);
      expect(mod.bit_readBits(p, 28, 8) >>> 0).to.equal(0b1011110);
      expect(mod.bit_readBits(p, 32, 8) >>> 0).to.equal(0b101);
      expect(mod.bit_readBits(p, 62, 8) >>> 0).to.equal(0b10);
      expect(mod.bit_readBits(p, 63, 8) >>> 0).to.equal(0b1);
      expect(mod.bit_readBits(p, 64, 8) >>> 0).to.equal(0);
      expect(mod.bit_readBits(p, 0, 31) >>> 0)
        .to.equal(0b1100000000000000000000000101000);
      expect(mod.bit_readBits(p, 0, 32) >>> 0)
        .to.equal(0b11100000000000000000000000101000);
      expect(mod.bit_readBits(p, 1, 32) >>> 0)
        .to.equal(0b11110000000000000000000000010100);
    });
    
    it('write n bits (n in [0, 32]) to an arbitrary bit position', () =>  {
      mod.bit_writeBits(1000, 0, 4, 3);
      expect(mod.bit_readBits(1000, 0, 4)).to.equal(3);

      mod.bit_writeBits(2000, 4, 4, 3);
      expect(mod.bit_readBits(2000, 4, 4)).to.equal(3);

      mod.bit_writeBits(3000, 31, 2, 3);
      expect(mod.bit_readBits(3000, 31, 2)).to.equal(3);

      mod.bit_writeBits(4000, 30, 4, 9);
      expect(mod.bit_readBits(4000, 0, 32))
        .to.equal(0b01000000000000000000000000000000);
      expect(mod.bit_readBits(4000, 30, 4)).to.equal(9);
    });
  });

  describe('implements ufmap', function() {
    it('a hash map for uint32 keys and float32 values', function() {
      var p = 100;
      var tableSize = 1 << 16;
      var maxNumberOfKeys = 1000;

      mod.ufmap_create(p, tableSize, maxNumberOfKeys);
      expect(mod.ufmap_size(p)).to.equal(0);
      mod.ufmap_add(p, 50, 3.0, 1.0);

      expect(mod.ufmap_size(p)).to.equal(1);
      expect(mod.ufmap_has(p, 50)).to.equal(1);
      mod.ufmap_add(p, 58, 3.5, 1.0);
      
      expect(mod.ufmap_size(p)).to.equal(2);
      expect(mod.ufmap_get(p, 50)).to.closeTo(3.0, 0.000001);
      expect(mod.ufmap_get(p, 58)).to.closeTo(3.5, 0.000001);

      mod.ufmap_add(p, 50, 3.0, 1.0);
      expect(mod.ufmap_get(p, 50)).to.closeTo(6.0, 0.000001);
    });

    it('that ignores new entry addition if its limit is reached', function() {
      var i = 0;
      var p = 10000;
      var tableSize = 1 << 16;
      var maxNumberOfKeys = 10;

      mod.ufmap_create(p, tableSize, maxNumberOfKeys);
      
      for (i = 0; i < 10; i += 1) {
        mod.ufmap_add(p, i, 1.0, 1.0);
      }
      
      expect(mod.ufmap_size(p)).to.equal(10);
      mod.ufmap_add(p, 10, 1.0, 1.0);
      expect(mod.ufmap_size(p)).to.equal(10);
    });
  });
  
  describe('has math functions to compute', function() {
    it('the maximum value in float32s', function() {
      F4[25] = -3.0;
      F4[26] = 1.0;
      F4[27] = 3.0;
      
      expect(mod.maxFloat32(25 << 2, 1)).to.closeTo(-3.0, 0.000001);
      expect(mod.maxFloat32(25 << 2, 2)).to.closeTo(1.0, 0.000001);
      expect(mod.maxFloat32(25 << 2, 3)).to.closeTo(3.0, 0.000001);
    });
    
    it('the sum of float32s', function() {
      putFloat(F4, 100, [-3.0, 1.0, 3.0]);
      
      expect(mod.sumFloat32(25 << 2, -1)).to.closeTo(0.0, 0.000001);
      expect(mod.sumFloat32(25 << 2, 0)).to.closeTo(0.0, 0.000001);
      expect(mod.sumFloat32(25 << 2, 1)).to.closeTo(-3.0, 0.000001);
      expect(mod.sumFloat32(25 << 2, 2)).to.closeTo(-2.0, 0.000001);
      expect(mod.sumFloat32(25 << 2, 3)).to.closeTo(1.0, 0.000001);
    });
    
    it('the sum of int32s', function() {
      putInt32(I4, 100, [-3, 1, 3]);
      
      expect(mod.sumInt32(25 << 2, -1)).to.equal(0);
    });

    it('the logsumexp of float32s', function() {
      F4[25] = 1.0;
      expect(mod.logsumexp(25 << 2, 1)).to.closeTo(1.0, 0.000001);
      F4[25] = 2.0;
      expect(mod.logsumexp(25 << 2, 1)).to.closeTo(2.0, 0.000001);
      F4[26] = 2.0;
      expect(mod.logsumexp(25 << 2, 2)).to.closeTo(2.6931471, 0.000001);
      F4[25] = -10.0;
      F4[26] = 10.0;
      F4[27] = -9.0;
      expect(mod.logsumexp(25 << 2, 3)).to.closeTo(10.0, 0.000001);

      expect(mod.logsumexp(25 << 2, 0)).to.closeTo(0.0, 0.000001);
      expect(mod.logsumexp(25 << 2, -1)).to.closeTo(0.0, 0.000001);
    });
  });
  
  describe('has vector math functions:', function() {
    it('dot product between a sparse vec and a dense vec', function() {
      var x = [];
      var index = [];
      var y = [];
      var xP = 0;
      var indexP = 500;
      var yP = 1000;
      var outP = 2000;      
      
      x = [1.0, 0.5];
      index = [2, 0];
      y = [1.0, -1.5, 2.0, 0.5, 1.0];
      putFloat(F4, xP, x);
      putUint32(U4, indexP, index);
      putFloat(F4, yP, y);

      mod.math_sparse_susdot(x.length, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(2.5, 0.000001);

      F4[outP >> 2] = 10.0;
      mod.math_sparse_susdot(1, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(2.0, 0.000001);

      F4[outP >> 2] = 10.0;
      mod.math_sparse_susdot(0, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(0.0, 0.000001);
      
      F4[outP >> 2] = 10.0;
      mod.math_sparse_susdot(-1, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(0.0, 0.000001);
      
      x = [1.0, 0.5, -1.5];
      index = [2, 0, 2];
      y = [1.0, -1.5, 2.0, 0.5, 1.0];
      putFloat(F4, xP, x);
      putUint32(U4, indexP, index);
      putFloat(F4, yP, y);
      mod.math_sparse_susdot(x.length, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(-0.5, 0.000001);
    });
    
    it('sorts the elements of a sparse vector by its indices', function() {
      var i = 0;
      var values = [1.0, -2.0, 0.5, 0.5, 3.0];
      var indices = [4, 5, 0, 5, 8];

      var nz = values.length;
      var valueP = 1000;
      var indexP = 2000;
      var outValueP = 4000;
      var outIndexP = 5000;
      
      putFloat(F4, valueP, values);
      putInt32(I4, indexP, indices);

      mod.math_sparse_sort(0, valueP, indexP,
        outValueP, outIndexP);
      expect(I4[outIndexP >> 2]).to.equal(0);
      expect(F4[outValueP >> 2]).to.equal(0.0);      
      
      mod.math_sparse_sort(nz, valueP, indexP,
        outValueP, outIndexP);

      expect(I4[outIndexP >> 2]).to.equal(0);
      expect(I4[(outIndexP + (1 << 2)) >> 2]).to.equal(4);
      expect(I4[(outIndexP + (2 << 2)) >> 2]).to.equal(5);
      expect(I4[(outIndexP + (3 << 2)) >> 2]).to.equal(5);
      expect(I4[(outIndexP + (4 << 2)) >> 2]).to.equal(8);

      expect(F4[outValueP >> 2]).to.equal(0.5);
      expect(F4[(outValueP + (1 << 2)) >> 2]).to.equal(1.0);
      // sort is not required to be stable
      expect(F4[(outValueP + (2 << 2)) >> 2]).to.be.oneOf([-2.0, 0.5]);
      expect(F4[(outValueP + (3 << 2)) >> 2]).to.be.oneOf([-2.0, 0.5]);
      expect(F4[(outValueP + (4 << 2)) >> 2]).to.equal(3.0);
    });
    
    it('resolving repeated indices of sparse vectors', function() {
      var inP = 1000;
      var outNzP = 2000;
      var outValueP = 10000;
      var outIndexP = 3000;
      var t = inP;
      
      var values = [1.0, -2.0, 0.5, 0.5, 3.0];
      var indices = [4, 5, 0, 5, 8];

      var nz = values.length;
      var valueP = 1000;
      var indexP = 2000;
      var outValueP = 4000;
      var outIndexP = 5000;

      putFloat(F4, valueP, values);
      putInt32(I4, indexP, indices);
      
      mod.math_sparse_unique(nz, valueP, indexP,
        outNzP, outValueP, outIndexP);

      expect(I4[outNzP >> 2]).to.equal(4);

      expect(I4[outIndexP >> 2]).to.equal(0);
      expect(I4[(outIndexP + (1 << 2)) >> 2]).to.equal(4);
      expect(I4[(outIndexP + (2 << 2)) >> 2]).to.equal(5);
      expect(I4[(outIndexP + (3 << 2)) >> 2]).to.equal(8);

      expect(F4[outValueP >> 2]).to.equal(0.5);
      expect(F4[(outValueP + (1 << 2)) >> 2]).to.equal(1.0);
      expect(F4[(outValueP + (2 << 2)) >> 2]).to.closeTo(-1.5, 0.00001);
      expect(F4[(outValueP + (3 << 2)) >> 2]).to.equal(3.0);
    });
    
    it('has a builder for sparse vectors', function() {
      var tableSize = 1 << 16;
      var maxNumberOfKeys = 1 << 17;
      var p = 10000;
      var outNzP = 0;
      var outValueP = 1000;
      var outIndexP = 2000;

      mod.math_sparse_builder_create(p, tableSize, maxNumberOfKeys);
      expect(mod.math_sparse_builder_size(p)).to.equal(0);
      
      mod.math_sparse_builder_add(p, 100, 1.0, 1.0);
      mod.math_sparse_builder_add(p, 100, -2.0, 2.0);
      mod.math_sparse_builder_add(p, 10, 2.0, 1.0);
      expect(mod.math_sparse_builder_size(p)).to.equal(2);
      
      mod.math_sparse_builder_build(p, outNzP, outValueP, outIndexP);
      expect(I4[outNzP >> 2]).to.equal(2);
      expect(I4[outIndexP >> 2]).to.equal(100);
      expect(I4[(outIndexP + 4) >> 2]).to.equal(10);
      expect(F4[outValueP >> 2]).to.be.closeTo(-3.0, 0.00001);
      expect(F4[(outValueP + 4) >> 2]).to.equal(2.0);
    });
  });
      
  describe('handles unicode:', function() {        
    it('utf16-to-utf8 conversion', function() {
      var str = '';
      var inPP = 0;
      var inP = 100;
      var inEnd = 0;
      var outPP = 1000;
      var outP = 2000;
      var outEnd = 3000;
      var errorCode = 0;
      
      // ASCII conversion
      str = 'abc';
      putUtf16(str, U2, inP);
      U4[0 >> 2] = inP;
      U4[outPP >> 2] = outP;
      inEnd = inP + str.length * 2;
      errorCode = mod.uc_convertUtf16toUtf8(inPP, inEnd, outPP, outEnd);
      expect(errorCode).to.equal(0);
      expect(U1[outP]).to.equal(97);
      expect(U1[outP + 1]).to.equal(98);
      expect(U1[outP + 2]).to.equal(99);
      expect(U4[inPP >> 2]).to.equal(inEnd);
      expect(U4[outPP >> 2]).to.equal(outP + 3);

      // Multi-byte characters
      // hiragana characters occupy 2 bytes in UTF-16 and 3 bytes in UTF-8
      str = 'あいう'; // [12354, 12356, 12358] in code points
      inP = inEnd;
      inEnd = inP + str.length * 2;
      outP = U4[outPP >> 2];
      putUtf16(str, U2, inP);
      errorCode = mod.uc_convertUtf16toUtf8(inPP, inEnd, outPP, outEnd);
      expect(errorCode).to.equal(0);
      expect(U1.subarray(outP, outP + 3)).to.deep.equal(
        new Uint8Array([0xe3, 0x81, 0x82])
      );
      outP += 3;
      expect(U1.subarray(outP, outP + 3)).to.deep.equal(
        new Uint8Array([0xe3, 0x81, 0x84])
      );
      outP += 3;
      expect(U1.subarray(outP, outP + 3)).to.deep.equal(
        new Uint8Array([0xe3, 0x81, 0x86])
      );
      
      // TODO: add more tests
    });

    it('utf8-to-utf16 conversion', function() {
      var inPP = 0;
      var inP = 100;
      var inEnd = 0;
      var outPP = 1000;
      var outP = 2000;
      var outEnd = 3000;
      var errorCode = 0;      
      
      U4[0 >> 2] = inP;
      U4[outPP >> 2] = outP;
      U1[inP] = 0xe3;
      U1[inP + 1] = 0x81;
      U1[inP + 2] = 0x82;
      inEnd = inP + 3;
      errorCode = mod.uc_convertUtf8toUtf16(inPP, inEnd, outPP, outEnd);
      expect(errorCode).to.equal(0);
      expect(U4[inPP >> 2]).to.equal(103);
      expect(U2[outP >> 1]).to.equal(12354);
      
      // TODO: add more tests
    });
  });
  
  describe('has a collection of utility functions', function() {
    it('base64 decoding', function() {
      var inP = 1000;
      var outP = 2000;

      expect(mod.util_base64DecodeLength(-1)).to.be.lessThan(0);

      // test vectors from RFC 4648
      setASCII(U1, inP, '');
      expect(mod.util_base64DecodeLength(0)).to.equal(0);
      expect(mod.util_base64Decode(inP, 0, outP)).to.equal(0);
      expect(U1[outP]).to.equal(0);
      
      setASCII(U1, inP, 'Zg==');
      expect(mod.util_base64DecodeLength(4)).to.equal(3);
      expect(mod.util_base64Decode(inP, 4, outP)).to.equal(1);
      expect(getASCII(U1, outP, 1)).to.equal('f');

      setASCII(U1, inP, 'Zm8=');
      expect(mod.util_base64Decode(inP, 4, outP)).to.equal(2);
      expect(getASCII(U1, outP, 2)).to.equal('fo');

      setASCII(U1, inP, 'Zm9v');
      expect(mod.util_base64Decode(inP, 4, outP)).to.equal(3);
      expect(getASCII(U1, outP, 3)).to.equal('foo');

      setASCII(U1, inP, 'Zm9vYg==');
      expect(mod.util_base64DecodeLength(8)).to.equal(6);
      expect(mod.util_base64Decode(inP, 8, outP)).to.equal(4);
      expect(getASCII(U1, outP, 4)).to.equal('foob');

      setASCII(U1, inP, 'Zm9vYmE=');
      expect(mod.util_base64Decode(inP, 8, outP)).to.equal(5);
      expect(getASCII(U1, outP, 5)).to.equal('fooba');

      setASCII(U1, inP, 'Zm9vYmFy');
      expect(mod.util_base64Decode(inP, 8, outP)).to.equal(6);
      expect(getASCII(U1, outP, 6)).to.equal('foobar');
      
      // other test vectors
      setASCII(U1, inP, '+A==');
      expect(mod.util_base64Decode(inP, 4, outP)).to.equal(1);
      expect(U1[outP]).to.equal(62 << 2);

      setASCII(U1, inP, '/A==');
      expect(mod.util_base64Decode(inP, 4, outP)).to.equal(1);
      expect(U1[outP]).to.equal(63 << 2);
      
      setASCII(U1, inP, '/A=');
      expect(mod.util_base64Decode(inP, 3, outP)).lessThan(0);

      setASCII(U1, inP, '/A?=');
      expect(mod.util_base64Decode(inP, 4, outP)).lessThan(0);
    });
    
    it('base64 encoding', function() {
      var inP = 1000;
      var outP = 2000;
      
      U1[inP >> 0] = 102;
      
      // test vectors from RFC 4648
      expect(mod.util_base64Encode(inP, 0, outP)).to.equal(0);
      expect(mod.util_base64EncodeLength(0)).to.equal(0);
      expect(mod.util_base64EncodeLength(-1)).to.be.lessThan(0);
      expect(U1[outP >> 0]).to.equal(0);
      
      setASCII(U1, inP, 'f');
      expect(mod.util_base64EncodeLength(1)).to.equal(4);
      expect(mod.util_base64Encode(inP, 1, outP)).to.equal(4);
      expect(getASCII(U1, outP, 4)).to.equal('Zg==');

      setASCII(U1, inP, 'fo');
      expect(mod.util_base64EncodeLength(2)).to.equal(4);
      expect(mod.util_base64Encode(inP, 2, outP)).to.equal(4);
      expect(getASCII(U1, outP, 4)).to.equal('Zm8=');

      setASCII(U1, inP, 'foo');
      expect(mod.util_base64EncodeLength(3)).to.equal(4);
      mod.util_base64Encode(inP, 3, outP);
      expect(getASCII(U1, outP, 4)).to.equal('Zm9v');

      setASCII(U1, inP, 'foob');
      expect(mod.util_base64EncodeLength(4)).to.equal(8);
      expect(mod.util_base64Encode(inP, 4, outP)).to.equal(8);
      expect(getASCII(U1, outP, 8)).to.equal('Zm9vYg==');

      setASCII(U1, inP, 'fooba');
      expect(mod.util_base64EncodeLength(5)).to.equal(8);
      expect(mod.util_base64Encode(inP, 5, outP)).to.equal(8);
      expect(getASCII(U1, outP, 8)).to.equal('Zm9vYmE=');

      setASCII(U1, inP, 'foobar');
      expect(mod.util_base64EncodeLength(6)).to.equal(8);
      expect(mod.util_base64Encode(inP, 6, outP)).to.equal(8);
      expect(getASCII(U1, outP, 8)).to.equal('Zm9vYmFy');
      
      // other test vectors
      U1[inP] = 62 << 2;
      expect(mod.util_base64Encode(inP, 1, outP)).to.equal(4);
      expect(getASCII(U1, outP, 4)).to.equal('+A==');
      
      U1[inP] = 63 << 2;
      expect(mod.util_base64Encode(inP, 1, outP)).to.equal(4);
      expect(getASCII(U1, outP, 4)).to.equal('/A==');
    });
    
    it('memmove', function() {
      I4[1000 >> 2] = 213523;
      I4[1004 >> 2] = -1279355;
      I4[1008 >> 2] = 0xffff1111;
      
      mod.memmove(2000, 1000, 12);
      
      expect(I4[2000 >> 2]).to.equal(213523);
      expect(I4[2004 >> 2]).to.equal(-1279355);
      expect(I4[2008 >> 2]).to.equal(0xffff1111 | 0);
      
      mod.memmove(1000, 2000, 12);
      expect(I4[1000 >> 2]).to.equal(213523);
      expect(I4[1004 >> 2]).to.equal(-1279355);
      expect(I4[1008 >> 2]).to.equal(0xffff1111 | 0);

      mod.memmove(3000, 2000, 0);
      expect(I4[3000 >> 2]).to.equal(0);
      expect(I4[3004 >> 2]).to.equal(0);
      expect(I4[3008 >> 2]).to.equal(0);

      mod.memmove(3000, 2000, -1);
      expect(I4[3000 >> 2]).to.equal(0);
      expect(I4[3004 >> 2]).to.equal(0);
      expect(I4[3008 >> 2]).to.equal(0);

      mod.memmove(3000, 2000, 4);
      expect(I4[3000 >> 2]).to.equal(213523);
      expect(I4[3004 >> 2]).to.equal(0);
      expect(I4[3008 >> 2]).to.equal(0);

      mod.memmove(4000, 2000, 8);
      expect(I4[4000 >> 2]).to.equal(213523);
      expect(I4[4004 >> 2]).to.equal(-1279355);
      expect(I4[4008 >> 2]).to.equal(0);

      mod.memmove(2000, 2000, 12);
      expect(I4[2000 >> 2]).to.equal(213523);
      expect(I4[2004 >> 2]).to.equal(-1279355);
      expect(I4[2008 >> 2]).to.equal(0xffff1111 | 0);

      mod.memmove(992, 1000, 12);
      expect(I4[976 >> 2]).to.equal(0);
      expect(I4[992 >> 2]).to.equal(213523);
      expect(I4[996 >> 2]).to.equal(-1279355);
      expect(I4[1000 >> 2]).to.equal(0xffff1111 | 0);
      expect(I4[1004 >> 2]).to.equal(-1279355);
      expect(I4[1008 >> 2]).to.equal(0xffff1111 | 0);
      expect(I4[1016 >> 2]).to.equal(0);
      
      I4[1000 >> 2] = 213523;
      I4[1004 >> 2] = -1279355;
      I4[1008 >> 2] = 0xffff1111;

      mod.memmove(1004, 1000, 12);
      expect(I4[1000 >> 2]).to.equal(213523);
      expect(I4[1004 >> 2]).to.equal(213523);
      expect(I4[1008 >> 2]).to.equal(-1279355);
      expect(I4[1012 >> 2]).to.equal(0xffff1111 | 0);
      expect(I4[1016 >> 2]).to.equal(0);

      I4[1000 >> 2] = 213523;
      I4[1004 >> 2] = -1279355;
      I4[1008 >> 2] = 0xffff1111;
      U1[1000] = 0x24;
      U1[1001] = 0x42;
      
      mod.memmove(2000, 1001, 12);
      expect(U1[2000]).to.equal(0x42);
      
      mod.memmove(2003, 1001, 12);
      expect(U1[2003]).to.equal(0x42);

      mod.memmove(2016, 1000, 12);
      expect(U1[2016]).to.equal(0x24);

      // mod.memmove(2008, 2000, 12);
      // expect(I4[2000 >> 2]).to.equal(213523);
      // expect(I4[2004 >> 2]).to.equal(213523);
      // expect(I4[2008 >> 2]).to.equal(-1279355);
      // expect(I4[20012 >> 2]).to.equal(0xffff1111 | 0);
      //
      // mod.memmove(2008, 2000, 12);
      // expect(I4[2000 >> 2]).to.equal(213523);
      // expect(I4[2004 >> 2]).to.equal(-1279355);
      // expect(I4[2008 >> 2]).to.equal(213523);
      // expect(I4[20012 >> 2]).to.equal(-1279355);
      //
      // mod.memmove(2008, 2000, 12);
      // expect(I4[2000 >> 2]).to.equal(213523);
      // expect(I4[2004 >> 2]).to.equal(213523);
      // expect(I4[2008 >> 2]).to.equal(-1279355);
      // expect(I4[20012 >> 2]).to.equal(0xffff1111 | 0);

    });
    
    it('qsort with the improvement by Bentley-McIlroy', function() {
      var i = 0;
      var inP = 1000;
      var ints = [4, 5, 1, -2, 3];
      var isOk = true;
      
      putInt32(I4, inP, ints);

      mod.qsortBM(inP, ints.length, 4, 0);
      
      expect(I4[inP >> 2]).to.equal(-2);
      expect(I4[(inP + 4) >> 2]).to.equal(1);
      expect(I4[(inP + 8) >> 2]).to.equal(3);
      expect(I4[(inP + 12) >> 2]).to.equal(4);
      expect(I4[(inP + 16) >> 2]).to.equal(5);
      
      ints = [];
      
      for (i = 0; i < 1000; i += 1) {
        ints.push((Math.random() * 1000000 - 500000) >> 0);
      }

      putInt32(I4, inP, ints);
      mod.qsortBM(inP, ints.length, 4, 0);
      ints.sort(function(a, b) {
        return a - b;
      });
      
      for (i = 0; i < 1000; i += 1) {
        isOk = isOk && (ints[i] === I4[(inP + (i << 2)) >> 2]);
      }
      expect(isOk).to.be.true;
      
      // Add more regorous tests
    });
    
    it('MurmurHash3_x86_32', function() {
      // Test vectors suggested by Ian Boyd in 2015
      // See http://stackoverflow.com/a/31929528
      // Note that this test fails in big-endian environments
      // because MurmurHash3_x86_32 is not endian-independent
      
      var i = 0;
      var str = '';
      
      expect(mod.hash(16, 0, 0)).to.equal(0);
      expect(mod.hash(16, 0, 1) >>> 0).to.equal(0x514E28B7);
      expect(mod.hash(16, 0, 0xffffffff) >>> 0).to.equal(0x81F16F39);
      U4[16 >> 2] = 0xffffffff;
      expect(mod.hash(16, 4, 0) >>> 0).to.equal(0x76293B50);
      U1[16] = 0x21;
      U1[17] = 0x43;
      U1[18] = 0x65;
      U1[19] = 0x87;
      expect(mod.hash(16, 4, 0) >>> 0).to.equal(0xF55B516B);
      expect(mod.hash(16, 4, 0x5082EDEE) >>> 0).to.equal(0x2362F9DE);
      U4[16 >> 2] = 0;
      expect(mod.hash(16, 4, 0) >>> 0).to.equal(0x2362F9DE);
      expect(mod.hash(16, 3, 0) >>> 0).to.equal(0x85F0B427);
      expect(mod.hash(16, 2, 0) >>> 0).to.equal(0x30F4C306);
      expect(mod.hash(16, 1, 0) >>> 0).to.equal(0x514E28B7);

      str = 'Hello, world!';
      setASCII(U1, 16, str);
      expect(mod.hash(16, str.length, 0x9747b28c) >>> 0).
        to.equal(0x24884CBA);
      
      // for UTF-8 encoding
      // TestString("ππππππππ", 0x9747b28c, 0xD58063C1);
      
      str = '';
      for (i = 0; i < 256; i += 1) {
        str += 'a';
      }
      setASCII(U1, 16, str);
      expect(mod.hash(16, str.length, 0x9747b28c) >>> 0).to.equal(0x37405BDC);

      str = 'abc';
      setASCII(U1, 16, str);
      expect(mod.hash(16, str.length, 0) >>> 0).to.equal(0xB3DD93FA);
      str = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
      setASCII(U1, 16, str);
      expect(mod.hash(16, str.length, 0) >>> 0).to.equal(0xEE925B90);

      str = 'The quick brown fox jumps over the lazy dog';
      setASCII(U1, 16, str);
      expect(mod.hash(16, str.length, 0x9747b28c) >>> 0).
        to.equal(0x2FA826CD);
      
    });
    
    it('endian checking', function() {
      // big-endian
      // expect(mod.isLittleEndian()).to.equal(0);

      // little-endian
      // expect(mod.isLittleEndian()).to.equal(1);
      
      // Internally this function uses the first 2 bytes in the heap during
      // checking. The following lines test if the original value is safely
      // reverted to the heap.
      U2[0] = 0x1315;
      mod.isLittleEndian();
      expect(U2[0]).to.equal(0x1315);
    });
  });
  
  describe('provides methods to train CRF models such as', function() {
    it('feature hashing', function() {
      var x = [];
      var index = [];
      var xP = 0;
      var indexP = 500;
      var outValueP = 2000;
      var outIndexP = 3000;
      var i = 0;
      var dimension = 0x100;
      
      x = [1.0, 0.5, -2.0, 0.5, -1.0];
      index = [2, 0, 42, 100, 255];
      putFloat(F4, xP, x);
      putUint32(U4, indexP, index);

      mod.learn_crf_featureHashing(x.length,
        xP, indexP, 0, dimension, outValueP, outIndexP);
      for (i = 0; i < x.length; i += 1) {
        expect(U4[(outIndexP + i << 2) >> 2]).to.be.
          within(0, dimension - 1);
      }

      for (i = 0; i < x.length; i += 1) {
        expect(Math.abs(F4[(outValueP + (i << 2)) >> 2])).to.
          closeTo(Math.abs(x[i]), 0.000001);
      }
      
      // MurmurHashing 255 with the seed 0 returns a negative value.
      // In such a case, the sign of its value is inverted.
      expect(F4[(outValueP + (4 << 2)) >> 2]).to.equal(1.0);
      
      // TODO: Add more tests
    });
    
    it('feature hashing for a multiclass sequence', function() {
      var nz = [];
      var x = [];
      var index = [];
      var nzP = 5000;
      var xP = 0;
      var indexP = 500;
      var outValueP = 2000;
      var outIndexP = 3000;
      var numberOfClasses = 3;
      var pathLength = 2;
      var dimension = 0x100;
      var i = 0;
      var j = 0;
      var k = 0;
      var p = 0;
      var p2 = 0;
      
      nz = [
        3,
        4
      ];
      x = [
        1.0, 0.5, -2.0, 
        0.5, -1.0, 1.0, 4.0
      ];
      index = [
        2, 0, 42,
        100, 255, 2, 10
      ];

      putUint32(U4, nzP, nz);
      putFloat(F4, xP, x);
      putUint32(U4, indexP, index);

      mod.learn_crf_featureHashingSequence(
        nzP, xP, indexP,
        numberOfClasses, pathLength, dimension, outValueP, outIndexP);

      for (i = 0, p = 0, p2 = 0; i < pathLength; i += 1) {
        for (j = 0; j < numberOfClasses; j += 1) {
          for (k = 0; k < nz[i]; k += 1) {
            expect(Math.abs(F4[(outValueP + (p << 2)) >> 2])).to.
              closeTo(Math.abs(x[p2 + k]), 0.000001);
            p += 1;
          }
        }
        p2 += nz[i];
      }
      expect(F4[(outValueP + (p << 2)) >> 2]).to.equal(0.0);
      expect(I4[(outIndexP + (p << 2)) >> 2]).to.equal(0);

      // TODO: Add more tests
    });
    
    
    it('feature score calculation', function() {
      var i = 0;
      var numberOfStates = 2;
      var chainLength = 3;

      var biasScore = [0.1];
      var transitionScores = [
        1.0, -1.0,
        0.5, 2.0,
        -1.5, 0.5
      ];
      var stateScores = [
        0.5, -2.0,
        1.0, 1.5,
        2.0, -1.0
      ];
      
      // for i = 0, featureScores[0][0][k] =
      //   transitionScores[0][k] + stateScores[0][k] + bias
      // for i >= 1, featureScores[i][j][k] =
      //   transitionScores[j + 1][k] + stateScores[i][k] + bias
      var expectedFeatureScores = [
        1.6, -2.9, 0.0, 0.0,
        1.6, 3.6, -0.4, 2.1,
        2.6, 1.1, 0.6, -0.4
      ];

      var biasScoreP = 1000;
      var transitionScoreP = 5000;
      var stateScoreP = 10000;
      var outP = 20000;
      
      putFloat(F4, biasScoreP, biasScore);
      putFloat(F4, transitionScoreP, transitionScores);
      putFloat(F4, stateScoreP, stateScores);
      
      // do nothing if either # of states or chain length is less than 1
      mod.learn_crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, 0, chainLength, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, -1, chainLength, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, numberOfStates, 0, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, numberOfStates, -1, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      
      mod.learn_crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, numberOfStates, chainLength, outP);
      
      for (i = 0; i < numberOfStates * numberOfStates * chainLength; i += 1) {
        expect(F4[outP >> 2]).to.closeTo(expectedFeatureScores[i], 0.00001);
        outP += 4;
      }
      // The method uses exactly (numberOfStates * chainLength) bytes
      // so bytes after that should remain 0
      expect(F4[outP >> 2]).to.closeTo(0.0, 0.00001);
    });
    
    it('forward score calculation', function() {
      var i = 0;
      var numberOfStates = 2;
      var chainLength = 3;

      // NaN is deliberately included here to test for ensuring that the
      // elements of these positions are not involved during computation.
      var featureScores = [
        1.8, 2.0, NaN, NaN,
        1.5, 1.2, 1.3, 1.4,
        2.0, 2.0, 1.5, 3.5,
      ];

      // forwardScores[time][cur] = logsumexp(
      //   featureScores[time][0][cur] + forwardScores[time - 1][0],
      //   featureScores[time][1][cur] + forwardScores[time - 1][1],
      //   ...
      // )
      var expectedForwardScores = [
        1.8, 2.0,
        log(exp(1.8 + 1.5) + exp(2.0 + 1.3)),
          log(exp(1.8 + 1.2) + exp(2.0 + 1.4)),
        0, 0,
      ];
      expectedForwardScores[4] = log(exp(expectedForwardScores[2] + 2.0) +
        exp(expectedForwardScores[3] + 1.5));
      expectedForwardScores[5] = log(exp(expectedForwardScores[2] + 2.0) +
        exp(expectedForwardScores[3] + 3.5));

      var inP = 1000;
      var outP = 3000;
      var tmpP = 2000;
      
      putFloat(F4, inP, featureScores);

      // do nothing if either # of states or chain length is less than 1
      mod.learn_crf_updateForwardScores(inP, -1, chainLength, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateForwardScores(inP, 0, chainLength, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateForwardScores(inP, numberOfStates, 0, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateForwardScores(inP, numberOfStates, -1, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);

      mod.learn_crf_updateForwardScores(inP, numberOfStates, chainLength, tmpP, outP);

      for (i = 0; i < numberOfStates * chainLength; i += 1) {
        expect(F4[outP >> 2]).to.closeTo(expectedForwardScores[i], 0.00001);
        outP += 4;
      }
      // The method uses exactly (numberOfStates * chainLength) bytes
      // so bytes after that should remain 0
      expect(F4[outP >> 2]).to.closeTo(0.0, 0.00001);
    });
    
    it('backward score calculation', function() {
      var i = 0;
      var numberOfStates = 2;
      var chainLength = 3;
      
      // NaN is deliberately included here to test for ensuring that the
      // elements of these positions are not involved during computation.
      var featureScores = [
        1.8, 2.0, NaN, NaN,
        1.5, 1.2, 1.3, 1.4,
        log(2.0), log(2.0), log(1.5), log(3.5),        
      ];
      
      // backwardScores[time][cur] = logsumexp(
      //   featureScores[time + 1][cur][0] + backwardScores[time + 1][0],
      //   featureScores[time + 1][cur][1] + backwardScores[time + 1][1],
      //   ...
      // )
      var expectedBackwardScores = [
        log(exp(1.5 + log(4.0)) + exp(1.2 + log(5.0))),
          log(exp(1.3 + log(4.0)) + exp(1.4 + log(5.0))),
        log(4.0), log(5.0),
        0.0, 0.0
      ];
      var inP = 1000;
      var outP = 3000;
      var tmpP = 2000;
      
      putFloat(F4, inP, featureScores);

      // This function does nothing if either # of states or chain length is
      // less than 1
      mod.learn_crf_updateBackwardScores(inP, -1, chainLength, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateBackwardScores(inP, 0, chainLength, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateBackwardScores(inP, numberOfStates, 0, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.learn_crf_updateBackwardScores(inP, numberOfStates, -1, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);

      mod.learn_crf_updateBackwardScores(inP, numberOfStates,
        chainLength, tmpP, outP);
      for (i = 0; i < numberOfStates * chainLength; i += 1) {
        expect(F4[outP >> 2]).to.closeTo(expectedBackwardScores[i], 0.00001);
        outP += 4;
      }
      // The method uses exactly (numberOfStates * chainLength) bytes
      // so bytes after that should remain 0
      expect(F4[outP >> 2]).to.closeTo(0.0, 0.00001);
    });
    
    it('computing a normalization factor from forward scores', function() {
      var forwardScores = [
        1.0, 2.0,
        -1.0, 0.5,
        1.0, -1.0
      ];
      var numberOfStates = 2;
      var chainLength = 3;
      var inP = 1000;
      var nf = 0.0;
      var outP = 2000;
      
      putFloat(F4, inP, forwardScores);
      
      mod.learn_crf_updateNormalizationFactor(inP, 0, chainLength, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      mod.learn_crf_updateNormalizationFactor(inP, -1, chainLength, outP);
      expect(F4[outP >> 2]).to.equal(0.0);

      mod.learn_crf_updateNormalizationFactor(inP, numberOfStates, 0, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      mod.learn_crf_updateNormalizationFactor(inP, numberOfStates, -1, outP);
      expect(F4[outP >> 2]).to.equal(0.0);

      mod.learn_crf_updateNormalizationFactor(inP, numberOfStates, chainLength, outP);
      expect(F4[outP >> 2]).to.closeTo(1.126928, 0.00001);
    });
    
    it('suffering negative log-likelihood loss', function() {
      var i = 0;
      var numberOfStates = 2;
      var chainLength = 3;
      
      var featureScores = [
        1.6, -2.9, 0.0, 0.0,
        1.6, 3.6, -0.4, 2.1,
        2.6, 1.1, 0.6, -0.4
      ];
      
      var normalizationFactor = [0.1];
      
      var correctPath = [0, 1, 0];
      
      var featureScoreP = 1000;
      var normalizationFactorP = 2000;
      var correctPathP = 3000;
      var lossP = 4000;
      
      putFloat(F4, featureScoreP, featureScores);
      putFloat(F4, normalizationFactorP, normalizationFactor);
      putInt32(I4, correctPathP, correctPath);
      
      mod.learn_crf_sufferLoss(featureScoreP, normalizationFactorP,
        correctPathP, 0, chainLength, lossP);
      expect(F4[lossP >> 2]).to.equal(0.0);
      mod.learn_crf_sufferLoss(featureScoreP, normalizationFactorP,
        correctPathP, numberOfStates, 0, lossP);
      expect(F4[lossP >> 2]).to.equal(0.0);
      
      mod.learn_crf_sufferLoss(featureScoreP, normalizationFactorP,
        correctPathP, numberOfStates, chainLength, lossP);
        
      expect(F4[lossP >> 2]).to.closeTo(-(1.6 + 3.6 + 0.6 - 0.1), 0.00001);
      
      correctPath = [0, 0, 0];
      mod.learn_crf_sufferLoss(featureScoreP, normalizationFactorP,
        correctPathP, numberOfStates, chainLength, lossP);
        expect(F4[lossP >> 2]).to.closeTo(-(1.6 + 1.6 + 2.6 - 0.1), 0.00001);
    });
    
    it('joint score calculation', function() {
      var i = 0;
      var numberOfStates = 2;
      var chainLength = 3;
      
      var normalizationFactor = [0.5];
      var forwardScores = [
        1.0, -1.0,
        0.5, 2.0,
        -1.5, 0.5
      ];
      var backwardScores = [
        0.5, -2.0,
        1.0, 1.5,
        2.0, -1.0
      ];

      var featureScores = [
        1.6, -2.9, 0.0, 0.0,
        1.6, 3.6, -0.4, 2.1,
        2.6, 1.1, 0.6, -0.4
      ];

      // In real situations, the sum of the exponential of each score
      // (excluding jointScores[0][j][k] for j >= 1) must be close to 1.0
      // but we ignore that condition here.
      var expectedJointScores = [
        1.6, -5.4, 0.0, 0.0,
        3.1, 5.6, -0.9, 2.1,
        4.6, 0.1, 4.1, 0.1
      ];
      
      var featureScoreP = 3000;
      var forwardScoreP = 1000;
      var backwardScoreP = 2000;
      var normalizationFactorP = 4000;
      
      putFloat(F4, featureScoreP, featureScores);
      putFloat(F4, forwardScoreP, forwardScores);
      putFloat(F4, backwardScoreP, backwardScores);
      putFloat(F4, normalizationFactorP, normalizationFactor);
      
      // This function does nothing if either # of states or chain length is
      // less than 1
      mod.learn_crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, 0, chainLength);
      expect(F4[featureScoreP >> 2]).to.closeTo(1.6, 0.0001);
      expect(F4[(featureScoreP - 4) >> 2]).to.closeTo(0.0, 0.00001);
      expect(F4[(featureScoreP + 4) >> 2]).to.closeTo(-2.9, 0.00001);
      mod.learn_crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, -1, chainLength);
      expect(F4[featureScoreP >> 2]).to.closeTo(1.6, 0.00001);
      expect(F4[(featureScoreP - 4) >> 2]).to.closeTo(0.0, 0.00001);
      expect(F4[(featureScoreP + 4) >> 2]).to.closeTo(-2.9, 0.00001);
      mod.learn_crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, numberOfStates, 0);
      expect(F4[featureScoreP >> 2]).to.closeTo(1.6, 0.00001);
      expect(F4[(featureScoreP - 4) >> 2]).to.closeTo(0.0, 0.00001);
      expect(F4[(featureScoreP + 4) >> 2]).to.closeTo(-2.9, 0.00001);
      mod.learn_crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, numberOfStates, -1);
      expect(F4[featureScoreP >> 2]).to.closeTo(1.6, 0.00001);
      expect(F4[(featureScoreP - 4) >> 2]).to.closeTo(0.0, 0.00001);
      expect(F4[(featureScoreP + 4) >> 2]).to.closeTo(-2.9, 0.00001);
      
      mod.learn_crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, numberOfStates, chainLength);
      for (i = 0; i < numberOfStates * numberOfStates * chainLength; i += 1) {
        expect(F4[featureScoreP >> 2]).
          to.closeTo(expectedJointScores[i], 0.00001);
        featureScoreP += 4;
      }
      // The method overwrites featureScores,
      // so bytes after that should remain 0 in this case.
      expect(F4[featureScoreP >> 2]).to.closeTo(0.0, 0.00001);
    });

    it('gradient calculation', function() {
      var i = 0;
      var numberOfStates = 2;
      var pathLength = 3;
      
      var biasScore = [
        1.0
      ];

      var transitionScores = [
        1.0, -2.0,
        2.0, 4.0,
        -2.0, 1.0
      ];
      
      var jointScores = [
        1.6, -5.4, 0.0, 0.0,
        3.1, 5.6, -0.9, 2.1,
        4.6, 0.1, 4.1, 0.1
      ];
      
      var nzs = [
        2, 3, 2
      ];
      
      var values = [
        1.0, 1.5,
          -1.5, 1.0,
        2.0, 1.0, -1.0,
          1.0, 1.0, 2.0,
        -1.0, -3.0,
          -1.0, 3.0
      ];
      
      var indices = [
        1, 2,
          3, 4,
        5, 6, 2,
          7, 8, 8,
        9, 10,
          11, 12
      ];
      
      var correctPath = [0, 1, 0];
      
      var nzP = 1000;
      var valueP = 2000;
      var indexP = 3000;
      var biasScoreP = 4000;
      var transitionScoreP = 5000;
      var jointScoreP = 6000;
      var correctPathP = 7000;
      var tmpValueP = 10000;
      var tmpIndexP = 11000;
      var outNzP = 20000;
      var outValueP = 21000;
      var outIndexP = 22000;
      
      var biasIndex = 100;
      var transitionIndex = 50;
      
      putFloat(I4, nzP, nzs);
      putFloat(F4, valueP, values);
      putFloat(I4, indexP, indices);
      putFloat(F4, biasScoreP, biasScore);
      putFloat(F4, transitionScoreP, transitionScores);
      putFloat(F4, jointScoreP, jointScores);
      putFloat(I4, correctPathP, correctPath);
      
      mod.learn_crf_updateGradient(nzP, valueP, indexP,
        biasScoreP, biasIndex, 
        transitionScoreP, transitionIndex,
        jointScoreP, correctPathP,
        numberOfStates, pathLength,
        tmpValueP, tmpIndexP,
        outNzP, outValueP, outIndexP);
      
      expect(I4[outNzP >> 2]).to.
        equal(12 + numberOfStates * (numberOfStates + 1) + numberOfStates + 1);
      // TODO add more test
    });
    
    it('viterbi', function() {
      var i = 0;
      var numberOfStates = 2;
      var chainLength = 3;

      // correct path is [0, 1, 0]
      var scores = [
        1.6, -2.9, 0.0, 0.0,
        1.6, 3.6, -0.4, 2.1,
        2.6, 1.1, 0.7, -0.4
      ];

      var scoreP = 2000;
      var tmpP = 3000;
      var predictionP = 4000;
      var predictionScoreP = 5000;

      putFloat(F4, scoreP, scores);

      mod.learn_crf_viterbi(scoreP, 0, chainLength,
        tmpP, predictionP, predictionScoreP);
      expect(F4[predictionScoreP >> 2]).to.equal(0);
      
      mod.learn_crf_viterbi(scoreP, numberOfStates, 0,
        tmpP, predictionP, predictionScoreP);
      expect(F4[predictionScoreP >> 2]).to.equal(0);
      
      mod.learn_crf_viterbi(scoreP, numberOfStates, chainLength,
        tmpP, predictionP, predictionScoreP);
      
      expect(F4[predictionScoreP >> 2]).to.closeTo(5.9, 0.00001);
      expect(F4[(predictionScoreP + 4) >> 2]).to.equal(0.0);
      expect(I4[predictionP >> 2]).to.equal(0);
      expect(I4[(predictionP + 4) >> 2]).to.equal(1);
      expect(I4[(predictionP + 8) >> 2]).to.equal(0);
      expect(I4[(predictionP + 12) >> 2]).to.equal(0);
    });
  });
});