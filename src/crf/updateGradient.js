/**
 * Computes a gradient from 
 */
export default function updateGradient(nzP, valueP, indexP,
  biasScoreP, transitionScoreP,
  marginalProbabilityP, correctPathP,
  numberOfStates, chainLength,
  outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  chainLength = chainLength | 0;
  correctPathP = correctPathP | 0;
  marginalProbabilityP = marginalProbabilityP | 0;
  correctPathP = correctPathP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outNzP = outNzP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;
  
  /*
   * Local variables
   */
  // var time = 0;
  // var cur = 0;
  // var prev = 0;
  var transitionIndex = 0;
  var transitionScore = 0.0
  var transitionScorePSave = 0;
  var marginalProbability = 0.0
  var marginalProbabilityPSave = 0;
  var i = 0;
  var nz = 0;
  var value = 0.0;
  var index = 0;
  var biasScore = 0.0;
  var coef = 0.0;

  /*
   * Main
   */
  biasScore = +F4[biasScoreP];
  nz = I4[nzP >> 2] | 0;
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    marginalProbability = +F4[marginalProbabilityP >> 2];
    
    transitionScoreP = (transitionScoreP + 4) | 0;
    marginalProbabilityP = (marginalProbabilityP + 4) | 0;
  }

  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    marginalProbabilityPSave = marginalProbabilityP;
    nz = I4[nzP >> 2] | 0;
    transitionIndex = numberOfStates;

    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        marginalProbability = +F4[marginalProbabilityP >> 2];
        coef = -marginalProbability;

        F4[outValueP >> 2] = biasScore * coef;
        I4[outIndexP >> 2] = 0;
        
        outValueP = (outValueP + 4) | 0;
        outIndexP = (outIndexP + 4) | 0;

        transitionScore = +F4[transitionScoreP >> 2];
        transitionIndex = (transitionIndex + 1) | 0;
        F4[outValueP >> 2] = transitionScore * coef;
        I4[outIndexP >> 2] = transitionIndex;
        
        for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
          value = +F4[valueP >> 2];
          index = I4[indexP >> 2] | 0;
          
          F4[outValueP >> 2] = value * coef;
          I4[outIndexP >> 2] = index | 0;
          
          valueP = (valueP + 1) | 0;
          indexP = (indexP + 1) | 0;
          outValueP = (outValueP + 4) | 0;
          outIndexP = (outIndexP + 4) | 0;
        }
        
        transitionScoreP = (transitionScoreP + 4) | 0;
        marginalProbabilityP = (marginalProbabilityP + 4) | 0;
      }
    }
    
    nzP = (nzP + 4) | 0;
    marginalProbabilityPSave = marginalProbabilityP;
  }
}