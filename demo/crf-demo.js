require(['./crf'], function(CRF) {
  'use strict';
  
  var crf = {};
  var heapSize = 1 << 29;
  var mod = {};
  var parsedData = {};
  var devData = {};
  var isAsmModuleLoaded = false;
  var isTraining = false;
  var isTrainUploaded = false;
  var isDevUploaded = false;
  
  var DEV_TEST_CYCLE = 10000;
  var ROUNDING_TEST_ROUND = 80000;

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
  
  function inspectSparseVector(heap, nz, valueP, indexP) {
    var i = 0;
    var result = {};
    var f4 = new Float32Array(heap);
    var i4 = new Int32Array(heap);
    
    result.nz = nz;
    result.values = [];
    result.indices = [];
    
    for (i = 0; i < nz; i += 1) {
      result.values.push(f4[valueP >> 2]);
      result.indices.push(i4[indexP >> 2]);
      valueP += 4;
      indexP += 4;
    }
    
    return result;
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
    var devCount = DEV_TEST_CYCLE;
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
              t = crf.predictDev();
              if (t === false) {
                isProcessingDev = false;
                crf.trainDevCycle = 0;
                console.log(crf.confusionMatrix.report());
                break;
              }
            }
          }
        } else if (crf.trainDevCycle < devCount) {
          if (((ms % trainStep) | 0) === 0) {
            for (i = 0; i < trainBatchSize; i += 1) {
              id = (Math.random() * crf.numberOfTrainingData) | 0;

              crf.trainOnline(id);
            }
          }
        } else {
          crf.testDevStart(crf.numberOfDevData);
          isProcessingDev = true;
        }
      // } catch (e) {
      //   alert('Error occurred: ' + e.message);
      // } finally {
      // }
      
      ms += 1;
      if (((ms % refreshStep) | 0) === 0) {
        showRound(crf.round);
        t = performance.now();
        
        fps = (refreshStep * 1000) / (t - now);
        
        showPerformance(fps);
        now = t;
        
        if (fps < 80) {
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
        
        showCumulativeLoss(crf.cumulativeLoss);
        showAveragedLoss(crf.averagedLoss());
        showDevLoss(crf.devLoss);
        ms = 0;
      }
    }
    
    loopSub();
  }
  
  function showRound(round) {
    if ((crf !== undefined) && (crf !== null)) {
      d3.select('#round').text('round: ' + round);
    } else {
      d3.select('#round').text('N/A');
    }
  }

  function showDevLoss(loss) {
    if ((crf !== undefined) && (crf !== null)) {
      d3.select('#dev-loss').text('test loss: ' + loss);
    } else {
      d3.select('#dev-loss').text('N/A');
    }
  }
  
  function showPerformance(fps) {
    d3.select('#fps').text(fps.toFixed(1));
  }
  
  function showDataPerSec(dps) {
    d3.select('#dps').text('Data per sec: ' + dps.toFixed(1));
  }
  
  function showCumulativeLoss(cumulativeLoss) {
    d3.select('#cumulative-loss').text('Cumulative loss: ' + cumulativeLoss);
  }

  function showAveragedLoss(averagedLoss) {
    d3.select('#averaged-loss').text('Averaged loss: ' + averagedLoss);
  }
  
  function start() {
    if ((crf !== undefined) && (crf !== null)
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
        var info = {};
        var i = 0;

        crf = CRF.create(heapSize);
        try {   
          crf.parseDataString(fileReader.result, 'train');
        } catch (e) {
          alert('Error occurred: ' + e.message);
        }
        
        d3.select('#train-size').html(crf.numberOfTrainingData);
        d3.select('#train-class').html(Array.from(crf.labelSet).length);

        isTrainUploaded = true;
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
        try {
          crf.parseDataString(fileReader.result, 'dev');
        } catch (e) {
          alert('Error occurred during handling test data: ' + e.message);
        }
        
        d3.select('#test-size').html(crf.numberOfDevData);
        
        console.log(crf.labels);
        
        // info = getDataSetInfo(devData);
        //
        // console.log(devData);

        // try {
       //    for (i = 0; i < devData.data.length; i += 1) {
       //      crf.putInstance(devData.data[i], 'dev');
       //    }
       //  } catch (e) {
       //    alert('Error occurred during handling development data: ' + e.message);
       //  }
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

    isAsmModuleLoaded = true;

    // loadModuleAsync('../main.js', function() {
    //   isAsmModuleLoaded = true;
    // });
  }

  main();
});