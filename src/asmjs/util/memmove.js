/*-
 * Copyright (c) 1990, 1993
 *	The Regents of the University of California.  All rights reserved.
 *
 * This code is derived from software contributed to Berkeley by
 * Chris Torek.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 4. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */
// Ported from Chris Torek's C code with less alignment handling
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