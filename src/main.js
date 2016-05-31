import maxFloat32 from './math/maxFloat32';
import sumFloat32 from './math/sumFloat32';
import sumInt32 from './math/sumInt32';
import logsumexp from './math/logsumexpFloat32';
import * as ufmap from './util/ufmap.js';
import hash from './util/MurmurHash3_x86_32';
import math_sparse_susdot from './math/sparse/susdot';
import math_sparse_sort from './math/sparse/sort';
import math_sparse_unique from './math/sparse/unique';
import convertUtf16toUtf8 from './unicode/convertUtf16toUtf8';
import convertUtf8toUtf16 from './unicode/convertUtf8toUtf16';
import isLittleEndian from './util/isLittleEndian';
import crf_featureHashing from './crf/featureHashing';
import crf_featureHashingSequence from './crf/featureHashingSequence';
import crf_updateFeatureScores from './crf/updateFeatureScores';
import crf_updateForwardScores from './crf/updateForwardScores';
import crf_updateBackwardScores from './crf/updateBackwardScores';
import crf_updateNormalizationFactor from './crf/updateNormalizationFactor';
import crf_updateJointScores from './crf/updateJointScores';
import crf_updateGradient from './crf/updateGradient';
import crf_trainOnline from './crf/trainOnline';
import crf_sufferLoss from './crf/sufferLoss';
import compareInt32 from './util/compareInt32';
import compareUint32 from './util/compareUint32';
import compareSparseVectorElement from './util/compareSparseVectorElement';
import qsortBM from './util/qsortBM';
import memmove from './util/memmove.js';

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
  ufmap_create: ufmap.ufmap_create,
  ufmap_has: ufmap.ufmap_has,
  ufmap_add: ufmap.ufmap_add,
  ufmap_get: ufmap.ufmap_get,
  ufmap_size: ufmap.ufmap_size,
  maxFloat32: maxFloat32,
  sumFloat32: sumFloat32,
  sumInt32: sumInt32,
  hash: hash,
  logsumexp: logsumexp,
  math_sparse_susdot: math_sparse_susdot,
  math_sparse_sort: math_sparse_sort,
  math_sparse_unique: math_sparse_unique,
  uc_convertUtf16toUtf8: convertUtf16toUtf8,
  uc_convertUtf8toUtf16: convertUtf8toUtf16,
  crf_trainOnline: crf_trainOnline,
  crf_sufferLoss: crf_sufferLoss,
  crf_featureHashing: crf_featureHashing,
  crf_featureHashingSequence: crf_featureHashingSequence,
  crf_updateFeatureScores: crf_updateFeatureScores,
  crf_updateForwardScores: crf_updateForwardScores,
  crf_updateBackwardScores: crf_updateBackwardScores,
  crf_updateNormalizationFactor: crf_updateNormalizationFactor,
  crf_updateJointScores: crf_updateJointScores,
  crf_updateGradient: crf_updateGradient,
  isLittleEndian: isLittleEndian,
  compareInt32: compareInt32,
  compareUint32: compareUint32,
  qsortBM: qsortBM,
  memmove: memmove
};

export {EXPORTS};
