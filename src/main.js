import maxFloat32 from './math/maxFloat32';
import sumFloat32 from './math/sumFloat32';
import sumInt32 from './math/sumInt32';
import logsumexp from './math/logsumexpFloat32';
import * as ufmap from './util/ufmap.js';
import hash from './util/MurmurHash3_x86_32';
import susdot from './math/susdot';
import convertUtf16toUtf8 from './unicode/convertUtf16toUtf8';
import convertUtf8toUtf16 from './unicode/convertUtf8toUtf16';
import isLittleEndian from './util/isLittleEndian';
import crf_featureHashing from './crf/featureHashing';
import crf_featureHashingSequence from './crf/featureHashingSequence';
import crf_updateFeatureScores from './crf/updateFeatureScores';
import crf_updateForwardScores from './crf/updateForwardScores';
import crf_updateBackwardScores from './crf/updateBackwardScores';
import crf_getNormalizationFactor from './crf/getNormalizationFactor';
import crf_updateJointScores from './crf/updateJointScores';
import crf_trainOnline from './crf/trainOnline';
import crf_updateMarginalProbabilities from './crf/updateMarginalProbabilities';
import crf_uniqueAndZipSparseVector from './crf/uniqueAndZipSparseVector';
import compareInt32 from './util/compareInt32';
import compareUint32 from './util/compareUint32';
import qsortBM from './util/qsortBM';

/*
 * Definition of function tables.
 * The size of a table must be a power of 2.
 * In a valid asm.js module, this definition must come after
 * function definitions and before its return statement.
 *
 * The name of this variable will be changed into CMP_FUNCTION_TABLE
 * during gulp building phase.
 */
var _CMP_FUNCTION_TABLE = [compareInt32, compareUint32];

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
  vec_susdot: susdot,  
  uc_convertUtf16toUtf8: convertUtf16toUtf8,
  uc_convertUtf8toUtf16: convertUtf8toUtf16,
  crf_trainOnline: crf_trainOnline,
  crf_featureHashing: crf_featureHashing,
  crf_featureHashingSequence: crf_featureHashingSequence,
  crf_updateFeatureScores: crf_updateFeatureScores,
  crf_updateForwardScores: crf_updateForwardScores,
  crf_updateBackwardScores: crf_updateBackwardScores,
  crf_updateMarginalProbabilities: crf_updateMarginalProbabilities,
  crf_getNormalizationFactor: crf_getNormalizationFactor,
  crf_updateJointScores: crf_updateJointScores,
  crf_uniqueAndZipSparseVector: crf_uniqueAndZipSparseVector,
  isLittleEndian: isLittleEndian,
  compareInt32: compareInt32,
  compareUint32: compareUint32,
  qsortBM: qsortBM
};

export {EXPORTS}