import sumInt32 from '../math/sumInt32';
import adagradUpdateLazy from './adagradUpdateLazy';
import adagradUpdateLazyAt from './adagradUpdateLazyAt';
import adagradUpdateTemp from './adagradUpdateTemp';
import featureHashingSequence from './featureHashingSequence';
import updateStateScores from './updateStateScores';
import updateFeatureScores from './updateFeatureScores';
import updateForwardScores from './updateForwardScores';
import updateBackwardScores from './updateBackwardScores';
import getNormalizationFactor from './getNormalizationFactor';
import updateJointScores from './updateJointScores';

/**
 * Each instance is structured as
 *
 * +---+---+---+---+---+---+
 * |IID|PLN|STP|NZP|VLP|IXP|
 * +---+---+---+---+---+---+
 *
 * IID: instance id
 * PLN: uint32, the length of a path
 * STP: byte offset to textual information about features. 0 if not exsting
 * NZP: byte offset to NZS
 * VLP: byte offset to VALUES
 * IND: byte offset to INDICES
 *
 * NZS: NZP[i] contains the number of non-zero elements at the position i
 * VALUES: float32[PLN][NZS[i]] for i in [0, PLN)
 * INDICES: uint32[PLN][NZS[i]] for i in [0, PLN)
 *
 * Each instance header occupies 24 bytes
 */
// Incomplete
export default function trainOnline(numberOfStates, dimension, round,
    foiP, soiP, weightP,
    delta, eta, lambda,
    instanceP, tmpP, hashMapP) {
  /*
   * Type annotations
   */
  numberOfStates = numberOfStates | 0;
  dimension = dimension | 0;
  round = round | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;
  weightP = weightP | 0;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;
  instanceP = instanceP | 0;
  tmpP = tmpP | 0;
  hashMapP = hashMapP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var p = 0;
  var nzP = 0;
  var totalNz = 0;
  var chainLength = 0;
  var valueP = 0;
  var indexP = 0;
  var outValueP = 0;
  var outIndexP = 0;
  var biasScoreP = 0;
  var transitionScoreP = 0;
  var transitionScoreTableSize = 0;
  var stateScoreP = 0;
  var featureScoreP = 0;
  var featureScoreTableSize = 0;
  var forwardScoreP = 0;
  var backwardScoreP = 0;
  var normalizationFactor = 0.0;
  var gradientNzP = 0;
  var gradientValueP = 0;
  var gradientIndexP = 0;
  
  /*
   * Main
   */
  
  //
  // Memory allocation
  // outValue: MAX_SPARSE_SIZE (bytes)
  // outIndex: MAX_SPARSE_SIZE (bytes)
  // stateScores: (chainLength * numberOfState * 4) bytes
  // featureScores/jointScores: (chainLength * (numberOfStates ^ 2) * 4) 
  // forwardScores: (chainLength * numberOfStates * 4) bytes
  // backwardScores: (chainLength * numberOfStates * 4) bytes
  // gradient sparse vector: (4 + ... + ...) bytes
  // temporary working space: (numberOfStates * 4)
  p = tmpP;
  outValueP = p;
  p = (p + 16384) | 0; // allocate 16kb
  outIndexP = p;
  p = (p + 16384) | 0; // allocate 16kb
  
  // Uses the first element of a weight vector as a bias term
  biasScoreP = weightP;

  transitionScoreP = (weightP + 4) | 0;
  transitionScoreTableSize = imul(numberOfStates + 1, numberOfStates);
  stateScoreP = (weightP + 4 + (transitionScoreTableSize << 2)) | 0;  
  
  // Uses the path length of an instance as a Markov chain length
  chainLength = U4[(instanceP + 4) >> 2] | 0;
  valueP = U4[(instanceP + 16) >> 2] | 0;
  indexP = U4[(instanceP + 20) >> 2] | 0;
  nzP = U4[(instanceP + 12) >> 2] | 0;
  
  totalNz = sumInt32(nzP, chainLength) | 0;
  
  featureScoreTableSize = (imul(chainLength, numberOfStates),
    numberOfStates);

  featureScoreP = (outIndexP + (featureScoreTableSize << 2)) | 0;
  
  //
  // main
  //
  featureHashingSequence(nzP, valueP, indexP,
    numberOfStates, chainLength, dimension, outValueP, outIndexP);
    
  // update bias and transition scores positions
  for (i = 0; (i | 0) < ((featureScoreTableSize + 1) | 0);
      i = (i + 1) | 0) {
    adagradUpdateLazyAt(i, foiP, soiP, weightP,
      +(round | 0), delta, eta, lambda);
  }
  adagradUpdateLazy(totalNz, indexP, foiP, soiP, weightP,
    +(round | 0), delta, eta, lambda);

  updateStateScores(nzP, valueP, indexP, weightP,
    numberOfStates, chainLength, stateScoreP);
  updateFeatureScores(biasScoreP, transitionScoreP,
    stateScoreP, numberOfStates, chainLength, featureScoreP);
  updateForwardScores(featureScoreP, numberOfStates,
    chainLength, tmpP, forwardScoreP);
  updateBackwardScores(featureScoreP, numberOfStates,
    chainLength, tmpP, backwardScoreP);
  normalizationFactor = +getNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength);
  updateJointScores(featureScoreP, forwardScoreP, backwardScoreP,
    numberOfStates, chainLength, normalizationFactor);
  //updateMarginalScores();
  // updateGradient();
  adagradUpdateTemp(gradientNzP, gradientValueP, gradientIndexP, foiP, soiP);
  // crf_sufferLoss();
}