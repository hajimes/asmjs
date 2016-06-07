import sumInt32 from '../../math/sumInt32';
import adagradUpdateLazy from '../adagrad/updateLazy';
import adagradUpdateLazyAt from '../adagrad/updateLazyAt';
import adagradUpdateTemporary from '../adagrad/updateTemporary';
import featureHashingSequence from './featureHashingSequence';
import updateStateScores from './updateStateScores';
import updateFeatureScores from './updateFeatureScores';
import updateForwardScores from './updateForwardScores';
import updateBackwardScores from './updateBackwardScores';
import updateNormalizationFactor from './updateNormalizationFactor';
import sufferLoss from './sufferLoss';
import updateJointScores from './updateJointScores';
import updateGradient from './updateGradient';

/**
 * Each instance is structured as
 *
 * +---+---+---+---+---+---+---+
 * |IID|PLN|STP|NZP|VLP|IND|CRP|
 * +---+---+---+---+---+---+---|
 *
 * IID: instance id
 * PLN: the length of a path
 * STP: byte offset to textual information on features. negative if not exsting
 * NZP: byte offset to NZS
 * VLP: byte offset to VALUES
 * IND: byte offset to INDICES
 * CRP: byte offset to the supervisory path; negataive if not a training datum
 *
 * NZS: NZP[i] contains the number of non-zero elements at the position i
 * VALUES: float32[PLN][NZS[i]] for i in [0, PLN)
 * INDICES: int32[PLN][NZS[i]] for i in [0, PLN)
 * CRP: int32[PLN]
 *
 * To sum up, each instance header occupies 28 bytes
 */
export default function trainOnline(instanceP, numberOfStates, dimension, round,
  foiP, soiP, weightP, delta, eta, lambda, tmpP, lossP) {
  /*
   * Type annotations
   */
  instanceP = instanceP | 0;
  numberOfStates = numberOfStates | 0;
  dimension = dimension | 0;
  round = round | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;
  weightP = weightP | 0;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;
  tmpP = tmpP | 0;
  lossP = lossP | 0;
  
  /*
   * Local variables
   */
  var i = 0;

  var nz = 0;
  var nzP = 0;
  var totalNz = 0;
  var chainLength = 0;
  var valueP = 0;
  var indexP = 0;
  var correctPathP = 0;

  var featureHashedValueP = 0;
  var featureHashedIndexP = 0;

  var biasScoreP = 0;
  var transitionScoreP = 0;
  var stateScoreP = 0;
  var featureScoreP = 0;
  var forwardScoreP = 0;
  var backwardScoreP = 0;
  var normalizationFactorP = 0;

  var gradientNzP = 0;
  var gradientValueP = 0;
  var gradientIndexP = 0;
  
  var stateScoreTableSize = 0;
  var transitionScoreTableSize = 0;
  var featureScoreTableSize = 0;
  var gradientMaxSize = 0;
  
  var biasIndex = 0;
  var transitionIndex = 0;

  var tmpValueP = 0;
  var tmpIndexP = 0;
  
  /*
   * Main
   */
  
  //
  // Memory allocation
  //
    
  // Uses the path length of an instance as a Markov chain length
  chainLength = I4[(instanceP + 4) >> 2] | 0;
  nzP = I4[(instanceP + 12) >> 2] | 0;
  valueP = I4[(instanceP + 16) >> 2] | 0;
  indexP = I4[(instanceP + 20) >> 2] | 0;
  correctPathP = I4[(instanceP + 24) >> 2] | 0;
  
  totalNz = sumInt32(nzP, chainLength) | 0;
  
  stateScoreTableSize = imul(chainLength, numberOfStates);
  transitionScoreTableSize = (imul(numberOfStates + 1, numberOfStates) +
    numberOfStates) | 0;
  featureScoreTableSize = imul(stateScoreTableSize, numberOfStates);
  gradientMaxSize = 
    (imul(totalNz, transitionScoreTableSize) + 
    imul(featureScoreTableSize, 2)) | 0;

  biasIndex = (dimension + transitionScoreTableSize) | 0;
  transitionIndex = dimension;

  // We only need (imul(totalNz, numberOfStates) << 2) bytes at feature hashing
  // but we allocate slightly larger bytes so that later the space can be used
  // as an output space for the gradient calculation.
  featureHashedValueP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;
  
  featureHashedIndexP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;

  biasScoreP = (weightP + (biasIndex << 2)) | 0;
  transitionScoreP = (weightP + (transitionIndex << 2)) | 0;

  stateScoreP = tmpP;
  tmpP = (tmpP + (stateScoreTableSize << 2)) | 0;

  featureScoreP = tmpP;
  tmpP = (tmpP + (featureScoreTableSize << 2)) | 0;

  forwardScoreP = tmpP;
  tmpP = (tmpP + (stateScoreTableSize << 2)) | 0;

  backwardScoreP = tmpP;
  tmpP = (tmpP + (stateScoreTableSize << 2)) | 0;
  
  normalizationFactorP = tmpP;
  tmpP = (tmpP + 4) | 0;

  tmpValueP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;

  tmpIndexP = tmpP;
  tmpP = (tmpP + (gradientMaxSize << 2)) | 0;
  
  // reuse these spaces
  // gradientNzP = normalizationFactorP;
  gradientValueP = featureHashedValueP;
  gradientIndexP = featureHashedIndexP;
  gradientNzP = tmpP;
  tmpP = (tmpP + 4) | 0;

  //
  // Main routine
  //
  featureHashingSequence(nzP, valueP, indexP, numberOfStates, chainLength,
    dimension, featureHashedValueP, featureHashedIndexP);
    
  // update bias and transition scores positions
  for (i = 0; (i | 0) < ((transitionScoreTableSize + 1) | 0); i = (i + 1) | 0) {
    adagradUpdateLazyAt((i + dimension) | 0, foiP, soiP, weightP,
      +(round | 0), delta, eta, lambda);
  }

  adagradUpdateLazy(imul(totalNz, numberOfStates), featureHashedIndexP, foiP, soiP, weightP,
    +(round | 0), delta, eta, lambda);

  updateStateScores(nzP, featureHashedValueP, featureHashedIndexP, weightP,
    numberOfStates, chainLength, stateScoreP);

  updateFeatureScores(biasScoreP, transitionScoreP,
    stateScoreP, numberOfStates, chainLength, featureScoreP);

  // we reuse the regions allocated for state scores here,
  // since they are no longer needed
  updateForwardScores(featureScoreP, numberOfStates,
    chainLength, stateScoreP, forwardScoreP);
  updateBackwardScores(featureScoreP, numberOfStates,
    chainLength, stateScoreP, backwardScoreP);
  updateNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength, normalizationFactorP);

  sufferLoss(featureScoreP, normalizationFactorP, correctPathP,
    numberOfStates, chainLength, lossP);

  updateJointScores(featureScoreP, forwardScoreP,
    backwardScoreP, normalizationFactorP, numberOfStates, chainLength);

  updateGradient(nzP, featureHashedValueP, featureHashedIndexP,
    biasScoreP, biasIndex,
    transitionScoreP, transitionIndex,
    featureScoreP, correctPathP,
    numberOfStates, chainLength,
    tmpValueP, tmpIndexP,
    gradientNzP, gradientValueP, gradientIndexP);
  nz = I4[gradientNzP >> 2] | 0;
  adagradUpdateTemporary(nz, gradientValueP, gradientIndexP, foiP, soiP);
}