(function() {
  'use strict';
  
  var MAX_PATH_LENGTH = 256;
  var MAX_NUMBER_OF_STATES = 32;
  
  var crfMod = {};
  var heapSize = 1 << 28;
  var mod = {};
  var parsedData = {};
  var isAsmModuleLoaded = false;
  var isTraining = false;
  
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
  
  function CrfModule(heapSize, labels) {
    this.heapSize = heapSize | 0;
    
    if (heapSize < (1 << 24)) { 
      throw new Error('heapSize too small');
    }
    
    var heap = new ArrayBuffer(heapSize);
    var tmpAllocation = 1 << 14;
    var stateDimension = 1 << 20;
    var totalDimension = 0;
    var numberOfStates = 0;
    
    var p = 0;
    
    this.TRAINING_SET_HEADER_SIZE = 1 << 20;
    this.KEY_VALUE_STORE_SIZE = 1 << 23;
    this.NZ_STORE_SIZE = 1 << 22;
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

    this.tmp2P = p;
    p += this.mod.crf_getByteSize(this.numberOfStates, MAX_PATH_LENGTH,
      MAX_PATH_LENGTH * 32);
    
    if (p >= this.heapSize) {
      throw new Error('memory allocation exceeded the heap size');
    }
    
    this.round = 1;
    
    this.delta = 1.0;
    this.eta = 1.0;
    this.lambda = 0.0001;
    
    this.cumulativeLoss = 0.0;
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
    
    return {
      loss: loss
    };
  };
  
  CrfModule.prototype.averagedLoss = function() {
    return this.cumulativeLoss / this.round;
  };
  
  CrfModule.prototype.inspectInstance = function(instanceId) {
    var i = 0;
    var byteOffset = this.trainingSetP + (28 * instanceId);
    var result = {};
    
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
    
    return result;
  };
  
  CrfModule.prototype.putTrainingHeader = function(pathLength) {
    if (this.trainingSetFreeP >=
        (this.trainingSetP + this.TRAINING_SET_HEADER_SIZE)) {
      throw new Error('training data store exhausted; allocate larger space');
    }
    
    pathLength |= 0;

    this.I4[(this.trainingSetFreeP + 4) >> 2] = pathLength;
    this.I4[(this.trainingSetFreeP + 12) >> 2] = this.nzFreeP;
    this.I4[(this.trainingSetFreeP + 16) >> 2] = this.valueFreeP;
    this.I4[(this.trainingSetFreeP + 20) >> 2] = this.keyFreeP;
    this.I4[(this.trainingSetFreeP + 24) >> 2] = this.correctPathFreeP;
    
    this.trainingSetFreeP += 28;
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
    
    this.I4[this.correctPathFreeP] = stateId;
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
  
  CrfModule.prototype.putInstance = function(instance) {
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
    
    var pathLength = instance.items.length;
    
    if (pathLength > MAX_PATH_LENGTH) {
      console.log('we ignored an instance which length exceeds the limit')
      return;
    }
    
    this.putTrainingHeader(pathLength);
    
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
  
  function train() {
    var now = performance.now;
    var step = 3;
    var ms = 0;

    function trainSub() {
      var i = 0;
      var t = 0;
      var id = 0;
      
      if (isTraining) {
        setTimeout(trainSub, step);
      }

      try {
        for (i = 0; i < 1; i += 1) {
          id = (Math.random() * parsedData.data.length) | 0;
          crfMod.trainOnline(id);
        }
      } catch (e) {
        alert('Error occurred: ' + e.message);
      } finally {
      }
      
      ms += step;
      if (ms >= 50) {
        showRound(crfMod.round);
        t = performance.now();
        showPerformance(2000 / (t - now));
        now = t;
        
        showCumulativeLoss(crfMod.cumulativeLoss);
        showAveragedLoss(crfMod.averagedLoss());
        ms = 0;
      }
    }
    
    trainSub();
  }
  
  
  function showRound(round) {
    if ((crfMod !== undefined) && (crfMod !== null)) {
      d3.select('#round').text(round);
    } else {
      d3.select('#round').text('N/A');
    }
  }
  
  function showPerformance(fps) {
    d3.select('#fps').text(fps.toFixed(1));
  }
  
  function showCumulativeLoss(cumulativeLoss) {
    d3.select('#cumulative-loss').text(cumulativeLoss);
  }

  function showAveragedLoss(averagedLoss) {
    d3.select('#averaged-loss').text(averagedLoss);
  }
  
  function start() {
    if ((crfMod !== undefined) && (crfMod !== null) && !isTraining) {
      isTraining = true;
      train();
    }
  }
  
  function stop() {
    isTraining = false;
  }
  
  function fileUpload() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      var uploadFile = this.files[0];
      var fileReader = new window.FileReader();
      
      if (!isAsmModuleLoaded) {
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
      
        console.log(parsedData.data);
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
  
    d3.select("#file-upload").on("change", fileUpload);
  
    loadModuleAsync('../main.js', function() {
      isAsmModuleLoaded = true;
    });
  }

  main();
})();