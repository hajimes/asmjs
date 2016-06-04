export default function rounding(p, len, m, degree) {
  /*
   * Type annotations
   */
  p = p | 0;
  len = len | 0;
  m = m | 0;
  degree = degree | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var v = 0.0;
  var t = 0;
  var quant = 0.0;
  var maxValue = 0;
  var minValue = 0;

  /*
   * Main
   */
  quant = pow(2.0, +(degree | 0));
  maxValue = ((1 << (m + degree)) - 1) | 0;
  minValue = -maxValue | 0;
  
  for (i = 0; (i | 0) < (len | 0); i = (i + 1) | 0) {
    v = +F4[p >> 2];

    v = v * quant;
    t = ~~v;
    
    t = min(t | 0, maxValue | 0);
    t = max(t | 0, minValue | 0);
    v = +(t | 0);
    v = v / quant;

    F4[p >> 2] = v;
    
    p = (p + 4) | 0;
  }
}