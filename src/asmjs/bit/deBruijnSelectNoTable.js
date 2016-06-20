/**
 * Returns the number of 1s in a 32-bit integer and
 * writes out the actual indices of the 1s (0 <= i < 32) into <code>outP</code>.
 * Each index occupies one byte, so at most 32 bytes (32 uint8 integers) will
 * be written into <code>outP</code>.
 *
 * This function can be slower than the version using pre-computed table
 * in some environments (10% slower in Firefox 45) but equally fast in other
 * cases.
 *
 * @param {int} n - 32-bit integer to be examined
 * @param {int} outP - byte offset into which the results are to be written
 * @returns {signed} - number of 1s found in a word
 *
 * @see Peter Wegner. 1960. A Technique for Counting Ones in a Binary Computer.
 *   Communications of the ACM, 3(5):322, May.
 * @see Charles E. Leiserson, Harald Prokop, and Keith H. Randall. 1998. Using
 *   de Bruijn Sequences to Index a 1 in a Computer Word. Technical report.
 */
export default function deBruijnSelectNoTable(n, outP) {
  /*
   * Type annotations
   */
  n = n | 0;
  outP = outP | 0;
  
  /*
   * Local variables
   */
  var i = 0;
  var t = 0;
  var offset = 0;
  var v = 0;

  /*
   * Main
   */
  while (n | 0) {
    // Since 2147483648 & -2147483648 returns -2147483648 in ECMAScript,
    // we need type casting (>>> 0) to unsigned.
    t = (n & -n) >>> 0;
    // 0x077cb531 is a de Bruijn sequence 00000111011111001011010100110001
    offset = imul(t, 0x077cb531) >>> 27;
    
    switch (offset | 0) {
      case 0:
        v = 0;
        break;
      case 1:
        v = 1;
        break;
      case 3:
        v = 2;
        break;
      case 7:
        v = 3;
        break;
      case 14:
        v = 4;
        break;
      case 29:
        v = 5;
        break;
      case 27:
        v = 6;
        break;
      case 23:
        v = 7;
        break;
      case 15:
        v = 8;
        break;
      case 31:
        v = 9;
        break;
      case 30:
        v = 10;
        break;
      case 28:
        v = 11;
        break;
      case 25:
        v = 12;
        break;
      case 18:
        v = 13;
        break;
      case 5:
        v = 14;
        break;
      case 11:
        v = 15;
        break;
      case 22:
        v = 16;
        break;
      case 13:
        v = 17;
        break;
      case 26:
        v = 18;
        break;
      case 21:
        v = 19;
        break;
      case 10:
        v = 20;
        break;
      case 20:
        v = 21;
        break;
      case 9:
        v = 22;
        break;
      case 19:
        v = 23;
        break;
      case 6:
        v = 24;
        break;
      case 12:
        v = 25;
        break;
      case 24:
        v = 26;
        break;
      case 17:
        v = 27;
        break;
      case 2:
        v = 28;
        break;
      case 4:
        v = 29;
        break;
      case 8:
        v = 30;
        break;
      case 16:
        v = 31;
        break;
    }
    
    U1[(outP + i) >> 0] = v | 0;
    n = (n - t) | 0;
    i = (i + 1) | 0;
  }

  return i | 0;
}

/*
script to create the switch-case statement
(function () {  
  console.log('switch (offset) {');
  for (i = 0; (i | 0) < 32; i = (i + 1) | 0) {
    offset = (0x077cb531 << i) >>> 27;
    console.log('  case ' + offset + ':')
    console.log('    v = ' + i + ';');
    console.log('    break;');
  }
  console.log('}');
})();
*/