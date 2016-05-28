import logsumexp from '../math/logsumexpFloat32'

export default function getNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength) {
  /*
   * Type annotations
   */
  forwardScoreP = forwardScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;

  /*
   * Local variables
   */
  var t = 0;

  /*
   * Main
   */
  if ((chainLength | 0) <= 0) {
    return 0.0;
  }
  
  t = imul(numberOfStates << 2, chainLength - 1);
  forwardScoreP = (forwardScoreP + t) | 0;

  return +logsumexp(forwardScoreP, numberOfStates);
}