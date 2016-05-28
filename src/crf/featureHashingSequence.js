import featureHashing from './featureHashing'

/**
 * Applies feature hashing to an instance for each class/position and
 * generate new sparse vectors
 *
 * If the sum of nzs is x, x * numberOfClasses will be written to
 * each outValueP and 
 */
export default function featureHashingSequence(nzP, valueP, indexP,
  numberOfClasses, pathLength, dimension, outValueP, outIndexP) {
  /*
   * Type annotations
   */
  nzP = nzP | 0;
  valueP = valueP | 0;
  indexP = indexP | 0;
  numberOfClasses = numberOfClasses | 0;
  pathLength = pathLength | 0;
  dimension = dimension | 0;
  outValueP = outValueP | 0;
  outIndexP = outIndexP | 0;

  /*
   * Local variables
   */
  var i = 0;
  var nz = 0;
  var end = 0;

  /*
   * Main
   */
  end = (nzP + (pathLength << 2)) | 0;

  while ((nzP | 0) < (end | 0)) {
    nz = U4[nzP >> 2] | 0;

    for (i = 0; (i | 0) < (numberOfClasses | 0); i = (i + 1) | 0) {
      featureHashing(nz, valueP, indexP, i, dimension,
        outValueP, outIndexP);
      outValueP = (outValueP + (nz << 2)) | 0;
      outIndexP = (outIndexP + (nz << 2)) | 0;
    }

    nzP = (nzP + 4) | 0;
    valueP = (valueP + (nz << 2)) | 0;
    indexP = (indexP + (nz << 2)) | 0;
  }
}