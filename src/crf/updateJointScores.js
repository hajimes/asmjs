/**
 * Updates a table of joint scores, overwriting feature scores.
 *
 * A table of joint scores is a 3-dimensional array
 * float[chainLength][numberOfStates][numberOfStates].
 * If i = 0, score[0][0][k] represents the joint probability in logarithmic
 * scale that the current time is 0, the previous state is a (hypothetical)
 * initial state, and the current state is k.
 * If i > 0, score[i][j][k] represents the joint probability in logarithmic
 * scale that the current time is i, the previous state is j,
 * and the current state is k.
 *
 * Data will be overwrriten into a table of feature scores.
 */
export default function updateJointScores(featureScoreP, forwardScoreP,
    backwardScoreP, normalizationFactorP, numberOfStates, chainLength) {
  /*
   * Type annotations
   */
  featureScoreP = featureScoreP | 0;
  forwardScoreP = forwardScoreP | 0;
  backwardScoreP = backwardScoreP | 0;
  normalizationFactorP = normalizationFactorP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;

  /*
   * Local variables
   */
  var outP = 0;
  var time = 0;
  var cur = 0;
  var prev = 0;
  var score = 0.0;
  var normalizationFactor = 0.0;
  var forwardScore = 0.0;
  var backwardScore = 0.0;
  var backwardScorePSave = 0;
  var nosBytes = 0;
    
  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }

  normalizationFactor = +F4[normalizationFactorP >> 2];
  outP = featureScoreP; // overwrite
  nosBytes = numberOfStates << 2;
  
  // score[0][0][cur] = featureScores[0][0][cur] +
  //   backwardScores[0][cur] - normalizationFactor
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    backwardScore = +F4[backwardScoreP >> 2];

    score = +F4[outP >> 2];
    score = score + backwardScore - normalizationFactor;

    F4[outP >> 2] = score;    
    
    backwardScoreP = (backwardScoreP + 4) | 0;
    outP = (outP + 4) | 0;

  }
  
  outP = (outP + ((imul(numberOfStates, numberOfStates - 1) << 2))) | 0;
  
  // score[time][prev][cur] = featureScores[time][prev][cur] +
  //   forwardScores[time - 1][prev]
  //   backwardScores[time][cur]
  //   - normalizationFactor
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      backwardScorePSave = backwardScoreP;
      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        backwardScore = +F4[backwardScoreP >> 2];
        forwardScore = +F4[forwardScoreP >> 2];

        score = +F4[outP >> 2];
        score = score + forwardScore + backwardScore - normalizationFactor;

        F4[outP >> 2] = score;
      
        outP = (outP + 4) | 0;
        backwardScoreP = (backwardScoreP + 4) | 0;
      }
      backwardScoreP = backwardScorePSave;
      forwardScoreP = (forwardScoreP + 4) | 0;
    }
    backwardScoreP = (backwardScoreP + nosBytes) | 0;
  }
}