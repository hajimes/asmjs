import logsumexp from '../../math/logsumexpFloat32';

export default function updateNormalizationFactor(forwardScoreP,
    numberOfStates, chainLength, outP) {
  /*
   * Type annotations
   */
  forwardScoreP = forwardScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var t = 0;

  /*
   * Main
   */
  if ((chainLength | 0) <= 0) {
    return;
  }
  
  t = imul(numberOfStates << 2, chainLength - 1);
  forwardScoreP = (forwardScoreP + t) | 0;

  F4[outP >> 2] = +logsumexp(forwardScoreP, numberOfStates);
}