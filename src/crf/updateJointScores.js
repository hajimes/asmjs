/**
 * Updates a table of joint scores, overwriting feature scores.
 */
export default function updateJointScores(featureScoreP, forwardScoreP,
    backwardScoreP, numberOfStates, chainLength, normalizationFactor) {
  /*
   * Type annotations
   */
  featureScoreP = featureScoreP | 0;
  forwardScoreP = forwardScoreP | 0;
  backwardScoreP = backwardScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  normalizationFactor = +normalizationFactor;

  /*
   * Local variables
   */
  var outP = 0;
  var time = 0;
  var cur = 0;
  var prev = 0;
  var score = 0.0;
  var forwardScore = 0.0;
  var backwardScore = 0.0;
  var nosBytes = 0;
    
  /*
   * Main
   */
  outP = featureScoreP; // overwrite
  nosBytes = numberOfStates << 2;
  
  // score[0][cur][0] = featureScores[0][cur][0] +
  //   backwardScores[0][cur] - normalizationFactor
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    backwardScore = +F4[backwardScoreP >> 2];

    score = +F4[outP >> 2];
    score = score + backwardScore - normalizationFactor;
    F4[outP >> 2] = score;
    
    backwardScoreP = (backwardScoreP + nosBytes) | 0;
    outP = (outP + nosBytes) | 0;
  }
  
  // score[time][cur][prev] = featureScores[time][cur][prev] +
  //   forwardScores[time - 1][prev]
  //   backwardScores[time][cur]
  //   - normalizationFactor
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      backwardScore = +F4[backwardScoreP >> 2];

      for (prev = 0; (prev | 0) < (numberOfStates | 0);
          prev = (prev + 1) | 0) {       

        forwardScore = +F4[forwardScoreP >> 2];

        score = +F4[outP >> 2];
        score = score + forwardScore + backwardScore -
          normalizationFactor;
        F4[outP >> 2] = score;
        
        forwardScoreP = (forwardScoreP + 4) | 0;
        outP = (outP + 4) | 0;
      }
      
      forwardScoreP = (forwardScoreP - nosBytes) | 0;
    }
    forwardScoreP = (forwardScoreP + nosBytes) | 0;
    backwardScoreP = (backwardScoreP + 4) | 0;
  }
}