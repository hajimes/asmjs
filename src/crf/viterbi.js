/**
 * This function uses (numberOfStates * chainLength * 4 * 2) bytes at tmpP.
 * Exactly (chainLength * 4) bytes will be written into predictionP.
 * Exactly 4 bytes will be written into predictionScoreP.
 */
export default function viterbi(scoreP, numberOfStates, chainLength,
    tmpP, predictionP, predictionScoreP) {
  /*
   * Type annotations
   */
  scoreP = scoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  tmpP = tmpP | 0;
  predictionP = predictionP | 0;
  predictionScoreP = predictionScoreP | 0;

  /*
   * Local variables
   */
  var t = 0.0;
  
  var offset = 0;
  
  var time = 0;
  var cur = 0;
  var prev = 0;
  
  var bestScore = 0.0;
  var bestPath = 0;
  
  var bestScoreP = 0;
  var bestPathP = 0;
  var bestPathPSave = 0;
  
  var prevP = 0;
  var prevPSave = 0;
  var previousScore = 0.0;

  var nosBytes = 0;
  
  /*
   * Main
   */
  if (((numberOfStates | 0) <= 0) | ((chainLength | 0) <= 0)) {
    return;
  }

  nosBytes = numberOfStates << 2;
  bestScoreP = tmpP;
  bestPathP = (tmpP + imul(nosBytes, chainLength)) | 0;
  prevP = bestScoreP;
  bestPathPSave = bestPathP;

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    F4[bestScoreP >> 2] = +F4[scoreP >> 2];
    I4[bestPathP >> 2] = -1;

    scoreP = (scoreP + 4) | 0;
    bestScoreP = (bestScoreP + 4) | 0;
    bestPathP = (bestPathP + 4) | 0;
  }
  scoreP = (scoreP + (imul(numberOfStates, numberOfStates - 1) << 2)) | 0;
  
  
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      prevPSave = prevP;
      bestPath = -1;
      bestScore = -Infinity;

      for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
        // scores[time][prev][cur] + bestScores[time - 1][prev]
        t = +F4[scoreP >> 2];
        previousScore = +F4[prevP >> 2];
        
        t = t + previousScore;
        
        if (t > bestScore) {
          bestPath = prev;
          bestScore = t;
        }        
        
        scoreP = (scoreP + nosBytes) | 0;
        prevP = (prevP + 4) | 0;
      }
      
      F4[bestScoreP >> 2] = bestScore;
      I4[bestPathP >> 2] = bestPath;
      
      bestScoreP = (bestScoreP + 4) | 0;
      bestPathP = (bestPathP + 4) | 0;
      
      prevP = prevPSave;
      
      // from scores[time][numberOfStates][cur]
      // to scores[time][0][cur + 1]
      scoreP = (scoreP - imul(nosBytes, numberOfStates) + 4) | 0;
    }
    
    // advance prevP to bestScores[time][0]
    prevP = (prevP + nosBytes) | 0;

    // Note that scores[time][0][numberOfStates]
    // is the same as scores[time][1][0]
    scoreP = (scoreP + imul(nosBytes, numberOfStates - 1)) | 0;
  }

  // back track
  bestScoreP = (bestScoreP - nosBytes) | 0;
  bestPath = 0;
  bestScore = -Infinity;

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    t = +F4[bestScoreP >> 2];

    if (t > bestScore) {
      bestPath = cur;
      bestScore = t;
    }
    
    bestScoreP = (bestScoreP + 4) | 0;
  }
  
  F4[predictionScoreP >> 2] = bestScore;
  
  bestPathP = bestPathPSave;
  
  predictionP = (predictionP + nosBytes - 4) | 0;
  I4[predictionP >> 2] = bestPath;
  for (time = (chainLength - 2) | 0; (time | 0) >= 0; time = (time - 1) | 0) {
    offset = (imul(nosBytes, time + 1) + (bestPath << 2)) | 0;
    
    bestPath = I4[(bestPathP + offset) >> 2] | 0;
    I4[predictionP >> 2] = bestPath;
    predictionP = (predictionP - 4) | 0;
  }
}