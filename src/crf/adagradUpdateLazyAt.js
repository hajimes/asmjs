import adagradLazyValue from './adagradLazyValue';

export default function adagradUpdateLazyAt(index, foiP, soiP, weightP,
    round, delta, eta, lambda) {
  /*
   * Type annotations
   */
  index = index | 0;
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
  var p1 = 0;
  var p2 = 0;
  var p3 = 0;
  
  /*
   * Main
   */
  relativeByteOffset = index << 2; 
  p1 = (foiP + relativeByteOffset) | 0;
  p2 = (soiP + relativeByteOffset) | 0;
  p3 = (weightP + relativeByteOffset) | 0;
  F4[p3 >> 2] = +adagradLazyValue(
    +F4[p1 >> 2], +F4[p2 >> 2],
    round, delta, eta, lambda
  );
}