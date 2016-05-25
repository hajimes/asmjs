(() => {
  'use strict';
  
  const del = require('del');
  const gulp = require('gulp');
  const shell = require('gulp-shell');
  
  const ISTANBUL_COMMAND = './node_modules/istanbul/lib/cli.js' +
    ' cover ./node_modules/mocha/bin/_mocha -- -R spec test/*Spec.js';
  
  gulp.task('istanbul', [], shell.task([ISTANBUL_COMMAND]));

  gulp.task('test', ['istanbul']);

  gulp.task('clean', callback => {
    del(['coverage'], callback);
  });
})();
