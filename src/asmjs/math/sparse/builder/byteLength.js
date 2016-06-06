export default function sparseBuilderByteLength(tableSize, maxNumberOfKeys) {
  /*
   * Type annotations
   */
  tableSize = tableSize | 0;
  maxNumberOfKeys = maxNumberOfKeys | 0;

  /*
   * Main
   */
  return (32 + (tableSize << 2) + imul(maxNumberOfKeys << 2, 3)) | 0;
}