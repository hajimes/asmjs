/* global CMP_FUNCTION_TABLE */

// LICENSE issue
// original C code is copyrighted by John Wiley & Sons Inc.
// http://www.cs.dartmouth.edu/~doug/qsort.c
// we will rewrite this code to BSD's qsort

/**
 * Sorts things quickly.
 *
 * qsortBM uses an improved version of the quick sort algorithm developed by
 * Jon L. Bentley and M. Douglas McIlroy in 1993.
 *
 * TODO: the original B&M variably changes the size used for swap,
 * though currently this implementation swaps data byte by byte.
 * This issue will be solved soon.
 *
 * @param {int} inP - byte offset to an array
 * @param {int} n - number of elements of the specified array
 * @param {int} es - byte size of each element
 * @param {int} cmpId - id of a comparator
 * @see Jon L. Bentley and M. Douglas McIlroy. 1993.
 *   Engineering a sort function. Software: Practice and Experience,
 *   23(11):1249–1265.
 */
export default function qsortBM(inP, n, es, cmpId) {
  /*
   * Type annotations
   */
  inP = inP | 0;
  n = n | 0;
  es = es | 0;
  cmpId = cmpId | 0;
  
  /*
   * Local variables
   */
  var a = 0;
  var pa = 0;
  var pb = 0;
  var pc = 0;
  var pd = 0;
  var pl = 0;
  var pm = 0;
  var pn = 0;
  var pv = 0;
  
  var r = 0;
  // var swapType = 0;
  // var t = 0;
  var s = 0;
  
  var isTrue1 = 0;
  var isTrue2 = 0;

  /*
   * Main
   */
  // this variable is used only for convenience to compare this code
  // with the original source code of B&M
  a = inP;
  
  // Insertion sort if an array is very small
  if ((n | 0) < 7) {
    //for (pm = a + es; pm < a + n * es; pm += es) 
    pm = (a + es) | 0;
    isTrue1 = (pm | 0) < ((a + imul(n, es)) | 0);
    while (isTrue1) {
      
      // for (pl = pm; pl > a && cmp(pl - es, pl) > 0; pl -= es)
      pl = pm;
      isTrue2 = (pl | 0) > (a | 0);
      if (isTrue2) {
        isTrue2 = (CMP_FUNCTION_TABLE[cmpId & 3]((pl - es) | 0, pl) | 0) > 0;
      }
      while (isTrue2) {
        swap(pl, (pl - es) | 0, es);

        pl = (pl - es) | 0;

        isTrue2 = (pl | 0) > (a | 0);
        if (isTrue2) {
          isTrue2 = (CMP_FUNCTION_TABLE[cmpId & 3]((pl - es) | 0, pl) | 0) > 0;
        }
      }
      
      pm = (pm + es) | 0;
      isTrue1 = (pm | 0) < ((a + imul(n, es)) | 0);
    }
    
    return;
  }
  
  pm = (a + imul(((n | 0) / 2) | 0, es)) | 0;
  
  if ((n | 0) > 7) {
    pl = a;
    pn = (a + imul(n - 1, es)) | 0;
    if ((n | 0) > 40) {
      // big arrays
      s = imul(n >> 3, es);
      pl = med3(pl, (pl + s) | 0, (pl + (s << 1)) | 0, cmpId) | 0;
      pm = med3((pm - s) | 0, pm, (pm + s) | 0, cmpId) | 0;
      pn = med3((pn - (s << 1)) | 0, (pn - s) | 0, pn, cmpId) | 0;
    }
    pm = med3(pl, pm, pn, cmpId) | 0;
  }
  
  // PVINIT
  // Unlike the original C implementation, we always swap here, since
  // in ECMAScript it is impossible to obtain the address of a local variable
  pv = a;
  swap(pv, pm, es);
  
  // pa = pb = a;
  pb = a;
  pa = pb;
  
  // pc = pd = a + (n - 1) * es;
  pd = (a + imul(n - 1, es)) | 0;
  pc = pd;
    
  for (;;) {
    // while (pb <= pc && (r = cmp(pb, pv)) <= 0)
    isTrue1 = (pb | 0) <= (pc | 0);
    if (isTrue1) {
      r = CMP_FUNCTION_TABLE[cmpId & 3](pb, pv) | 0;
      isTrue1 = (r | 0) <= 0;
    }
    
    while (isTrue1) {
      if ((r | 0) == 0) {
        swap(pa, pb, es);
        pa = (pa + es) | 0;
      }

      pb = (pb + es) | 0;
      
      isTrue1 = (pb | 0) <= (pc | 0);
      if (isTrue1) {
        r = CMP_FUNCTION_TABLE[cmpId & 3](pb, pv) | 0;
        isTrue1 = (r | 0) <= 0;
      }
    }
    
    // while (pc >= pb && (r = cmp(pc, pv)) >= 0)
    isTrue1 = (pc | 0) >= (pb | 0);
    if (isTrue1) {
      r = CMP_FUNCTION_TABLE[cmpId & 3](pc, pv) | 0;
      isTrue1 = (r | 0) >= 0;
    }
    while (isTrue1) {
      if ((r | 0) == 0) {
        swap(pc, pd, es);
        pd = (pd - es) | 0;
      }
      
      pc = (pc - es) | 0;

      isTrue1 = (pc | 0) >= (pb | 0);
      if (isTrue1) {
        r = CMP_FUNCTION_TABLE[cmpId & 3](pc, pv) | 0;
        isTrue1 = (r | 0) >= 0;
      }
    }
    
    if ((pb | 0) > (pc | 0)) {
      break;
    }
    
    swap(pb, pc, es);
    pb = (pb + es) | 0;
    pc = (pc - es) | 0;
  }
  
  pn = (a + imul(n, es)) | 0;
  s = min((pa - a) | 0, (pb - pa) | 0);
  vecswap(a, (pb - s) | 0, s);
  s = min((pd - pc) | 0, (pn - pd - es) | 0);
  vecswap(pb, (pn - s) | 0, s);  
  
  s = (pb - pa) | 0;
  if ((s | 0) > (es | 0)) {
    qsortBM(a, ((s | 0) / (es | 0)) | 0, es, cmpId);
  }
  
  s = (pd - pc) | 0;
  if ((s | 0) > (es | 0)) {
    qsortBM((pn - s) | 0, ((s | 0) / (es | 0)) | 0, es, cmpId);
  }
}

function swap(a, b, n) {
  /*
   * Type annotations
   */
  a = a | 0;
  b = b | 0;
  n = n | 0;

  /*
   * Local variables
   */
  var t = 0;

  /*
   * Main
   */  
  for (; (n | 0) > 0; a = (a + 1) | 0, b = (b + 1) | 0, n = (n - 1) | 0) {
    t = U1[a >> 0] | 0;
    U1[a >> 0] = U1[b >> 0];
    U1[b >> 0] = t | 0;
  }
}

function vecswap(a, b, n) {
  /*
   * Type annotations
   */
  a = a | 0;
  b = b | 0;
  n = n | 0;

  /*
   * Main
   */
  if ((n | 0) > 0) {
    swap(a, b, n);    
  }
}

function med3(a, b, c, cmpId) {
  /*
   * Type annotations
   */
  a = a | 0;
  b = b | 0;
  c = c | 0;
  cmpId = cmpId | 0;

  /*
   * Local variables
   */
  var t = 0;

  /*
   * Main
   */
  t = ((CMP_FUNCTION_TABLE[cmpId & 3](a, b) | 0) < 0) | 0;

  if (t) {
    // a < b

    t = ((CMP_FUNCTION_TABLE[cmpId & 3](b, c) | 0) < 0) | 0;
    
    if (t) {
      // a < b <c      
      return b | 0;
    }
    // a < b & b >= c    
    t = ((CMP_FUNCTION_TABLE[cmpId & 3](a, c) | 0) < 0) | 0;

    if (t) {
      // a < c <= b      
      return c | 0;
    }
    // c <= a < b
    return a | 0;
  }
  // b <= a

  t = ((CMP_FUNCTION_TABLE[cmpId & 3](b, c) | 0) > 0) | 0;
  
  if (t) {
    // c < b <= a
    return b | 0;
  }
  
  // b <= a & b <= c
  
  t = ((CMP_FUNCTION_TABLE[cmpId & 3](a, c) | 0) > 0) | 0;
  
  if (t) {
    // b <= c < a
    return c | 0;
  }
  // b <= a <= c
  return a | 0;
}