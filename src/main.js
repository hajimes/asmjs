import maxFloat32 from './math/maxFloat32'
import logsumexp from './math/logsumexpFloat32'
import * as ufmap from './util/ufmap.js'
import hash from './util/MurmurHash3_x86_32'
import susdot from './math/susdot'
import convertUtf16toUtf8 from './unicode/convertUtf16toUtf8'
import convertUtf8toUtf16 from './unicode/convertUtf8toUtf16'
import isLittleEndian from './util/isLittleEndian'
import crf_featureHashing from './crf/featureHashing'
import crf_featureHashingSequence from './crf/featureHashingSequence'
import crf_updateForwardScores from './crf/updateForwardScores'
import crf_getNormalizationFactor from './crf/getNormalizationFactor'
import crf_trainOnline from './crf/trainOnline'

var EXPORTS = {
  ufmap_create: ufmap.ufmap_create,
  ufmap_has: ufmap.ufmap_has,
  ufmap_add: ufmap.ufmap_add,
  ufmap_get: ufmap.ufmap_get,
  ufmap_size: ufmap.ufmap_size,
  maxFloat32: maxFloat32,
  hash: hash,
  logsumexp: logsumexp,
  vec_susdot: susdot,  
  uc_convertUtf16toUtf8: convertUtf16toUtf8,
  uc_convertUtf8toUtf16: convertUtf8toUtf16,
  crf_trainOnline: crf_trainOnline,
  crf_featureHashing: crf_featureHashing,
  crf_featureHashingSequence: crf_featureHashingSequence,
  crf_updateForwardScores: crf_updateForwardScores,
  crf_getNormalizationFactor: crf_getNormalizationFactor,
  isLittleEndian: isLittleEndian
};

export {EXPORTS}