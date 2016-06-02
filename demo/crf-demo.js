(function() {
  'use strict';
  
  var MAX_PATH_LENGTH = 2048;
  var MAX_NUMBER_OF_STATES = 32;
  
  var crfMod = {};
  var heapSize = 1 << 28;
  var mod = {};
  var parsedData = {};
  var devData = {};
  var isAsmModuleLoaded = false;
  var isTraining = false;
  var isTrainUploaded = false;
  var isDevUploaded = false;
  
  // Based on jQuery
  function loadModuleAsync(url, callback) {
    var head = document.getElementsByTagName('head')[0] ||
      document.documentElement;
    var script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);

    var done = false;

    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function() {
      if (!done && (!this.readyState ||
        this.readyState === 'loaded' || this.readyState === 'complete')) {
          done = true;

          // Handle memory leak in IE
          script.onload = script.onreadystatechange = null;
          if (head && script.parentNode) {
            head.removeChild(script);
          }

          callback();
        }
    };

    head.insertBefore(script, head.firstChild);
  }
  
  function ConfusionMatrix(size) {
    var i = 0;
    var j = 0;
    
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
      result.precision[i] = result.tp[i] / (result.tp[i] + result.fp[i]);
      result.recall[i] = result.tp[i] / (result.tp[i] + result.fn[i]);
      
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
  
  function CrfModule(heapSize, labels) {
    this.heapSize = heapSize | 0;
    
    if (heapSize < (1 << 24)) { 
      throw new Error('heapSize too small');
    }
    
    var heap = new ArrayBuffer(heapSize);
    var tmpAllocation = 1 << 14;
    var stateDimension = 1 << 23;
    var totalDimension = 0;
    var numberOfStates = 0;
    
    var p = 0;
    
    this.TRAINING_SET_HEADER_SIZE = 1 << 20;
    this.DEVELOPMENT_SET_HEADER_SIZE = 1 << 20;
    this.KEY_VALUE_STORE_SIZE = 1 << 25;
    this.NZ_STORE_SIZE = 1 << 23;
    this.CORRECT_PATH_STORE_SIZE = 1 << 22;
    
    this.labels = labels;
    this.numberOfStates = this.labels.length;
    
    if (this.numberOfStates <= 0 || this.numberOfState >= MAX_NUMBER_OF_STATES) {
      throw new Error('invalid number of labels: ' + this.numberOfState);
    }
    
    this.stateDimension = stateDimension;
    this.totalDimension = stateDimension +
      (this.numberOfStates + 1) * this.numberOfStates + 1;
    
    this.heap = heap;
    this.I4 = new Int32Array(heap);
    this.F4 = new Float32Array(heap);
    this.mod = window.myAsmjsModule(window, {}, heap);
    
    this.tmpP = p;
    p += tmpAllocation;
    
    this.trainingSetP = p;
    this.trainingSetFreeP = p;
    p += this.TRAINING_SET_HEADER_SIZE;

    this.developmentSetP = p;
    this.developmentSetFreeP = p;
    p += this.DEVELOPMENT_SET_HEADER_SIZE;

    this.nzP = p;
    this.nzFreeP = p;
    p += this.NZ_STORE_SIZE;

    this.keyP = p;
    this.keyFreeP = p;
    p += this.KEY_VALUE_STORE_SIZE;

    this.valueP = p;
    this.valueFreeP = p;
    p += this.KEY_VALUE_STORE_SIZE;
    
    this.correctPathP = p;
    this.correctPathFreeP = p;
    p += this.CORRECT_PATH_STORE_SIZE;
    
    this.foiP = p;
    p += this.totalDimension << 2;

    this.soiP = p;
    p += this.totalDimension << 2;
    
    this.weightP = p;
    p += this.totalDimension << 2;
        
    this.lossP = p;
    p += 4;

    this.predictionP = p;
    p += MAX_PATH_LENGTH << 2;

    this.predictionScoreP = p;
    p += 4;

    this.tmp2P = p;
    p += this.mod.crf_getByteSize(this.numberOfStates, MAX_PATH_LENGTH,
      MAX_PATH_LENGTH * 32);
    
    if (p >= this.heapSize) {
      throw new Error('memory allocation exceeded the heap size');
    }
    
    this.round = 1;
    
    this.delta = 1.0;
    this.eta = 0.5;
    this.lambda = 0.0001;
    
    this.cumulativeLoss = 0.0;
    this.devLoss = 0.0;
    this.devIdCurrent = 0;
    this.trainDevCycle = 0;
    
    this.confusionMatrix = new ConfusionMatrix(this.numberOfStates);
  }
  
  CrfModule.prototype.trainOnline = function(instanceId) {
    var loss = 0.0;
    
    this.mod.crf_trainOnline(
      this.trainingSetP + (28 * instanceId),
      this.numberOfStates,
      this.stateDimension,
      this.round,
      this.foiP,
      this.soiP,
      this.weightP,
      this.delta,
      this.eta,
      this.lambda,
      this.tmp2P,
      this.lossP
    );
    
    this.round += 1;
    
    loss = +this.F4[this.lossP >> 2];
    
    if (loss !== loss) { // isNan
      throw new Error('loss NaN');
    }
    
    this.cumulativeLoss += loss;
    this.trainDevCycle += 1;
    
    return {
      loss: loss
    };
  };
  
  CrfModule.prototype.testDevStart = function(devSize) {
    if (devSize === undefined) {
      throw new Error('dev size undefined');
    }
        
    this.devLoss = 0.0;
    this.devIdCurrent = 0;
    this.devSize = devSize | 0;
    this.trainDevCycle = 0;
    
    this.mod.crf_adagradUpdateLazyRange(
      0,
      this.totalDimension,
      this.foiP,
      this.soiP,
      this.weightP,
      +(this.round),
      this.delta,
      this.eta,
      this.lambda
    );
    
    this.confusionMatrix.clear();
  };
  
  CrfModule.prototype.predictDev = function() {
    var i = 0;
    var instanceByteOffset = this.developmentSetP + (28 * this.devIdCurrent);
    var predicted = [];
    var pathLength = 0;
    var inspectedInstance = {};

    if (this.devIdCurrent >= this.devSize) {
      this.trainDevCycle = 0;
      this.devIdCurrent = 0;
      return false;
    }
    
    this.mod.crf_predict(
      instanceByteOffset,
      this.numberOfStates,
      this.stateDimension,
      this.weightP,
      this.tmp2P,
      this.lossP,
      this.predictionP,
      this.predictionScoreP
    );
    
    this.devLoss += this.F4[this.lossP >> 2];
    this.devIdCurrent += 1;
    
    
    pathLength = this.I4[(instanceByteOffset + 4) >> 2];
    for (i = 0; i < pathLength; i += 1) {
      predicted.push(this.I4[(this.predictionP + (i << 2)) >> 2]);      
    }
    inspectedInstance = this.inspectInstance(this.devIdCurrent - 1, 'dev');
    
    for (i = 0; i < pathLength; i += 1) {
      this.confusionMatrix.put(inspectedInstance.correctPath[i], predicted[i]);
    }
    
    return true;
  };
  
  CrfModule.prototype.averagedLoss = function() {
    return this.cumulativeLoss / this.round;
  };
  
  CrfModule.prototype.inspectInstance = function(instanceId, type) {
    var i = 0;
    var byteOffset = 0;
    var result = {};
    
    if (type === 'dev') {
      byteOffset = this.developmentSetP + (28 * instanceId);
    } else {
      byteOffset = this.trainingSetP + (28 * instanceId);
    }
    
    result.pathLength = this.I4[(byteOffset + 4) >> 2];
    result.nzByteOffset = this.I4[(byteOffset + 12) >> 2];
    result.nz = [];
    for (i = 0; i < result.pathLength; i += 1) {
      result.nz.push(this.I4[(result.nzByteOffset + (i << 2)) >> 2]);
    }
    
    result.correctPathByteOffset = this.I4[(byteOffset + 24) >> 2];
    result.correctPath = [];
    for (i = 0; i < result.pathLength; i += 1) {
      result.correctPath.push(
        this.I4[(result.correctPathByteOffset + (i << 2)) >> 2]);
    }
    
    result.valueByteOffset = this.I4[(byteOffset + 16) >> 2];
    result.indexByteOffset = this.I4[(byteOffset + 20) >> 2];
    result.valuesFirstPosition = [];
    result.indicesFirstPosition = [];

    for (i = 0; i < result.pathLength; i += 1) {
      result.valuesFirstPosition.push(
        this.F4[(result.valueByteOffset + (i << 2)) >> 2]
      );
      result.indicesFirstPosition.push(
        this.I4[(result.indexByteOffset + (i << 2)) >> 2]
      );
    }
    
    return result;
  };
  
  CrfModule.prototype.putInstanceHeader = function(pathLength, type) {
    pathLength |= 0;
    type = (type === undefined) ? 'train' : type;

    var freePointer = 0;
    
    if (type === 'dev') {
      if (this.developmentSetFreeP >=
          (this.developmentSetP + this.DEVELOPMENT_SET_HEADER_SIZE)) {
        throw new Error('training data store exhausted; allocate larger space');
      }
      freePointer = this.developmentSetFreeP;
    } else {
      if (this.trainingSetFreeP >=
          (this.trainingSetP + this.TRAINING_SET_HEADER_SIZE)) {
        throw new Error('training data store exhausted; allocate larger space');
      }      
      freePointer = this.trainingSetFreeP;      
    }

    this.I4[(freePointer + 4) >> 2] = pathLength;
    this.I4[(freePointer + 12) >> 2] = this.nzFreeP;
    this.I4[(freePointer + 16) >> 2] = this.valueFreeP;
    this.I4[(freePointer + 20) >> 2] = this.keyFreeP;
    this.I4[(freePointer + 24) >> 2] = this.correctPathFreeP;
    
    if (type === 'dev') {
      this.developmentSetFreeP += 28;
    } else {
      this.trainingSetFreeP += 28;      
    }
  };
  
  CrfModule.prototype.putNz = function(nz) {
    if (this.nzFreeP >= (this.nzP + this.NZ_STORE_SIZE)) {
      throw new Error('nonzero data store exhausted; allocate larger space');
    }
    
    nz |= 0;
    
    this.I4[this.nzFreeP >> 2] = nz;
    this.nzFreeP += 4;
  };
  
  CrfModule.prototype.putCorrectPath = function(stateId) {
    if (this.correctPathFreeP >= (this.correctPathP +
        this.CORRECT_PATH_STORE_SIZE)) {
      throw new Error('supervisory data store exhausted; allocate larger space');
    }
    
    stateId |= 0;
    
    this.I4[this.correctPathFreeP >> 2] = stateId;
    this.correctPathFreeP += 4;
  };
  
  CrfModule.prototype.putKeyValue = function(key, value) {
    if (this.valueFreeP >= (this.valueP + this.KEY_VALUE_STORE_SIZE) ||
        this.keyFreeP >= (this.keyP + this.KEY_VALUE_STORE_SIZE)) {
      throw new Error('key-value store exhausted; allocate larger space');
    }

    this.F4[this.valueFreeP >> 2] = value
    this.valueFreeP += 4;
    
    this.I4[this.keyFreeP >> 2] = key;
    this.keyFreeP += 4;
  };
  
  CrfModule.prototype.putInstance = function(instance, type) {
    function putUtf16(heap, p, str) {
      var i = 0;
      var ch = 0;
      var u2 = new Uint16Array(heap);
    
      for (i = 0; i < str.length; i += 1) {
        ch = str.charCodeAt(i);
        u2[p >> 1] = ch;
        p += 2;
      }
    }
    
    var pathLength = 0;
    
    type = (type === undefined) ? 'train' : type;
    
    pathLength = instance.items.length;
    
    // TODO: this is the source of several bugs. fix this
    // if (pathLength > MAX_PATH_LENGTH) {
    //   console.log('we ignored an instance which length exceeds the limit')
    //   return;
    // }
    
    this.putInstanceHeader(pathLength, type);
    
    instance.items.forEach(function(item) {
      var attributes = item.attributes;
      
      this.putNz(Object.getOwnPropertyNames(attributes).length);
      
      this.putCorrectPath(this.labels.indexOf(item.label));
      
      Object.getOwnPropertyNames(attributes).forEach(function(key) {
        var hashValue = 0.0;

        putUtf16(this.heap, this.tmpP, key);
        hashValue = this.mod.hash(this.tmpP, key.length * 2, 0);

        this.putKeyValue(hashValue, +attributes[key]);
      }, this);
    }, this);
  }
  
  function getDataSetInfo(dataSet) {
    var info = {
      numberOfInstances: 0,
      totalPathLength: 0,
      maximumPathLength: 0,
      averagePathLength: 0,
      labels: {},
      features: {}
    };
    
    dataSet.data.forEach(function(datum) {
      info.numberOfInstances += 1;
      info.averagePathLength += datum.items.length;

      datum.items.forEach(function(item) {
        if (item.label === undefined) {
          info.labels[item.label] = 1;
        } else {
          info.labels[item.label] += 1;
        }

        Object.getOwnPropertyNames(item.attributes).forEach(function(attr) {
          info.features[attr] = 1;
        });
      });

      if (datum.items.length > 1000) {
        console.log(datum.items);
      }

      info.maximumPathLength = Math.max(info.maximumPathLength, datum.items.length);
    });
    
    info.averagePathLength /= info.numberOfInstances;

    info.numberOfLabels = Object.getOwnPropertyNames(info.labels). length;
    info.numberOfFeatures = Object.getOwnPropertyNames(info.features).length;

    return info;
  }

  /**
   * Converts the CRFsuite data format into a json object.
   *
   * @param {string} data
   * @returns {object}
   */
  function parseDataString(data) {
    var lines = [];
    var result = {meta: '', data: []};
    var datum = {meta: '', items: []};

    if (typeof data !== 'string') {
      throw new TypeError('Input must be a string');
    }

    lines = data.split('\n');

    lines.forEach(function(line) {
      var fields = [];
      var attributes = {};

      fields = line.split(/\t| /);

      if (line === '') {
        if (datum.items.length > 0) {
          result.data.push(datum);
          datum = {meta: '', items: []};
        }
      } else if (fields.length > 0) {
        attributes = parseAttributes(fields.slice(1));
        datum.items.push({
          label: fields[0],
          attributes: attributes
        });
      } else {
        throw new TypeError('Invalid format: ' + line);
      }
    });

    if (datum.items.length > 0) {
      result.data.push(datum);
    }

    return result;
  }

  function parseAttributes(fields) {
    var attributes = {};

    fields.map(function(field) {
      var key = '';
      var value = 1.0;
      var split = [];

      if (typeof field !== 'string') {
        throw new TypeError('Input must be an array of string');
      }

      split = field.match(/(\\.|[^:])+/g);
    
      if (split.length === 2) {
        value = parseFloat(split[1]);
        if (isNaN(value) || !isFinite(value) || value === -0) {
          throw new TypeError(`Invalid format for a field: ${field}`);
        }
      } else if (field.match(/[^\\](\:)$/) !== null || split.length !== 1) {
        throw new TypeError(`Invalid format for a field: ${field}`);
      }
    
      key = split[0].replace('\\\\', '\\').replace('\\:', ':');

      attributes[key] = value;
    });

    return attributes;
  }

  //http://stackoverflow.com/a/14428340
  function formatNumber(number, n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return (number).toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
  };
  
  function loop() {
    var now = performance.now;
    var step = 1;
    var trainStep = 5;
    var trainBatchSize = 1;
    var refreshStep = 10;
    var ms = 0;
    var fps = 0;
    var devCount = 8000;
    var isProcessingDev = false;

    function loopSub() {
      var i = 0;
      var t = 0;
      var id = 0;
      
      if (isTraining) {
        setTimeout(loopSub, 1);
      }

      // trainStep = 100;
      // try {
        if (isProcessingDev) {
          if (((ms % trainStep) | 0) === 0) {
            for (i = 0; i < trainBatchSize; i += 1) {
              t = crfMod.predictDev();
              if (t === false) {
                isProcessingDev = false;
                crfMod.trainDevCycle = 0;
                console.log(crfMod.confusionMatrix.report());
                break;
              }
            }
          }
        } else if (crfMod.trainDevCycle < devCount) {
          if (((ms % trainStep) | 0) === 0) {
            for (i = 0; i < trainBatchSize; i += 1) {
              id = (Math.random() * parsedData.data.length) | 0;
              crfMod.trainOnline(id);
            }
          }
        } else {
          crfMod.testDevStart(devData.data.length);
          isProcessingDev = true;
        }
      // } catch (e) {
      //   alert('Error occurred: ' + e.message);
      // } finally {
      // }
      
      ms += 1;
      if (((ms % refreshStep) | 0) === 0) {
        showRound(crfMod.round);
        t = performance.now();
        
        fps = (refreshStep * 1000) / (t - now);
        
        showPerformance(fps);
        now = t;
        
        if (fps < 60) {
          if (trainBatchSize > 1) {
            trainBatchSize -= 1;
          } else {
            trainStep += 1;            
          }
        } else if ((fps > 120) && (trainStep > 1)) {
          trainStep -= 1;
        } else if ((fps > 120) && (trainStep === 1) && (trainBatchSize < 100)) {
          trainBatchSize += 1;
        }
        
        showDataPerSec((trainBatchSize * 1000) / trainStep);
        
        showCumulativeLoss(crfMod.cumulativeLoss);
        showAveragedLoss(crfMod.averagedLoss());
        showDevLoss(crfMod.devLoss);
        ms = 0;
      }
    }
    
    loopSub();
  }
  
  
  function showRound(round) {
    if ((crfMod !== undefined) && (crfMod !== null)) {
      d3.select('#round').text(round);
    } else {
      d3.select('#round').text('N/A');
    }
  }

  function showDevLoss(loss) {
    if ((crfMod !== undefined) && (crfMod !== null)) {
      d3.select('#dev-loss').text('dev loss: ' + loss);
    } else {
      d3.select('#round').text('N/A');
    }
  }
  
  function showPerformance(fps) {
    d3.select('#fps').text(fps.toFixed(1));
  }
  
  function showDataPerSec(dps) {
    d3.select('#dps').text('Data per sec: ' + dps.toFixed(1));
  }
  
  function showCumulativeLoss(cumulativeLoss) {
    d3.select('#cumulative-loss').text(cumulativeLoss);
  }

  function showAveragedLoss(averagedLoss) {
    d3.select('#averaged-loss').text(averagedLoss);
  }
  
  function start() {
    if ((crfMod !== undefined) && (crfMod !== null)
        && !isTraining && isTrainUploaded && isDevUploaded) {
      isTraining = true;
      loop();
    }
  }
  
  function stop() {
    isTraining = false;
  }
  
  function uploadTrain() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var uploadFile = this.files[0];
      var fileReader = new window.FileReader();
      
      if (!isAsmModuleLoaded) {
        alert('asm.js module not loaded.')
        return;
      }
      
      fileReader.onload = function() {
        parsedData = parseDataString(fileReader.result);
        var info = {};
        var i = 0;
        d3.select('#instance-size').html('instance size: ' + parsedData.data.length);
        info = getDataSetInfo(parsedData);
            
        crfMod = new CrfModule(heapSize,
          Object.getOwnPropertyNames(info.labels));
      
          try {
            for (i = 0; i < parsedData.data.length; i += 1) {
              crfMod.putInstance(parsedData.data[i]);            
            }      
          } catch (e) {
            alert('Error occurred: ' + e.message);
          } finally {
            console.log(crfMod);
          }

        isTrainUploaded = true;
        console.log(parsedData.data);
      };
    
      fileReader.readAsText(uploadFile);
    } else {
      alert('Your browser does not support required functions. ' +
        'Try IE10+ or other browsers.');
    }
  }
  
  function uploadDev() {
    if (!isTrainUploaded) {
      alert('Upload training data first');
      return;
    }
    
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var uploadFile = this.files[0];
      var fileReader = new window.FileReader();
      
      if (!isAsmModuleLoaded) {
        alert('asm.js module not loaded.')
        return;
      }
      
      fileReader.onload = function() {
        var info = {};
        var i = 0;
        devData = parseDataString(fileReader.result);
        info = getDataSetInfo(devData);
        
        console.log(devData);

        try {
          for (i = 0; i < devData.data.length; i += 1) {
            crfMod.putInstance(devData.data[i], 'dev');            
          }      
        } catch (e) {
          alert('Error occurred during handling development data: ' + e.message);
        }
        isDevUploaded = true;
      };
    
      fileReader.readAsText(uploadFile);
    } else {
      alert('Your browser does not support required functions. ' +
        'Try IE10+ or other browsers.');
    }
  }
  
  function main() {
    d3.select('#heap-size')
      .html('heap size: ' + formatNumber(heapSize) + ' bytes');

    d3.select('#start').on('click', start);
    d3.select('#stop').on('click', stop);
  
    d3.select("#upload-train").on("change", uploadTrain);
    d3.select("#upload-dev").on("change", uploadDev);
  
    loadModuleAsync('../main.js', function() {
      isAsmModuleLoaded = true;
    });
  }

  main();
})();