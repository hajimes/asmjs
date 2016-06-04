import logsumexp from '../../math/logsumexpFloat32';

/**
 * Updates a table of backward scores.
 *
 * A table of backward scores is a 2-dimensional array
 * float[chainLength][numberOfStates].
 *
 * Exactly (chainLength * numberOfStates * 4) bytes will be written
 * into outP. Uses exactly (numberOfStates * 4) bytes at tmpP. They are not
 * required to be initialized to 0.
 *
 * @param {int} featureScoreP - byte offset to a table of feature scores
 * @param {int} numberOfStates - number of the states of a Markov chain
 * @param {int} chainLength - length of a Markov chain
 * @parma {int} tmpP - byte offset to working space
 * @param {int} outP - byte offset where the output will be written
 */
export default function updateBackwardScores(featureScoreP, numberOfStates,
    chainLength, tmpP, outP) {
  /*
   * Type annotations
   */
  featureScoreP = featureScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  tmpP = tmpP | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var time = 1;
  var cur = 0;
  var next = 0;
  var featureScore = 0.0;
  var nextScore = 0.0;
  var score = 0.0;
  var p = 0;
  var nextP = 0;
  var nextPSave = 0;
  var t = 0;
  var nosBytes = 0;
  var nosBytes2 = 0;
  var featureScoreRelocationBytes = 0;
  var featureScoreRelocationBytes2 = 0;

  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }
  
  nosBytes = numberOfStates << 2;
  nosBytes2 = nosBytes << 1;
  featureScoreRelocationBytes = imul(numberOfStates, numberOfStates) << 2;
  featureScoreRelocationBytes2 = featureScoreRelocationBytes << 1;
  
  // backwardScores[chainLength - 1][cur] = 0
  t = imul(numberOfStates, chainLength - 1) << 2;
  outP = (outP + t) | 0;
  nextP = outP; // save position to use it later

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    F4[outP >> 2] = 0.0;
    outP = (outP + 4) | 0;
  }

  outP = (outP - nosBytes2) | 0;
  p = (featureScoreP + imul(featureScoreRelocationBytes,
    chainLength - 1)) | 0;

  // backwardScores[time][cur] = logsumexp(
  //   featureScores[time + 1][cur][0] + backwardScores[time + 1][0],
  //   featureScores[time + 1][cur][1] + backwardScores[time + 1][1],
  //   ...
  // )
  for (time = (chainLength - 2) | 0; (time | 0) >= 0; time = (time - 1) | 0) {  
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      nextPSave = nextP;

      for (next = 0; (next | 0) < (numberOfStates | 0); next = (next + 1) | 0) {
        // featureScores[time][cur][next]
        featureScore = +F4[p >> 2];

        // backwardScores[time + 1][next]
        nextScore = +F4[nextP >> 2];
        
        score = featureScore + nextScore;
        
        F4[tmpP >> 2] = score;
        
        p = (p + 4) | 0;
        nextP = (nextP + 4) | 0;
        tmpP = (tmpP + 4) | 0;
      } 
      tmpP = (tmpP - nosBytes) | 0;
                
      F4[outP >> 2] = +logsumexp(tmpP, numberOfStates);

      nextP = nextPSave;
      outP = (outP + 4) | 0;
    }
    p = (p - featureScoreRelocationBytes2) | 0;
    nextP = (nextP - nosBytes) | 0;
    outP = (outP - nosBytes2) | 0;
  }
}