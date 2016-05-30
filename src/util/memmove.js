// Based on Chris Torek's C code
// but alignment handling is reduced
export default function memmove(destP, srcP, length) {
  /*
   * Type annotations
   */
  destP = destP | 0;
  srcP = srcP | 0;
  length = length | 0;
  
  /*
   * Local variables
   */
  var end = 0;
  var t = 0;
  var destPSave = 0;

  /*
   * Main
   */
  destPSave = destP;
  end = (srcP + length) | 0;
  
  if (((length | 0) <= 0) | ((destP | 0) == (srcP | 0))) {
    return destPSave | 0;
  }
  
  if ((destP | 0) < (srcP | 0)) {
    // copy forwards
    
    t = srcP;

    // copy whole words if aligned
    if (((t & 7) | (destP & 7)) == 0) {
      t = length >> 3;
      if (t) {
        do {
          // F8[destP >> 3] = F8[srcP >> 3];
          U4[destP >> 2] = U4[srcP >> 2];
          U4[(destP + 4) >> 2] = U4[(srcP + 4) >> 2];

          srcP = (srcP + 8) | 0;
          destP = (destP + 8) | 0;

          t = (t - 1) | 0;
        } while (t);
      }
      t = length & 7;
    } else {
      t = length;
    }
    
    // handle the remaining
    if (t) {
      do {
        U1[destP >> 0] = U1[srcP >> 0];        

        srcP = (srcP + 1) | 0;
        destP = (destP + 1) | 0;
        t = (t - 1) | 0;
      } while (t);
    }
  } else {
    // copy backwards
    srcP = (srcP + length) | 0;
    destP = (destP + length) | 0;
    
    t = srcP;
    
    if (((t & 7) | (destP & 7)) == 0) {
      t = length >> 3;

      if (t) {
        do {
          srcP = (srcP - 8) | 0;
          destP = (destP - 8) | 0;
        
          F8[destP >> 3] = F8[srcP >> 3];
        
          t = (t - 1) | 0;
        } while (t);
      }
    
      t = length & 7;    
    } else {
      t = length;
    }
    
    if (t) {
      do {
        srcP = (srcP - 1) | 0;
        destP = (destP - 1) | 0;
        U1[destP >> 0] = U1[srcP >> 0];        
        t = (t - 1) | 0;
      } while (t);
    }
  }
  
  return destPSave | 0;
}