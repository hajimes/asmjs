/**
 * Computes marginal probabilities from logarithmic joint probabilites.
 *
 * A table of marginal probabilities is
 * float[numberOfStates + 1][numberOfStates].
 * score[0][j] represents a marginal from the (hypothetical) initial state
 * to the state j. For i >= 1, score[i][j] represents a marginal from the
 * state (i - 1) to the state j.
 *
 * Unlike joint scores, values in this table represents probabilities in
 * normal scale, not in logarithmic.
 *
 * This function assumes that its output destination is cleared to 0.
 *
 * Exactly ((numberOfStates + 1) * numberOfStates) bytes will be written into
 * outP.
 */
export default function updateMarginalProbabilities(jointScoreP,
  numberOfStates, chainLength, outP) {
  /*
   * Type annotations
   */
  jointScoreP = jointScoreP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outP = outP | 0;

  /*
   * Local variables
   */
  var t = 0.0;
  var jointScore = 0.0;
  var outPSave = 0;
  var time = 0;
  var prev = 0;
  var cur = 0;

  /*
   * Main
   */
  //
  // Sum of logarithmic joint probabilities (multiplication in normal scale)
  //
  for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
    jointScore = +F4[jointScoreP >> 2];
    F4[outP >> 2] = exp(jointScore);
    outP = (outP + 4) | 0;
    jointScoreP = (jointScoreP + 4) | 0;
  }
  outPSave = outP;
  jointScoreP = (jointScoreP +
    (imul(numberOfStates - 1, numberOfStates) << 2)) | 0;

  for (time = 1; (time | 0) < (chainLength | 0); time = (time + 1) | 0) {
    for (prev = 0; (prev | 0) < (numberOfStates | 0); prev = (prev + 1) | 0) {
      for (cur = 0; (cur | 0) < (numberOfStates | 0); cur = (cur + 1) | 0) {
        jointScore = +F4[jointScoreP >> 2];
        
        t = +F4[outP >> 2];
        F4[outP >> 2] = t + exp(jointScore);
        
        jointScoreP = (jointScoreP + 4) | 0;
        outP = (outP + 4) | 0;
      }      
    }
    outP = outPSave;
  }
}