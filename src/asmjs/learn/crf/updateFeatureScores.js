/**
 * Updates a table of feature scores.
 *
 * A feature score is a dot product between a weight vector and
 * a feature vector. We pre-calculate dot products for transition-type features
 * and state-type features separately, and then combine the results here to
 * obtain correct dot products.
 *
 * A table of feature scores is a 3-dimensional array
 * float[chainLength][numberOfStates][numberOfStates].
 * If i = 0, score[0][0][k] represents the state score where the current
 * time is 0, the previous state is a (hypothetical) initial state,
 * and the current state is k,
 * If i > 0, score[i][j][k] represents the state score where the current
 * time is i, and the previous state is j, and the current state is k.
 *
 * Exactly (chainLength * (numberOfStates ^ 2) * 4) bytes will be written
 * into outP.
 */
export default function updateFeatureScores(biasScoreP, transitionScoreP,
  stateScoreP, numberOfStates, chainLength, outP) {
  /*
   * Type annotations
   */
  biasScoreP = biasScoreP | 0;
  transitionScoreP = transitionScoreP | 0;
  stateScoreP = stateScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var time = 0;
  var cur = 0;
  var prev = 0;
  var score = 0.0;
  var stateScore = 0.0;
  var transitionScore = 0.0;
  var transitionFromAnyScoreP = 0;
  var transitionFromAnyScorePSave = 0;
  var biasScore = 0.0;
  var stateScorePSave = 0;
  var transitionScorePSave = 0;
  var nosBytes = 0;
    
  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }

  nosBytes = numberOfStates << 2;
  biasScore = +F4[biasScoreP >> 2];
  transitionFromAnyScoreP = (transitionScoreP +
    (imul(numberOfStates + 1, numberOfStates) << 2)) | 0;
  transitionFromAnyScorePSave = transitionFromAnyScoreP;
  
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    // stateScores[0][cur]
    stateScore = +F4[stateScoreP >> 2];
    // transitionScores[0][cur]
    transitionScore = (+F4[transitionScoreP >> 2]) +
      (+F4[transitionFromAnyScoreP >> 2]);

    score = stateScore + transitionScore + biasScore;    
    F4[outP >> 2] = score;
    
    stateScoreP = (stateScoreP + 4) | 0;
    transitionScoreP = (transitionScoreP + 4) | 0;
    transitionFromAnyScoreP = (transitionFromAnyScoreP + 4) | 0;
    outP = (outP + 4) | 0;
  }
  transitionFromAnyScoreP = transitionFromAnyScorePSave;
  
  outP = (outP + ((imul(numberOfStates, numberOfStates - 1) << 2))) | 0;
  
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    transitionScorePSave = transitionScoreP;
    
    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      stateScorePSave = stateScoreP;
      transitionFromAnyScorePSave = transitionFromAnyScoreP;

      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        // stateScores[time][cur]
        stateScore = +F4[stateScoreP >> 2];
      
        // transitionScores[prev + 1][cur]
        transitionScore = (+F4[transitionScoreP >> 2]) +
          (+F4[transitionFromAnyScoreP >> 2]);
        
        score = stateScore + transitionScore + biasScore;

        F4[outP >> 2] = score;
        
        stateScoreP = (stateScoreP + 4) | 0;
        transitionScoreP = (transitionScoreP + 4) | 0;
        transitionFromAnyScoreP = (transitionFromAnyScoreP + 4) | 0;
        outP = (outP + 4) | 0;
      }
      
      stateScoreP = stateScorePSave;
      transitionFromAnyScoreP = transitionFromAnyScorePSave;
    }

    stateScoreP = (stateScoreP + nosBytes) | 0;
    transitionScoreP = transitionScorePSave;
  }
}