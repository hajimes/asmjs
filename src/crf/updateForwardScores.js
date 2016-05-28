import logsumexp from '../math/logsumexpFloat32';

/**
 * Updates forward scores.
 *
 * A sequence of forward scores is a 2-dimensional array
 * float[chainLength][numberOfStates].
 *
 * Exactly (chainLength * numberOfStates * 4) bytes will be written into
 * outP. Uses exactly (numberOfStates * 4) bytes at tmpP. They are not
 * required to be initialized to 0.
 * 
 * @param {int} featureScoresP - byte offset to a table of feature scores
 * @param {int} numberOfStates - number of the states of a Markov chain
 * @param {int} chainLength - length of a Markov chain
 * @parma {int} tmpP - byte offset to working space
 * @param {int} outP - byte offset where the output will be written
 */
export default function updateForwardScores(featureScoresP, numberOfStates,
    chainLength, tmpP, outP) {
  /*
   * Type annotations
   */
  featureScoresP = featureScoresP | 0;
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

  /*
   * Main
   */
  if ((chainLength | 0) <= 0) {
    return;
  }
  
  p = featureScoresP;
  prevP = outP;
  
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    // forwardScores[0][cur] = featureScores[0][cur][0];
    score = +F4[p >> 2];
    F4[outP >> 2] = F4[p >> 2];

    p = (p + (numberOfStates << 2)) | 0;
    outP = (outP + 4) | 0;
  }
  

  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {  
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      // forwardScores[time][cur] = logsumexp(
      //   featureScores[time][cur][0] + forwardScores[time - 1][0],
      //   featureScores[time][cur][1] + forwardScores[time - 1][1],
      //   ...
      // )
      for (prev = 0; (prev | 0) < (numberOfStates | 0);
          prev = (prev + 1) | 0) {
        // featureScores[time][cur][prev]
        featureScore = +F4[p >> 2];
        // forwardScores[time - 1][prev]
        previousScore = +F4[prevP >> 2];
        
        score = featureScore + previousScore;
        
        F4[(tmpP + (prev << 2)) >> 2] = score;
        
        p = (p + 4) | 0;
        prevP = (prevP + 4) | 0;
      } 
      // revert prevP to forwardScores[time - 1][prev]
      prevP = (prev - numberOfStates << 2) | 0;
      
      F4[outP >> 2] = +logsumexp(tmpP, numberOfStates);

      outP = (outP + 4) | 0;
    }
    // advance prevP to forwardScores[time][0]
    prevP = (prev + numberOfStates << 2) | 0;
  }
}