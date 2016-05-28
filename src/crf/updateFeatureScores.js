/**
 * Updates a table of feature scores.
 *
 * A table of feature scores is a 3-dimensional array
 * float[chainLength][numberOfStates][numberOfStates].
 * If i = 0, score[0][j][0] represents the state score where the current
 * time is 0, the current state is j, and the previous time is a
 * (hypothetical) initial state.
 * If i > 0, score[i][j][k] represents the state score where the current
 * time is i, the current state is j, and the previous time is k.
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
  var biasScore = 0.0;
  var srP = 0; // relative byte offset from the start of state scores
  var trP = 0; // relative byte offset from the start of transition scores
    
  /*
   * Main
   */
  biasScore = +F4[biasScoreP >> 2];
  
  for (; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    // stateScores[0][cur]
    stateScore = +F4[(stateScoreP + srP) >> 2];
    // transitionScores[0][cur]
    transitionScore = +F4[(transitionScoreP + trP) >> 2];
    score = stateScore + transitionScore + biasScore;
    
    F4[outP >> 2] = score;
    
    srP = (srP + 4) | 0;
    trP = (trP + 4) | 0;
    outP = (outP + (numberOfStates << 2)) | 0;
  }
  
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    trP = 0;
    
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      stateScore = +F4[(stateScoreP + srP) >> 2];
      
      for (prev = 0; (prev | 0) < (numberOfStates | 0);
          prev = (prev + 1) | 0) {
        transitionScore = +F4[(transitionScoreP + trP) >> 2];
        
        score = stateScore + transitionScore + biasScore;
        
        F4[outP >> 2] = score;
        
        outP = (outP + 4) | 0;
        trP = (trP + 4) | 0;
      }
      
      trP = (trP + 4) | 0;
      srP = (srP + 4) | 0;
      outP = (outP + 4) | 0;
    }
  }     
}