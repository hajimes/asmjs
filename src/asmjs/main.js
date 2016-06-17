/* jshint unused: false */
import bit_deBruijnSelect from './bit/deBruijnSelect';
import bit_deBruijnSelectInit from './bit/deBruijnSelectInit';
import bit_eliasFano from './bit/eliasFano';
import bit_eliasFanoByteSize from './bit/eliasFanoByteSize';
import bit_nextPow2 from './bit/nextPow2';
import bit_popcount from './bit/popcount';
import bit_readBits from './bit/readBits';

import maxFloat32 from './math/maxFloat32';
import sumFloat32 from './math/sumFloat32';
import sumInt32 from './math/sumInt32';
import logsumexp from './math/logsumexpFloat32';

import learn_adagrad_updateLazyRange from './learn/adagrad/updateLazyRange';
import learn_crf_featureHashing from './learn/crf/featureHashing';
import learn_crf_featureHashingSequence from
  './learn/crf/featureHashingSequence';
import learn_crf_updateFeatureScores from './learn/crf/updateFeatureScores';
import learn_crf_updateForwardScores from './learn/crf/updateForwardScores';
import learn_crf_updateBackwardScores from './learn/crf/updateBackwardScores';
import learn_crf_updateNormalizationFactor from
  './learn/crf/updateNormalizationFactor';
import learn_crf_updateJointScores from './learn/crf/updateJointScores';
import learn_crf_updateGradient from './learn/crf/updateGradient';
import learn_crf_trainOnline from './learn/crf/trainOnline';
import learn_crf_predict from './learn/crf/predict';
import learn_crf_sufferLoss from './learn/crf/sufferLoss';
import learn_crf_getByteSize from './learn/crf/getByteSize';
import learn_crf_viterbi from './learn/crf/viterbi';

import math_l0 from './math/l0';
import math_rounding from './math/rounding';

import math_sparse_susdot from './math/sparse/susdot';
import math_sparse_sort from './math/sparse/sort';
import math_sparse_unique from './math/sparse/unique';

import math_sparse_builder_create from './math/sparse/builder/create';
import math_sparse_builder_add from './math/sparse/builder/add';
import math_sparse_builder_size from './math/sparse/builder/size';
import math_sparse_builder_build from './math/sparse/builder/build';
import math_sparse_builder_byteLength from './math/sparse/builder/byteLength';

import convertUtf16toUtf8 from './unicode/convertUtf16toUtf8';
import convertUtf8toUtf16 from './unicode/convertUtf8toUtf16';

import isLittleEndian from './util/isLittleEndian';
import compareInt32 from './util/compareInt32';
import compareUint32 from './util/compareUint32';
import compareSparseVectorElement from './util/compareSparseVectorElement';
import qsortBM from './util/qsortBM';
import memmove from './util/memmove.js';
import * as ufmap from './util/ufmap.js';
import hash from './util/MurmurHash3_x86_32';
import util_base64Decode from './util/base64Decode';
import util_base64DecodeLength from './util/base64DecodeLength';
import util_base64Encode from './util/base64Encode';
import util_base64EncodeLength from './util/base64EncodeLength';

/*
 * Definition of function tables.
 * The size of a table must be a power of 2.
 * In a valid asm.js module, this definition must come after
 * function definitions and before its return statement.
 *
 * The name of this variable will be changed into CMP_FUNCTION_TABLE
 * during gulp building phase.
 */
var _CMP_FUNCTION_TABLE = [compareInt32, compareUint32, compareSparseVectorElement, compareInt32];

/*
 * Definition of exported functions
 */
var EXPORTS = {
  bit_deBruijnSelect: bit_deBruijnSelect,
  bit_deBruijnSelectInit: bit_deBruijnSelectInit,
  bit_eliasFano: bit_eliasFano,
  bit_eliasFanoByteSize: bit_eliasFanoByteSize,
  bit_nextPow2: bit_nextPow2,
  bit_popcount: bit_popcount,
  bit_readBits: bit_readBits,

  learn_adagrad_updateLazyRange: learn_adagrad_updateLazyRange,
  learn_crf_trainOnline: learn_crf_trainOnline,
  learn_crf_sufferLoss: learn_crf_sufferLoss,
  learn_crf_featureHashing: learn_crf_featureHashing,
  learn_crf_featureHashingSequence: learn_crf_featureHashingSequence,
  learn_crf_updateFeatureScores: learn_crf_updateFeatureScores,
  learn_crf_updateForwardScores: learn_crf_updateForwardScores,
  learn_crf_updateBackwardScores: learn_crf_updateBackwardScores,
  learn_crf_updateNormalizationFactor: learn_crf_updateNormalizationFactor,
  learn_crf_updateJointScores: learn_crf_updateJointScores,
  learn_crf_updateGradient: learn_crf_updateGradient,
  learn_crf_getByteSize: learn_crf_getByteSize,
  learn_crf_viterbi: learn_crf_viterbi,
  learn_crf_predict: learn_crf_predict,
  isLittleEndian: isLittleEndian,
  
  math_rounding: math_rounding,
  math_sparse_susdot: math_sparse_susdot,
  math_sparse_sort: math_sparse_sort,
  math_sparse_unique: math_sparse_unique,
  
  math_sparse_builder_create : math_sparse_builder_create,
  math_sparse_builder_add : math_sparse_builder_add,
  math_sparse_builder_size : math_sparse_builder_size,
  math_sparse_builder_build : math_sparse_builder_build,
  math_sparse_builder_byteLength : math_sparse_builder_byteLength,
  
  maxFloat32: maxFloat32,
  sumFloat32: sumFloat32,
  sumInt32: sumInt32,
  logsumexp: logsumexp,
  math_l0: math_l0,

  ufmap_create: ufmap.ufmap_create,
  ufmap_has: ufmap.ufmap_has,
  ufmap_add: ufmap.ufmap_add,
  ufmap_get: ufmap.ufmap_get,
  ufmap_size: ufmap.ufmap_size,

  hash: hash,
  uc_convertUtf16toUtf8: convertUtf16toUtf8,
  uc_convertUtf8toUtf16: convertUtf8toUtf16,
  compareInt32: compareInt32,
  compareUint32: compareUint32,
  qsortBM: qsortBM,
  memmove: memmove,
  util_base64Decode: util_base64Decode,
  util_base64DecodeLength: util_base64DecodeLength,
  util_base64Encode: util_base64Encode,
  util_base64EncodeLength: util_base64EncodeLength
};

export {EXPORTS};
