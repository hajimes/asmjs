/**
 * Lazily calculates an updated value for AdaGrad-L1 primal-dual subgradient.
 * See p. 2137, Duchi, Hazan, and Singer (2011).
 *
 * @param {double} fov
 * @param {double} sov
 * @param {double} round
 * @param {double} delta
 * @param {double} eta
 * @param {double} lambda
 * @returns {double}
 */
export default function lazyValue(fov, sov, round, delta, eta, lambda) {
  /*
   * Type annotations
   */
  fov = +fov;
  sov = +sov;
  round = +round;
  delta = +delta;
  eta = +eta;
  lambda = +lambda;
  
  /*
   * Local variables
   */
  var result = 0.0;
  
  /*
   * Main
   */

  if (fov == 0.0) {
    return 0.0;
  }

  result = abs(fov) / round;
  result = result - lambda;
  result = max(0.0, result);

  if (result == 0.0) {
   return 0.0;
  }

  if (fov > 0.0) {
   result = result * -1.0;
  }

  result = result * eta * round;

  result = result / (delta + sqrt(sov));

  return +result;
}