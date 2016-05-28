import adagradUpdateLazyAt from './adagradUpdateLazyAt';

export default function adagradUpdateLazy(nz, indexP, foiP, soiP, weightP,
  round, delta, eta, lambda) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  indexP = indexP | 0;
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
  var end = 0;
  var index = 0;
  
  /*
   * Main
   */
  end = (indexP + (nz << 2)) | 0;
  while ((indexP | 0) < (end | 0)) {
    index = U4[indexP >> 2] | 0;

    adagradUpdateLazyAt(index, foiP, soiP, weightP,
      round, delta, eta, lambda);

    indexP = (indexP + 4) | 0;        
  }
}