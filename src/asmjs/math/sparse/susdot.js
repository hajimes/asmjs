/**
 * Returns the dot product between a sparse vector x and a dense vector y.
 * Unlike the original Sparse BLAS, repeated indices in x are allowed.
 */
export default function susdot(nz, xP, indexP, yP, outP) {
  /*
   * Type annotations
   */
  nz = nz | 0;
  xP = xP | 0;
  indexP = indexP | 0;
  yP = yP | 0;
  outP = outP | 0;
 
  /*
   * Local variables
   */
  var result = 0.0;
  var end = 0;
  var index = 0;
  var value = 0.0;

  /*
   * Main
   */
  end = (indexP + (nz << 2)) | 0;
  while ((indexP | 0) < (end | 0)) {
    index = I4[indexP >> 2] | 0;
    value = +F4[xP >> 2];
    
    result = +(result + value * +F4[(yP + (index << 2)) >> 2]);
    
    indexP = (indexP + 4) | 0;
    xP = (xP + 4) | 0;
  }
  
  F4[outP >> 2] = result;
}