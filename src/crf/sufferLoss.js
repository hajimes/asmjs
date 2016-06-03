/**
 * Suffers loss, or the negative log-likelihood.
 *
 * Exactly 4-bytes will be written into lossP.
 *
 * @param {int} featureScoreP
 * @param {int} normalizationFactorP
 * @param {int} correctPathP - byte offset to a correct path
 * @param {int} numberOfStates - number of the states in this Markov chain
 * @param {int} chainLength - length of this Markov chain
 * @param {int} lossP - byte offset to which the loss will be written
 */
export default function sufferLoss(featureScoreP, normalizationFactorP,
  correctPathP, numberOfStates, chainLength, lossP) {
  /*
   * Type annotations
   */
  featureScoreP = featureScoreP | 0;
  normalizationFactorP = normalizationFactorP | 0;
  correctPathP = correctPathP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  lossP = lossP | 0;

  /*
   * Local variables
   */
  var i = 0;
  var t = 0.0;
  var logLikelihood = 0.0;
  var offset = 0;
  var currentState = 0;
  var previousState = 0;
  var normalizationFactor = 0.0;
  var nossqb = 0;

  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }

  nossqb = imul(numberOfStates, numberOfStates) << 2;

  currentState = I4[correctPathP >> 2] | 0;
  t = +F4[(featureScoreP + (currentState << 2)) >> 2];
  logLikelihood = t;
  previousState = currentState;
  featureScoreP = (featureScoreP + nossqb) | 0;
  correctPathP = (correctPathP + 4) | 0;
  
  for (i = 1; (i | 0) < (chainLength | 0); i = (i + 1) | 0) {
    currentState = I4[correctPathP >> 2] | 0;
    offset = (imul(numberOfStates, previousState) + currentState) << 2;

    t = +F4[(featureScoreP + offset) >> 2];
    
    logLikelihood = logLikelihood + t;
    
    previousState = currentState;
    featureScoreP = (featureScoreP + nossqb) | 0;
    correctPathP = (correctPathP + 4) | 0;
  }
  
  normalizationFactor = +F4[normalizationFactorP >> 2];
  logLikelihood = logLikelihood - normalizationFactor;

  F4[lossP >> 2] = -logLikelihood;
}