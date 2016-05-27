describe('This handwritten asm.js module', function() {
  'use strict';

  var chai = {};
  var expect = {};
  var _ = {};

  var myAsmjsModule = {};

  var heap = {};
  var U1 = {};
  var U2 = {};
  var U4 = {};
  var F4 = {};
  var mod = {};
  var root = {};
  
  function putUint32(u4, p, uint32s) {
    var i = 0;
    
    for (i = 0; i < uint32s.length; i += 1) {
      u4[(p + (i << 2)) >> 2] = uint32s[i];
    }
  }
  
  function putFloat(f4, p, floats) {
    var i = 0;
    
    for (i = 0; i < floats.length; i += 1) {
      f4[(p + (i << 2)) >> 2] = floats[i];
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
  
  describe('has math functions', function() {
    it('for calculating the maximum value in float32s', function() {
      F4[25] = -3.0;
      F4[26] = 1.0;
      F4[27] = 3.0;
      
      expect(mod.maxFloat32(25 << 2, 1)).to.closeTo(-3.0, 0.000001);
      expect(mod.maxFloat32(25 << 2, 2)).to.closeTo(1.0, 0.000001);
      expect(mod.maxFloat32(25 << 2, 3)).to.closeTo(3.0, 0.000001);
    });

    it('for logsumexp of float32s', function() {
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
  });
  
  describe('handles unicode:', function() {
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
    function putASCII(str, U1, pos) {
      var i = 0;
      
      for (i = 0; i < str.length; i += 1) {
        U1[pos + i] = (str.charCodeAt(i) & 0xff);
      }
    }
    
    it('MurmurHash3_x86_32', function() {
      // Test vectors suggested by Ian Boyd in 2015
      // See http://stackoverflow.com/a/31929528
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
      
      x = [1.0, 0.5, -2.0, 0.5, -1.0];
      index = [2, 0, 42, 100, 255];
      putFloat(F4, xP, x);
      putUint32(U4, indexP, index);

      mod.crf_featureHashing(x.length,
        xP, indexP, 0, 0x100, outValueP, outIndexP);
      for (i = 0; i < x.length; i += 1) {
        expect(U4[(outIndexP + i << 2) >> 2]).to.be.within(0, 0xff);
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
    
    it('forward score calculation', function() {
      var i = 0;

      var a = 1.0;
      var b = -1.0;
      
      var featureScores = [
        a, 2.0, b, 0.5,
        1.0, -1.0, 1.0, 1.0,
        1.0, 1.0, -1.0, 1.0,        
      ];
      var numberOfStates = 2;
      var chainLength = 3;
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

      // The first (numberOfStates) bytes are the same as 
      // featureScores[0][i][0] for i in [0, numberOfStates)
      expect(F4[outP >> 2]).to.equal(a);
      outP += 4;
      expect(F4[outP >> 2]).to.equal(b);
      outP += 4;
      
      // Check if resulting values are in the range of ordinary numbers
      for (i = numberOfStates; i < numberOfStates * chainLength; i += 1) {
        expect(_.isNumber(F4[outP >> 2])).to.be.true;
        outP += 4;
      }
      
      // The method uses exactly (numberOfStates * chainLength) bytes
      // so bytes after that should remain 0
      expect(F4[outP >> 2]).to.equal(0.0);

      mod.crf_updateForwardScores(inP, numberOfStates, chainLength, tmpP, outP);

    });
    
    it('computing a normalization factor', function() {
      var forwardScores = [1.0, 2.0, -1.0, 0.5, 1.0, -1.0];
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
  });
});