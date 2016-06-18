define(['./confusion-matrix'], function(ConfusionMatrix) {
  'use strict';
  
  /********************
   * Private constants
   ********************/
  var MAX_PATH_LENGTH = 2048;
  var MAX_NUMBER_OF_STATES = 64;
  var ROUNDING_TEST_ROUND = 8000000;
  var INSTANCE_HEADER_BYTE_SIZE = 28;

  /**
   * Facade object for the backend asm.js module.
   *
   * Use a factory method <code>CRF.create</code> to create a new instance.
   */
  function CRF(asmlib, heapSize, labels) {    
    heapSize = heapSize | 0;
    if (heapSize < (1 << 24)) {
      throw new Error('heapSize too small');
    }
    this.heapSize = heapSize | 0;
  
    var global = {};
    var heap = new ArrayBuffer(heapSize);
    var tmpAllocation = 1 << 14;
    var stateDimension = 1 << 20;
    var totalDimension = 0;
    var numberOfStates = 0;
  
    var p = 0;
  
    this.TRAINING_SET_HEADER_SIZE = 1 << 20;
    this.DEVELOPMENT_SET_HEADER_SIZE = 1 << 20;
    this.KEY_VALUE_STORE_SIZE = 1 << 25;
    this.NZ_STORE_SIZE = 1 << 23;
    this.CORRECT_PATH_STORE_SIZE = 1 << 22;
  
    // this.labels = labels;
    this.labels = [];
    this.numberOfStates = this.labels.length;
    this.numberOfStates = 3;
  
    if (this.numberOfStates < 0 || this.numberOfStates >= MAX_NUMBER_OF_STATES) {
      throw new Error('invalid number of labels: ' + this.numberOfStates);
    }
  
    this.stateDimension = stateDimension;
    this.totalDimension = stateDimension +
      ((this.numberOfStates + 1) * this.numberOfStates + this.numberOfStates) +
     1;

    global = getGlobal(); 
  
    this.heap = heap;
    this._I4 = new Int32Array(heap);
    this._F4 = new Float32Array(heap);
    this._U1 = new Uint8Array(heap);
    this.mod = asmlib(global, {}, heap);
  
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
    p += this.mod.learn_crf_getByteSize(this.numberOfStates, MAX_PATH_LENGTH,
      MAX_PATH_LENGTH * 40);
  
    if (p >= this.heapSize) {
      console.log(this.mod.learn_crf_getByteSize(this.numberOfStates, MAX_PATH_LENGTH,
        MAX_PATH_LENGTH * 40));
      throw new Error('memory allocation exceeded the heap size');
    }
    
    this._crfMemoryAllocationEnd = p;
  
    this.round = 1;
  
    this.delta = 1.0;
    this.eta = 1.0;
    this.lambda = 0.0001;
  
    this.cumulativeLoss = 0.0;
    this.devLoss = 0.0;
    this.devIdCurrent = 0;
    this.trainDevCycle = 0;
  
    this.confusionMatrix = {};
  
    this.numberOfTrainingData = 0;
    this.numberOfDevData = 0;
    
    this.featureSet = new Set();
  
    for (var i = 0; i < this.totalDimension; i += 1) {
      this._F4[(this.soiP + (i << 2)) >> 2] = 1.0;
    }
  }
  
  CRF.create = function(asmlib, heapSize) {
    heapSize = heapSize | 0;

    var global = {};
    
    if (heapSize === undefined) {
      throw new TypeError('undefined heapSize');
    }
    
    if (heapSize < (1 << 24)) {
      throw new RangeError('heapSize must be at least 1 << 24');
    }

    return new CRF(asmlib, heapSize, []);
  };
  
  CRF.initializeTrainer = function() {
  };

  CRF.prototype.trainOnline = function(instanceId) {
    var loss = 0.0;
  
    this.mod.learn_crf_trainOnline(
      this.trainingSetP + (INSTANCE_HEADER_BYTE_SIZE * instanceId),
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
  
    loss = +this._F4[this.lossP >> 2];
  
    if (loss !== loss) { // isNan
      throw new Error('loss NaN');
    }
  
    this.cumulativeLoss += loss;
    this.trainDevCycle += 1;
  
    return {
      loss: loss
    };
  };

  CRF.prototype.testDevStart = function(devSize) {
    if (devSize === undefined) {
      throw new Error('dev size undefined');
    }
    
    this.confusionMatrix = new ConfusionMatrix(this.numberOfStates);
    
    this.devLoss = 0.0;
    this.devIdCurrent = 0;
    this.devSize = devSize | 0;
    this.trainDevCycle = 0;
  
    this.mod.learn_adagrad_updateLazyRange(
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
  
    console.log('l0: ' + this.mod.math_l0(this.weightP, this.totalDimension));
  
    console.log(this.totalDimension);
  
    if (this.round >= ROUNDING_TEST_ROUND) {
      this.mod.math_rounding(this.weightP, this.totalDimension, 2, 1);
    }
  
    this.confusionMatrix.clear();
  };

  CRF.prototype.predictDev = function() {
    var i = 0;
    var instanceByteOffset = this.developmentSetP +
      (INSTANCE_HEADER_BYTE_SIZE * this.devIdCurrent);
    var predicted = [];
    var pathLength = 0;
    var inspectedInstance = {};

    if (this.devIdCurrent >= this.devSize) {
      this.trainDevCycle = 0;
      this.devIdCurrent = 0;
      return false;
    }
  
    this.mod.learn_crf_predict(
      instanceByteOffset,
      this.numberOfStates,
      this.stateDimension,
      this.weightP,
      this.tmp2P,
      this.lossP,
      this.predictionP,
      this.predictionScoreP
    );
  
    this.devLoss += this._F4[this.lossP >> 2];
    this.devIdCurrent += 1;
      
    pathLength = this._I4[(instanceByteOffset + 4) >> 2];
    for (i = 0; i < pathLength; i += 1) {
      predicted.push(this._I4[(this.predictionP + (i << 2)) >> 2]);      
    }
    inspectedInstance = this.inspectInstance(this.devIdCurrent - 1, 'dev');
  
    for (i = 0; i < pathLength; i += 1) {
      this.confusionMatrix.put(inspectedInstance.correctPath[i], predicted[i]);
    }
  
    return true;
  };

  CRF.prototype.averagedLoss = function() {
    return this.cumulativeLoss / this.round;
  };
  
  CRF.prototype.l0 = function() {
    return this.mod.math_l0(this.weightP, this.totalDimension);
  };

  CRF.prototype.estimateCompressedSize = function() {    
    this.mod.bit_deBruijnSelectInit(this._crfMemoryAllocationEnd);
    
    var l0 = this.mod.math_l0(this.weightP, this.totalDimension);
    
    return this.mod.bit_eliasFanoByteSize(this.totalDimension, l0,  
      this._crfMemoryAllocationEnd,
      this._crfMemoryAllocationEnd + 32) + l0 * 0.75;
  };

  CRF.prototype.meminfo = function() {
    var t = this._crfMemoryAllocationEnd;

    return {
      total: this.heapSize,
      free: this.heapSize - t
    };
  };

  CRF.prototype.inspectInstance = function(instanceId, type) {
    var i = 0;
    var byteOffset = 0;
    var result = {};
  
    if (type === 'dev') {
      byteOffset = this.developmentSetP +
        (INSTANCE_HEADER_BYTE_SIZE * instanceId);
    } else {
      byteOffset = this.trainingSetP +
        (INSTANCE_HEADER_BYTE_SIZE * instanceId);
    }
  
    result.pathLength = this._I4[(byteOffset + 4) >> 2];
    result.nzByteOffset = this._I4[(byteOffset + 12) >> 2];
    result.nz = [];
    for (i = 0; i < result.pathLength; i += 1) {
      result.nz.push(this._I4[(result.nzByteOffset + (i << 2)) >> 2]);
    }
  
    result.correctPathByteOffset = this._I4[(byteOffset + 24) >> 2];
    result.correctPath = [];
    for (i = 0; i < result.pathLength; i += 1) {
      result.correctPath.push(
        this._I4[(result.correctPathByteOffset + (i << 2)) >> 2]);
    }
  
    result.valueByteOffset = this._I4[(byteOffset + 16) >> 2];
    result.indexByteOffset = this._I4[(byteOffset + 20) >> 2];
    result.valuesFirstPosition = [];
    result.indicesFirstPosition = [];

    for (i = 0; i < result.nz[0]; i += 1) {
      result.valuesFirstPosition.push(
        this._F4[(result.valueByteOffset + (i << 2)) >> 2]
      );
      result.indicesFirstPosition.push(
        this._I4[(result.indexByteOffset + (i << 2)) >> 2] >>> 0
      );
    }
  
    return result;
  };

  CRF.prototype.getLabelId = function(label, appendable) {
    var labelId = 0;
    
    appendable = (appendable === undefined) ? false : appendable;
    
    labelId = this.labels.indexOf(label);
    
    if (labelId < 0) {
      if (appendable) {
        labelId = this.labels.length;
        this.labels.push(label);
        this.numberOfStates = this.labels.length;
      } else {
        throw new TypeError('invalid label: '  + label);
      }
    }
    
    return labelId;
  };

  CRF.prototype.appendInstanceHeader = function(pathLength, type) {
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

    this._I4[(freePointer + 4) >> 2] = pathLength;
    this._I4[(freePointer + 12) >> 2] = this.nzFreeP;
    this._I4[(freePointer + 16) >> 2] = this.valueFreeP;
    this._I4[(freePointer + 20) >> 2] = this.keyFreeP;
    this._I4[(freePointer + 24) >> 2] = this.correctPathFreeP;
  
    if (type === 'dev') {
      this.developmentSetFreeP += INSTANCE_HEADER_BYTE_SIZE;
    } else {
      this.trainingSetFreeP += INSTANCE_HEADER_BYTE_SIZE;      
    }
  };

  CRF.prototype.appendNz = function(nz) {
    if (this.nzFreeP >= (this.nzP + this.NZ_STORE_SIZE)) {
      throw new Error('nonzero data store exhausted; allocate larger space');
    }
  
    nz |= 0;
  
    this._I4[this.nzFreeP >> 2] = nz;
    this.nzFreeP += 4;
  };

  CRF.prototype.appendCorrectPath = function(stateId) {
    stateId |= 0;

    if (this.correctPathFreeP >= (this.correctPathP +
        this.CORRECT_PATH_STORE_SIZE)) {
      throw new Error('supervisory data store exhausted; allocate larger space');
    }
   
    this._I4[this.correctPathFreeP >> 2] = stateId;
    this.correctPathFreeP += 4;
  };

  CRF.prototype.appendKeyValue = function(key, value) {
    if (this.valueFreeP >= (this.valueP + this.KEY_VALUE_STORE_SIZE) ||
        this.keyFreeP >= (this.keyP + this.KEY_VALUE_STORE_SIZE)) {
      throw new Error('key-value store exhausted; allocate larger space');
    }

    this._F4[this.valueFreeP >> 2] = value;
    this.valueFreeP += 4;
  
    this.featureSet.add(key);
  
    this._I4[this.keyFreeP >> 2] = key;
    this.keyFreeP += 4;
  };

  /**
   * Appends an instance object into the heap.
   *
   * Sample of an instance object:
   *
   * {
   *   items: [
   *     {
   *       label: 'INTJ',
   *       keys: ['w[0]=hello', 'w[1]=,'],
   *       values: [1.0, 0.5]
   *     },
   *     {
   *       label: 'PUNCT',
   *       keys: ['w[0]=,', 'w[-1]=hello', 'w[1]=world'],
   *       values: [1.0, 1.0, 1.0]
   *     },
   *     {
   *       label: 'NOUN',
   *       keys: ['w[0]=world', 'w[-1]=,'],
   *       values: [1.0, 1.0, 1.0]
   *     }
   *   ]
   * }
   */
  CRF.prototype.appendInstance = function(instance, type) {
    var i = 0;
    var j = 0;
    var item = {};
    var hashValue = 0;
    var pathLength = 0;
    var nz = 0;
    var key = '';
    var labelId = 0;
  
    type = (type === undefined) ? 'train' : type;
  
    pathLength = instance.items.length;
  
    // TODO: this is the source of several bugs. fix this
    // if (pathLength > MAX_PATH_LENGTH) {
    //   console.log('we ignored an instance which length exceeds the limit')
    //   return;
    // }
  
    this.appendInstanceHeader(pathLength, type);
  
    for (i = 0; i < pathLength; i += 1) {
      item = instance.items[i];
        
      nz = item.keys.length;
      if (nz !== item.values.length) {
        throw new TypeError('invalid item format: unmatched lengths');
      }
      
      this.appendNz(nz);
      
      if (type === 'train') {
        labelId = this.getLabelId(item.label, true);
      } else {
        labelId = this.getLabelId(item.label);
      }
      this.appendCorrectPath(labelId);
      
      for (j = 0; j < nz; j += 1) {
        key = item.keys[j];
        setUTF16LE(this._U1, this.tmpP, key);
        hashValue = this.mod.hash(this.tmpP, key.length * 2, 0);
        this.appendKeyValue(hashValue | 0, +(item.values[j]));
      }
    }
    
    if (type === 'train') {
      this.numberOfTrainingData += 1;      
    } else {
      this.numberOfDevData += 1;
    }
  };

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

    info.numberOfLabels = Object.getOwnPropertyNames(info.labels).length;
    info.numberOfFeatures = Object.getOwnPropertyNames(info.features).length;

    return info;
  }

  /**
   * @param {string} data
   * @returns {object} info of the dataset
   */
  CRF.prototype.parseDataString = function(data, type) {
    var i = 0;
    var line = '';
    var lines = [];
    var result = {meta: '', data: []};
    var instance = {meta: '', items: []};
    var fields = [];
    var attributes = {};
    var datum = {meta: '', items: []};
    
    if (typeof data !== 'string') {
      throw new TypeError('Input must be a string');
    }

    lines = data.split('\n');

    for (i = 0; i < lines.length; i += 1) {
      line = lines[i];

      fields = line.split(/\t| /);

      if (line === '') {
        if (datum.items.length > 0) {
          this.appendInstance(datum, type);
          
          datum = {meta: '', items: []};
        }
      } else if (fields.length > 0) {
        attributes = parseAttributes(fields.slice(1));
        datum.items.push({
          label: fields[0],
          keys: attributes.keys,
          values: attributes.values
        });
      } else {
        throw new TypeError('Invalid format: ' + line);
      }
    }

    if (datum.items.length > 0) {
      this.appendInstance(datum, type);
    }
  };
  
  /********************
   * Helper functions
   ********************/
  
  function getGlobal() {
    return (typeof window === 'undefined') ? global : window;  
  }
  
  function parseAttributes(fields) {
    var attributes = {
      keys: [],
      values: [],
    };

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
          throw new TypeError('Invalid format for a field: ' + field);
        }
      } else if (field.match(/[^\\](\:)$/) !== null || split.length !== 1) {
        throw new TypeError('Invalid format for a field: ' + field);
      }
  
      key = split[0].replace('\\\\', '\\').replace('\\:', ':');

      attributes.keys.push(key);
      attributes.values.push(value);
    });

    return attributes;
  }

  /**
   * @param {Uint8Array} u1
   * @param {int} p
   * @param {string} str
   */
  function setUTF16LE(u1, p, str) {
    p = p | 0;
    
    var i = 0;
    var ch = 0;

    for (i = 0; i < str.length; i += 1) {
      ch = str.charCodeAt(i);
      u1[p] = ch & 0xff;
      p += 1;
      u1[p] = ch >>> 8;
      p += 1;
    }
  }

  return CRF;
});