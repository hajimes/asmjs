/**
 * Returns the byte size used by this CRF implementation during training.
 * This value does not include weight vector and other denses.
 */
export default function getByteSize(numberOfStates,
    maxChainLength, maxTotalNz) {
  /*
   * Type annotations
   */
  numberOfStates = numberOfStates | 0;
  maxChainLength = maxChainLength | 0;
  maxTotalNz = maxTotalNz | 0;
  
  /*
   * Local variables
   */
  var result = 0;
  
  var stateScoreTableSize = 0;
  var transitionScoreTableSize = 0;
  var featureScoreTableSize = 0;
  var gradientMaxSize = 0;
  
  /*
   * Main
   */
  stateScoreTableSize = imul(maxChainLength, numberOfStates);
  transitionScoreTableSize = (imul(numberOfStates + 1, numberOfStates) +
    numberOfStates) | 0;
  featureScoreTableSize = imul(stateScoreTableSize, numberOfStates);
  gradientMaxSize = (
    imul(maxTotalNz, numberOfStates) + // state features
    imul(maxChainLength, transitionScoreTableSize) + // transition features
    1 // bias term
  ) | 0;
  
  // feature hashed values
  result = (result + (gradientMaxSize << 2)) | 0;

  // feature hashed indices
  result = (result + (gradientMaxSize << 2)) | 0;

  // state scores
  result = (result + (stateScoreTableSize << 2)) | 0;

  // feature scores
  result = (result + (featureScoreTableSize << 2)) | 0;

  // forward scores
  result = (result + (stateScoreTableSize << 2)) | 0;

  // backward scores
  result = (result + (stateScoreTableSize << 2)) | 0;

  // normalization factor
  result = (result + 4) | 0;

  // tmp vec values
  result = (result + (gradientMaxSize << 2)) | 0;

  // tmp vec indices
  result = (result + (gradientMaxSize << 2)) | 0;
  
  return result | 0;
}