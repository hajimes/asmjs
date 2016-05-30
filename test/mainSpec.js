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
  
  function putASCII(str, U1, pos) {
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

      mod.vec_susdot(x.length, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(2.5, 0.000001);

      F4[outP >> 2] = 10.0;
      mod.vec_susdot(1, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(2.0, 0.000001);

      F4[outP >> 2] = 10.0;
      mod.vec_susdot(0, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(0.0, 0.000001);
      
      F4[outP >> 2] = 10.0;
      mod.vec_susdot(-1, xP, indexP, yP, outP);
      expect(F4[outP >> 2]).to.closeTo(0.0, 0.000001);
      
      
      x = [1.0, 0.5, -1.5];
      index = [2, 0, 2];
      y = [1.0, -1.5, 2.0, 0.5, 1.0];
      putFloat(F4, xP, x);
      putUint32(U4, indexP, index);
      putFloat(F4, yP, y);
      mod.vec_susdot(x.length, xP, indexP, yP, outP);
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

      mod.vec_sortSparseVectorElements(0, valueP, indexP,
        outValueP, outIndexP);
      expect(I4[outIndexP >> 2]).to.equal(0);
      expect(F4[outValueP >> 2]).to.equal(0.0);      
      
      mod.vec_sortSparseVectorElements(nz, valueP, indexP,
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
      putASCII(str, U1, 16);
      expect(mod.hash(16, str.length, 0x9747b28c) >>> 0).
        to.equal(0x24884CBA);
      
      // for UTF-8 encoding
      // TestString("ππππππππ", 0x9747b28c, 0xD58063C1);
      
      str = '';
      for (i = 0; i < 256; i += 1) {
        str += 'a';
      }
      putASCII(str, U1, 16);
      expect(mod.hash(16, str.length, 0x9747b28c) >>> 0).to.equal(0x37405BDC);

      str = 'abc';
      putASCII(str, U1, 16);
      expect(mod.hash(16, str.length, 0) >>> 0).to.equal(0xB3DD93FA);
      str = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
      putASCII(str, U1, 16);
      expect(mod.hash(16, str.length, 0) >>> 0).to.equal(0xEE925B90);

      str = 'The quick brown fox jumps over the lazy dog';
      putASCII(str, U1, 16);
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

      mod.crf_featureHashing(x.length,
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

      mod.crf_featureHashingSequence(
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
      mod.crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, 0, chainLength, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, -1, chainLength, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, numberOfStates, 0, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateFeatureScores(biasScoreP, transitionScoreP,
        stateScoreP, numberOfStates, -1, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      
      mod.crf_updateFeatureScores(biasScoreP, transitionScoreP,
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
      expectedForwardScores[4] =  log(exp(expectedForwardScores[2] + 2.0) +
        exp(expectedForwardScores[3] + 1.5));
      expectedForwardScores[5] =  log(exp(expectedForwardScores[2] + 2.0) +
        exp(expectedForwardScores[3] + 3.5));

      var inP = 1000;
      var outP = 3000;
      var tmpP = 2000;
      
      putFloat(F4, inP, featureScores);

      // do nothing if either # of states or chain length is less than 1
      mod.crf_updateForwardScores(inP, -1, chainLength, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateForwardScores(inP, 0, chainLength, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateForwardScores(inP, numberOfStates, 0, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateForwardScores(inP, numberOfStates, -1, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);

      mod.crf_updateForwardScores(inP, numberOfStates, chainLength, tmpP, outP);

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
      mod.crf_updateBackwardScores(inP, -1, chainLength, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateBackwardScores(inP, 0, chainLength, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateBackwardScores(inP, numberOfStates, 0, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);
      mod.crf_updateBackwardScores(inP, numberOfStates, -1, tmpP, outP);
      expect(F4[outP >> 2]).to.equal(0.0);
      expect(F4[(outP - 4) >> 2]).to.equal(0.0);
      expect(F4[(outP + 4) >> 2]).to.equal(0.0);

      mod.crf_updateBackwardScores(inP, numberOfStates,
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
      
      putFloat(F4, inP, forwardScores);
      
      nf = mod.crf_getNormalizationFactor(inP, numberOfStates, chainLength);
      
      expect(nf).to.closeTo(1.126928, 0.00001);

      nf = mod.crf_getNormalizationFactor(inP, 0, chainLength);
      expect(nf).to.closeTo(0, 0.00001);
      nf = mod.crf_getNormalizationFactor(inP, -1, chainLength);
      expect(nf).to.closeTo(0, 0.00001);

      nf = mod.crf_getNormalizationFactor(inP, numberOfStates, 0);
      expect(nf).to.closeTo(0, 0.00001);
      nf = mod.crf_getNormalizationFactor(inP, numberOfStates, -1);
      expect(nf).to.closeTo(0, 0.00001);
    });
    
    it('joint score calculation', function() {
      var i = 0;
      var numberOfStates = 2;
      var chainLength = 3;
      
      var normalizationFactor = [0.1];
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
        2.0, -5.0, 0.0, 0.0,
        3.5, 6.0, -0.5, 2.5,
        5.0, 0.5, 4.5, 0.5
      ];
      
      var featureScoreP = 3000;
      var forwardScoreP = 1000;
      var backwardScoreP = 2000;
      var normalizationFactorP = 100;
      
      putFloat(F4, featureScoreP, featureScores);
      putFloat(F4, forwardScoreP, forwardScores);
      putFloat(F4, backwardScoreP, backwardScores);
      putFloat(F4, normalizationFactorP, normalizationFactor);
      
      // This function does nothing if either # of states or chain length is
      // less than 1
      mod.crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, 0, chainLength);
      expect(F4[featureScoreP >> 2]).to.closeTo(1.6, 0.00001);
      expect(F4[(featureScoreP - 4) >> 2]).to.closeTo(0.0, 0.00001);
      expect(F4[(featureScoreP + 4) >> 2]).to.closeTo(-2.9, 0.00001);
      mod.crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, -1, chainLength);
      expect(F4[featureScoreP >> 2]).to.closeTo(1.6, 0.00001);
      expect(F4[(featureScoreP - 4) >> 2]).to.closeTo(0.0, 0.00001);
      expect(F4[(featureScoreP + 4) >> 2]).to.closeTo(-2.9, 0.00001);
      mod.crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, numberOfStates, 0);
      expect(F4[featureScoreP >> 2]).to.closeTo(1.6, 0.00001);
      expect(F4[(featureScoreP - 4) >> 2]).to.closeTo(0.0, 0.00001);
      expect(F4[(featureScoreP + 4) >> 2]).to.closeTo(-2.9, 0.00001);
      mod.crf_updateJointScores(featureScoreP, forwardScoreP,
        backwardScoreP, normalizationFactorP, numberOfStates, -1);
      expect(F4[featureScoreP >> 2]).to.closeTo(1.6, 0.00001);
      expect(F4[(featureScoreP - 4) >> 2]).to.closeTo(0.0, 0.00001);
      expect(F4[(featureScoreP + 4) >> 2]).to.closeTo(-2.9, 0.00001);
      
      mod.crf_updateJointScores(featureScoreP, forwardScoreP,
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
    
    it('computing marginal probabilities from joint in log-scale', function() {
      var i = 0;
      var numberOfStates = 2;
      var chainLength = 3;

      var LOG01 = log(0.1);
      var LOG02 = log(0.2);
      var LOG005 = log(0.05);

      // NaN is deliberately included here to test for ensuring that the
      // elements of these positions are not involved during computation.
      var jointInLog = [
        LOG01, LOG005, NaN, NaN,
        LOG005, LOG01, LOG01, LOG01,
        LOG01, LOG01, LOG02, LOG01
      ];
      
      /*
       * A table of marginal probabilities is
       * float[numberOfStates + 1][numberOfStates].
       * score[0][j] represents a marginal from the (hypothetical) initial state
       * to the state j. For i >= 1, score[i][j] represents a marginal from the
       * state (i - 1) to the state j.
       */
      var expectedMarginal = [
        0.1, 0.05,
        0.15, 0.2,
        0.3, 0.2
      ];
      
      var jointInLogP = 1000;
      var outP = 10000;
      
      putFloat(F4, jointInLogP, jointInLog);
      
      mod.crf_updateMarginalProbabilities(jointInLogP, numberOfStates,
        chainLength, outP);
        
      for (i = 0; i < numberOfStates * (numberOfStates + 1); i += 1) {
        expect(F4[outP >> 2]).to.closeTo(expectedMarginal[i], 0.00001);
        outP += 4;
      }
      expect(F4[outP >> 2]).to.closeTo(0.0, 0.00001);
    });

    it('resolving repeated indices of sparse vectors', function() {
      var inP = 1000;
      var outNzP = 2000;
      var outValueP = 10000;
      var outIndexP = 3000;
      var t = inP;
      
      U4[inP >> 2] = 8;
      inP += 4;
      F4[inP >> 2] = 0.5;
      inP += 4;

      U4[inP >> 2] = 10;
      inP += 4;
      F4[inP >> 2] = -2.5;
      inP += 4;

      U4[inP >> 2] = 10;
      inP += 4;
      F4[inP >> 2] = 1.5;
      inP += 4;

      U4[inP >> 2] = 4;
      inP += 4;
      F4[inP >> 2] = 3.5;
      inP += 4;

      mod.crf_uniqueAndZipSparseVector(0, t, outNzP, outValueP, outIndexP);
      expect(I4[outNzP >> 2]).to.equal(0);
      expect(I4[outIndexP >> 2]).to.equal(0);
      expect(F4[outValueP >> 2]).to.closeTo(0, 0.00001);

      mod.crf_uniqueAndZipSparseVector(1, t, outNzP, outValueP, outIndexP);
      expect(I4[outNzP >> 2]).to.equal(1);
      expect(I4[outIndexP >> 2]).to.equal(8);
      expect(F4[outValueP >> 2]).to.closeTo(0.5, 0.00001);
      
      mod.crf_uniqueAndZipSparseVector(4, t, outNzP, outValueP, outIndexP);
      expect(I4[outNzP >> 2]).to.equal(3);
      expect(I4[outIndexP >> 2]).to.equal(4);
      expect(F4[outValueP >> 2]).to.closeTo(3.5, 0.00001);
      outIndexP += 4;
      outValueP += 4;
      expect(I4[outIndexP >> 2]).to.equal(8);
      expect(F4[outValueP >> 2]).to.closeTo(0.5, 0.00001);
      outIndexP += 4;
      outValueP += 4;
      expect(I4[outIndexP >> 2]).to.equal(10);
      expect(F4[outValueP >> 2]).to.closeTo(-1.0, 0.00001);
      outIndexP += 4;
      outValueP += 4;
      expect(I4[outIndexP >> 2]).to.equal(0);
      expect(F4[outValueP >> 2]).to.closeTo(0.0, 0.00001);
    });
  });
});