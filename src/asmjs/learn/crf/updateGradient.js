import unique from '../../math/sparse/unique';

/**
 * Computes a gradient.
 *
 * valueP and outValueP can be the same as well as indexP and outIndexP.
 */
export default function updateGradient(nzP, valueP, indexP,
    biasScoreP, biasIndex, 
    transitionScoreP, transitionIndex,
    jointScoreP, correctPathP,
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
  jointScoreP = jointScoreP | 0;
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
  var i = 0;
  var v = 0.0;

  var time = 0;
  var cur = 0;
  var prev = 0;

  var nz = 0;
  var value = 0.0;
  var index = 0;
  var coef = 0.0;
  var totalCoef = 0.0;
  var correctState = 0;
  var correctPreviousState = 0;
  var tmpValuePSave = 0;
  var tmpIndexPSave = 0;
  var tmpNz = 0;
  var transitionIndexSave = 0;
  var transitionFromAnyIndex = 0;
  var transitionFromAnyIndexSave = 0;

  var nosBytes = 0;
  var jointScoreStepPerPrevLoop = 0;
  var jointScoreStepPerCurLoop = 0;
  var transitionIndexStepPerPrevLoop = 0;
  
  // variables for assertion testing
  // var totalNz = sumInt32(nzP, chainLength) | 0;
  // var assertedMaxNz =
  //   imul(totalNz, numberOfStates) + // state features
  //   imul(chainLength, imul(numberOfStates + 1, numberOfStates)) + // transition features
  //   imul(chainLength, numberOfStates) + // transition from any features
  //   1; // bias term
  
  /*
   * Main
   */
  nz = I4[nzP >> 2] | 0;
  correctState = I4[correctPathP >> 2] | 0;
  tmpValuePSave = tmpValueP;
  tmpIndexPSave = tmpIndexP;
  transitionFromAnyIndex = (transitionIndex + imul(numberOfStates + 1, numberOfStates)) | 0;
  transitionFromAnyIndexSave = transitionFromAnyIndex;

  nosBytes = numberOfStates << 2;
  jointScoreStepPerPrevLoop = ((-imul(nosBytes, numberOfStates) | 0) + 4) | 0;
  jointScoreStepPerCurLoop = imul(nosBytes, numberOfStates - 1) | 0;
  transitionIndexStepPerPrevLoop = ((-imul(numberOfStates,
    numberOfStates) | 0) + 1) | 0;

  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    v = +F4[jointScoreP >> 2];
    coef = exp(v);
    
    if ((cur | 0) == (correctState | 0)) {
      coef = coef - 1.0;
    }
    totalCoef = totalCoef + coef;

    I4[tmpIndexP >> 2] = transitionIndex | 0;
    F4[tmpValueP >> 2] = coef;
    tmpIndexP = (tmpIndexP + 4) | 0;
    tmpValueP = (tmpValueP + 4) | 0;
    tmpNz = (tmpNz + 1) | 0;
    
    I4[tmpIndexP >> 2] = transitionFromAnyIndex | 0;
    F4[tmpValueP >> 2] = coef;
    tmpIndexP = (tmpIndexP + 4) | 0;
    tmpValueP = (tmpValueP + 4) | 0;
    tmpNz = (tmpNz + 1) | 0;

    for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
      value = +F4[valueP >> 2];
      index = I4[indexP >> 2] | 0;
      
      F4[tmpValueP >> 2] = value * coef;
      I4[tmpIndexP >> 2] = index;

      valueP = (valueP + 4) | 0;
      indexP = (indexP + 4) | 0;
      tmpValueP = (tmpValueP + 4) | 0;
      tmpIndexP = (tmpIndexP + 4) | 0;
      tmpNz = (tmpNz + 1) | 0;
    }
    
    transitionIndex = (transitionIndex + 1) | 0;
    transitionFromAnyIndex = (transitionFromAnyIndex + 1) | 0;
    transitionScoreP = (transitionScoreP + 4) | 0;
    jointScoreP = (jointScoreP + 4) | 0;
  }
  
  jointScoreP = (jointScoreP +
    (imul(numberOfStates, numberOfStates - 1) << 2)) | 0;
  
  nzP = (nzP + 4) | 0;
  correctPathP = (correctPathP + 4) | 0;
  correctPreviousState = correctState;
  transitionIndexSave = transitionIndex;
  
  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    nz = I4[nzP >> 2] | 0;
    correctState = I4[correctPathP >> 2] | 0;
    transitionFromAnyIndex = transitionFromAnyIndexSave;
    transitionIndex = transitionIndexSave;

    for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
      coef = 0.0;

      for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
        v = +F4[jointScoreP >> 2];
        v = exp(v);

        if ((cur | 0) == (correctState | 0) &
            (prev | 0) == (correctPreviousState | 0)) {
          v = v - 1.0;
        }
        
        coef = coef + v;
        totalCoef = totalCoef + coef;

        I4[tmpIndexP >> 2] = transitionIndex | 0;
        F4[tmpValueP >> 2] = v;
        tmpIndexP = (tmpIndexP + 4) | 0;
        tmpValueP = (tmpValueP + 4) | 0;
        tmpNz = (tmpNz + 1) | 0;

        jointScoreP = (jointScoreP + nosBytes) | 0;
        transitionIndex = (transitionIndex + numberOfStates) | 0;
      }
      
      I4[tmpIndexP >> 2] = transitionFromAnyIndex | 0;
      F4[tmpValueP >> 2] = coef;
      tmpIndexP = (tmpIndexP + 4) | 0;
      tmpValueP = (tmpValueP + 4) | 0;
      tmpNz = (tmpNz + 1) | 0;

      for (i = 0; (i | 0) < (nz | 0); i = (i + 1) | 0) {
        value = +F4[valueP >> 2];
        index = I4[indexP >> 2] | 0;
    
        F4[tmpValueP >> 2] = value * coef;
        I4[tmpIndexP >> 2] = index;

        valueP = (valueP + 4) | 0;
        indexP = (indexP + 4) | 0;
        tmpValueP = (tmpValueP + 4) | 0;
        tmpIndexP = (tmpIndexP + 4) | 0;
        tmpNz = (tmpNz + 1) | 0;
      }
      
      transitionFromAnyIndex = (transitionFromAnyIndex + 1) | 0;

      // from jointScores[time][numberOfStates][cur]
      // to jointScores[time][0][cur + 1]
      jointScoreP = (jointScoreP + jointScoreStepPerPrevLoop) | 0;
      
      // from transitionIndices[numberOfStates + 1][cur]
      // to transitionIndices[1][cur + 1]
      transitionIndex = (transitionIndex + transitionIndexStepPerPrevLoop) | 0;
    }
    nzP = (nzP + 4) | 0;

    correctPathP = (correctPathP + 4) | 0;
    correctPreviousState = correctState;

    // Note that jointScores[time][0][numberOfStates]
    // is the same as jointScores[time][1][0], where
    // p(jointScores[time][1][0]) + numberOfStates * (numberOfStates - 1) * 4
    // = p(jointScores[time + 1][0][0])
    jointScoreP = (jointScoreP + jointScoreStepPerCurLoop) | 0;
  }
  
  I4[tmpIndexP >> 2] = biasIndex | 0;
  F4[tmpValueP >> 2] = totalCoef;
  tmpIndexP = (tmpIndexP + 4) | 0;
  tmpValueP = (tmpValueP + 4) | 0;
  tmpNz = (tmpNz + 1) | 0;

  // Assertion for tmpNz
  // if (tmpNz > assertedMaxNz) {
  //   throw new Error('assertion failed; tmpNz in gradient computation : ' +
  //     tmpNz + ', ' + assertedMaxNz);
  // }

  tmpValueP = tmpValuePSave;
  tmpIndexP = tmpIndexPSave;

  unique(tmpNz, tmpValueP, tmpIndexP, outNzP, outValueP, outIndexP);
}