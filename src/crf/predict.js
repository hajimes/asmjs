import sumInt32 from '../math/sumInt32';
import featureHashingSequence from './featureHashingSequence';
import updateStateScores from './updateStateScores';
import updateFeatureScores from './updateFeatureScores';
import updateForwardScores from './updateForwardScores';
import updateNormalizationFactor from './updateNormalizationFactor';
import sufferLoss from './sufferLoss';
import viterbi from './viterbi';

export default function predict(instanceP, numberOfStates, stateDimension,
    weightP, tmpP, lossP, predictionP, predictionScoreP) {
  /*
   * Type annotations
   */
  instanceP = instanceP | 0;
  numberOfStates = numberOfStates | 0;
  stateDimension = stateDimension | 0;
  weightP = weightP | 0;
  tmpP = tmpP | 0;
  lossP = lossP | 0;
  predictionP = predictionP | 0;
  predictionScoreP = predictionScoreP | 0;

  /*
   * Local variables
   */
  var nzP = 0;
  var valueP = 0;
  var indexP = 0;

  var chainLength = 0;
  var correctPathP = 0;
  
  var totalNz = 0;
  
  var stateScoreTableSize = 0;
  var transitionScoreTableSize = 0;
  var featureScoreTableSize = 0;
  var gradientMaxSize = 0;

  var featureHashedValueP = 0;
  var featureHashedIndexP = 0;

  var stateScoreP = 0;
  var biasScoreP = 0;
  var transitionScoreP = 0;

  var featureScoreP = 0;
  var forwardScoreP = 0;
  var normalizationFactorP = 0;
  
  var biasIndex = 0;
  var transitionIndex = 0;
  
  /*
   * Main
   */
  // retrieve data
  chainLength = I4[(instanceP + 4) >> 2] | 0;
  nzP = I4[(instanceP + 12) >> 2] | 0;
  valueP = I4[(instanceP + 16) >> 2] | 0;
  indexP = I4[(instanceP + 20) >> 2] | 0;
  correctPathP = I4[(instanceP + 24) >> 2] | 0;
  
  totalNz = sumInt32(nzP, chainLength) | 0;
  
  stateScoreTableSize = imul(chainLength, numberOfStates);
  transitionScoreTableSize = imul(numberOfStates + 1, numberOfStates);
  featureScoreTableSize = imul(stateScoreTableSize, numberOfStates);
  gradientMaxSize = 
    (imul(totalNz, transitionScoreTableSize) + 
    imul(featureScoreTableSize, 2)) | 0;
  
  biasIndex = (stateDimension + transitionScoreTableSize) | 0;
  transitionIndex = stateDimension;
  
  // memory allocation
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
  
  normalizationFactorP = tmpP;
  tmpP = (tmpP + 4) | 0;
  
  // main routine
  featureHashingSequence(nzP, valueP, indexP, numberOfStates, chainLength,
    stateDimension, featureHashedValueP, featureHashedIndexP);

  updateStateScores(nzP, featureHashedValueP, featureHashedIndexP, weightP,
    numberOfStates, chainLength, stateScoreP);

  updateFeatureScores(biasScoreP, transitionScoreP,
    stateScoreP, numberOfStates, chainLength, featureScoreP);

  // we reuse the regions allocated for state scores here,
  // since they are no longer needed
  updateForwardScores(featureScoreP, numberOfStates,
    chainLength, stateScoreP, forwardScoreP);
  updateNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength, normalizationFactorP);

  if ((correctPathP | 0) != 0) {
    sufferLoss(featureScoreP, normalizationFactorP, correctPathP,
      numberOfStates, chainLength, lossP);      
  }
    
  viterbi(featureScoreP, numberOfStates, chainLength, predictionP);
  
  F4[predictionP >> 2] = (+F4[predictionP >> 2]) -
    (+F4[normalizationFactorP >> 2]);
}