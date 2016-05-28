import logsumexp from '../math/logsumexpFloat32';

/**
 * Updates a table of forward scores.
 *
 * A table of forward scores is a 2-dimensional array
 * float[chainLength][numberOfStates].
 *
 * Exactly (chainLength * numberOfStates * 4) bytes will be written into
 * outP. Uses exactly (numberOfStates * 4) bytes at tmpP. They are not
 * required to be initialized to 0.
 * 
 * @param {int} featureScoreP - byte offset to a table of feature scores
 * @param {int} numberOfStates - number of the states of a Markov chain
 * @param {int} chainLength - length of a Markov chain
 * @parma {int} tmpP - byte offset to working space
 * @param {int} outP - byte offset where the output will be written
 */
export default function updateForwardScores(featureScoreP, numberOfStates,
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
  var prev = 0;
  var featureScore = 0.0;
  var previousScore = 0.0;
  var score = 0.0;
  var p = 0;
  var prevP = 0;
  var prevPSave = 0;
  var nosBytes = 0;

  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }
  
  nosBytes = numberOfStates << 2;
  p = featureScoreP;
  prevP = outP;
  
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    // forwardScores[0][cur] = featureScores[0][0][cur];
    score = +F4[p >> 2];
    F4[outP >> 2] = F4[p >> 2];

    p = (p + 4) | 0;
    outP = (outP + 4) | 0;
  }
  
  p = (p + (imul(numberOfStates, numberOfStates - 1) << 2)) | 0;

  // forwardScores[time][cur] = logsumexp(
  //   featureScores[time][0][cur] + forwardScores[time - 1][0],
  //   featureScores[time][1][cur] + forwardScores[time - 1][1],
  //   ...
  // )
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {  
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      prevPSave = prevP;
      for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
        // featureScores[time][prev][cur]
        featureScore = +F4[p >> 2];
        // forwardScores[time - 1][prev]
        previousScore = +F4[prevP >> 2];
        
        score = featureScore + previousScore;
        
        F4[tmpP >> 2] = score;
        
        p = (p + nosBytes) | 0;
        prevP = (prevP + 4) | 0;
        tmpP = (tmpP + 4) | 0;
      } 
      tmpP = (tmpP - nosBytes) | 0;

      F4[outP >> 2] = +logsumexp(tmpP, numberOfStates);

      prevP = prevPSave;
      outP = (outP + 4) | 0;
      
      // from featureScores[time][numberOfStates][cur]
      // to featureScores[time][0][cur + 1]
      p = (p - imul(nosBytes, numberOfStates) + 4) | 0;
    }
    // advance prevP to forwardScores[time][0]
    prevP = (prevP + nosBytes) | 0;

    // Note that featureScores[time][0][numberOfStates]
    // is the same as featureScores[time][1][0]
    p = (p + imul(nosBytes, numberOfStates - 1)) | 0;
  }
}