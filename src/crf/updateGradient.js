import unique from '../math/sparse/unique';

/**
 * Computes a gradient.
 */
export default function updateGradient(nzP, valueP, indexP,
    biasScoreP, biasIndex, 
    transitionScoreP, transitionIndex,
    marginalProbabilityP, correctPathP,
    numberOfStates, chainLength,
    tmpValueP, tmpIndexP,
    outNzP, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nzP = nzP | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  biasScoreP = biasScoreP | 0;
  biasIndex = biasIndex | 0;
  transitionScoreP = transitionScoreP | 0;
  transitionIndex = transitionIndex | 0;
  marginalProbabilityP = marginalProbabilityP | 0;
  correctPathP = correctPathP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  tmpValueP = tmpValueP | 0;
  tmpIndexP = tmpIndexP | 0;
  outNzP = outNzP | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;
  
  /*
   * Local variables
   */
  var time = 0;
  var cur = 0;
  var prev = 0;
  var transitionIndexSave = 0;
  var transitionScore = 0.0;
  var marginalProbability = 0.0;
  var marginalProbabilityPSave = 0;
  var i = 0;
  var nz = 0;
  var totalNz = 0;
  var value = 0.0;
  var index = 0;
  var biasScore = 0.0;
  var coef = 0.0;
  var correctState = 0;
  var correctPreviousState = 0;
  var tmpValuePSave = 0;
  var tmpIndexPSave = 0;
  
  /*
   * Main
   */
  biasScore = +F4[biasScoreP >> 2];
  nz = I4[nzP >> 2] | 0;
  totalNz = (totalNz + nz) | 0;
  correctState = I4[correctPathP >> 2] | 0;
  tmpValuePSave = tmpValueP;
  tmpIndexPSave = tmpIndexP;

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    marginalProbability = +F4[marginalProbabilityP >> 2];
    coef = -marginalProbability;
    
    if ((cur | 0) == (correctState | 0)) {
      coef = coef + 1.0;
    }
    
    I4[tmpIndexP >> 2] = biasIndex | 0;
    F4[tmpValueP >> 2] = biasScore * coef;
    tmpIndexP = (tmpIndexP + 4) | 0;
    tmpValueP = (tmpValueP + 4) | 0;
    totalNz = (totalNz + 1) | 0;

    transitionScore = +F4[(transitionScoreP + (transitionIndex << 2)) >> 2];
    I4[tmpIndexP >> 2] = transitionIndex | 0;
    F4[tmpValueP >> 2] = transitionScore * coef;
    tmpIndexP = (tmpIndexP + 4) | 0;
    tmpValueP = (tmpValueP + 4) | 0;
    totalNz = (totalNz + 1) | 0;

    for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
      value = +F4[valueP >> 2];
      index = I4[indexP >> 2] | 0;
      
      F4[tmpValueP >> 2] = value * coef;
      I4[tmpIndexP >> 2] = index;

      valueP = (valueP + 4) | 0;
      indexP = (indexP + 4) | 0;
      tmpValueP = (tmpValueP + 4) | 0;
      tmpIndexP = (tmpIndexP + 4) | 0;
      totalNz = (totalNz + 1) | 0;
    }
    
    transitionIndex = (transitionIndex + 1) | 0;
    marginalProbabilityP = (marginalProbabilityP + 4) | 0;
  }
  
  nzP = (nzP + 4) | 0;
  nz = I4[nzP >> 2] | 0;
  correctPathP = (correctPathP + 4) | 0;

  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    marginalProbabilityPSave = marginalProbabilityP;
    transitionIndexSave = transitionIndex;
    nz = I4[nzP >> 2] | 0;
    
    correctPreviousState = correctState;
    correctState = I4[correctPathP >> 2] | 0;

    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        marginalProbability = +F4[marginalProbabilityP >> 2];
        coef = -marginalProbability;

        if ((cur | 0) == (correctState | 0) &
            (prev | 0) == (correctPreviousState | 0)) {
          coef = coef + 1.0;
        }

        I4[tmpIndexP >> 2] = biasIndex | 0;
        F4[tmpValueP >> 2] = biasScore * coef;
        tmpIndexP = (tmpIndexP + 4) | 0;
        tmpValueP = (tmpValueP + 4) | 0;
        totalNz = (totalNz + 1) | 0;

        transitionScore = +F4[(transitionScoreP + (transitionIndex << 2)) >> 2];
        I4[tmpIndexP >> 2] = transitionIndex | 0;
        F4[tmpValueP >> 2] = transitionScore * coef;
        tmpIndexP = (tmpIndexP + 4) | 0;
        tmpValueP = (tmpValueP + 4) | 0;
        totalNz = (totalNz + 1) | 0;

        for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
          value = +F4[valueP >> 2];
          index = I4[indexP >> 2] | 0;
      
          F4[tmpValueP >> 2] = value * coef;
          I4[tmpIndexP >> 2] = index;

          valueP = (valueP + 4) | 0;
          indexP = (indexP + 4) | 0;
          tmpValueP = (tmpValueP + 4) | 0;
          tmpIndexP = (tmpIndexP + 4) | 0;
          totalNz = (totalNz + 1) | 0;
        }

        transitionIndex = (transitionIndex + 1) | 0;
        marginalProbabilityP = (marginalProbabilityP + 4) | 0;
      }
    }

    nzP = (nzP + 4) | 0;
    marginalProbabilityPSave = marginalProbabilityP;
    transitionIndex = transitionIndexSave;
  }
  tmpValueP = tmpValuePSave;
  tmpIndexP = tmpIndexPSave;

  unique(totalNz, tmpValueP, tmpIndexP, outNzP, outValueP, outIndexP);
}