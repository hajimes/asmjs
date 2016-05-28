import susdot from '../math/susdot'

/**
 * Updates a table of state scores.
 *
 * A table of state scores is a 2-dimensional array
 * float[chainLength][numberOfStates].
 * score[i][j] represents the state score where the current time is i and
 * the current state is j.
 *
 * Exactly (chainLength * numberOfStates) bytes will be written into outP.
 */
export default function updateStateScores(nzP, valueP, indexP, weightP,
  numberOfStates, chainLength, outP) {
  /*
   * Type annotations
   */
  nzP = nzP | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  weightP = weightP | 0;
  numberOfStates = numberOfStates | 0;
  chainLength = chainLength | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var p = 0;
  var end = 0;
  var nz = 0;
  var nzBytes = 0;
  
  /*
   * Main
   */
  end = (nzP + chainLength << 2) | 0;
  while ((nzP | 0) < (end | 0)) {
    nz = U4[nzP >> 2] | 0;
    for (i = 0; (i | 0) < (numberOfStates | 0); i = (i + 1) | 0) {
      susdot(nz, valueP, indexP, weightP, outP);
      outP = (outP + 4) | 0;
    }
    nzP = (nzP + 4) | 0;
    nzBytes = nz << 2;
    valueP = (valueP + nzBytes) | 0;
    indexP = (indexP + nzBytes) | 0;
  }
}