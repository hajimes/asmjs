import adagradLazyValue from './adagradLazyValue';

// from inclusive, to exclusive
export default function adagradUpdateLazyRange(from, to, foiP, soiP, weightP,
    round, delta, eta, lambda) {
  /*
   * Type annotations
   */
  from = from | 0;
  to = to | 0;
  foiP = foiP | 0;
  soiP = soiP | 0;
  weightP = weightP | 0;
  round = +round;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;
  
  /*
   * Local variables
   */
  var relativeByteOffset = 0;
  var foiV = 0.0;
  var soiV = 0.0;
  
  /*
   * Main
   */
  if ((to | 0) <= (from | 0)) {
    return;
  }
  
  relativeByteOffset = (from << 2);
  foiP = (foiP + relativeByteOffset) | 0;
  soiP = (soiP + relativeByteOffset) | 0;
  weightP = (weightP + relativeByteOffset) | 0;

  for (; (from | 0) < (to | 0); from = (from + 1) | 0) {
    foiV = +F4[foiP >> 2];
    
    if (foiV != 0.0) {
      soiV = +F4[soiP >> 2];
      F4[weightP >> 2] = +adagradLazyValue(
        foiV, soiV, round, delta, eta, lambda
      );
    }
    
    foiP = (foiP + 4) | 0;
    soiP = (soiP + 4) | 0;
    weightP = (weightP + 4) | 0;
  }
}