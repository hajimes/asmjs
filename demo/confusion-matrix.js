define([], function() {
  'use strict';

  function ConfusionMatrix(size) {
    var i = 0;
    var j = 0;
    
    if (size <= 0) {
      throw new RangeError('size must be more than 0');
    }
    
    this.table = [];
    this.size = size;
    this.total = 0;
    
    for (i = 0; i < size; i += 1) {
      this.table.push([]);
      for (j = 0; j < size; j += 1) {
        this.table[i][j] = 0.0;
      }
    }
  }
  
  ConfusionMatrix.prototype.put = function(correct, predicted) {
    this.table[correct][predicted] += 1.0;
    this.total += 1;
  };
  
  ConfusionMatrix.prototype.report = function() {
    var i = 0;
    var j = 0;
    
    var result = {
      full: this.table,
      accuracy: 0.0,
      labelCount: [],
      precision: [],
      recall: [],
      macroPrecision: 0.0,
      macroRecall: 0.0,
      macroF1: 0.0,
      tp: [],
      fp: [],
      fn: [],
      f1: [],
    };
    
    var v = 0.0;
    
    for (i = 0; i < this.size; i += 1) {
      result.labelCount[i] = 0;
      result.tp[i] = 0;
      result.fp[i]= 0;
      result.fn[i] = 0;
    }
    
    for (i = 0; i < this.size; i += 1) {
      for (j = 0; j < this.size; j += 1) {
        v = this.table[i][j];
        if (i === j) {
          result.accuracy += v;
          result.tp[i] += v;
        } else {
          result.fp[j] += v;
          result.fn[i] += v;
        }
      }
    }
    
    for (i = 0; i < this.size; i += 1) {
      if (result.tp[i] + result.fp[i] === 0.0) {
        result.precision[i] = 0.0;
      } else {
        result.precision[i] = result.tp[i] / (result.tp[i] + result.fp[i]);
      }
      if (result.tp[i] + result.fn[i] === 0.0) {
        result.recall[i] = 0.0;
      } else {
        result.recall[i] = result.tp[i] / (result.tp[i] + result.fn[i]);        
      }
      
      result.macroPrecision += result.precision[i];
      result.macroRecall += result.recall[i];
      
      result.f1[i] = 2 * result.precision[i] * result.recall[i] /
        (result.precision[i] + result.recall[i]);
    }
    
    result.macroPrecision /= this.size;
    result.macroRecall /= this.size;
    result.macroF1 = 2 * result.macroPrecision * result.macroRecall /
    (result.macroPrecision + result.macroRecall);
    
    result.accuracy /= this.total;

    return result;
  };
  
  ConfusionMatrix.prototype.clear = function() {
    var i = 0;
    var j = 0;
    
    for (i = 0; i < this.size; i += 1) {
      for (j = 0; j < this.size; j += 1) {
        this.table[i][j] = 0.0;
      }
    }
    
    this.total = 0;
  };

  return ConfusionMatrix;
});