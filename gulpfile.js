(() => {
  'use strict';
  
  const concat = require('gulp-concat');
  const del = require('del');
  const gulp = require('gulp');
  const replace = require('gulp-replace');
  const rollup = require('rollup').rollup;
  const shell = require('gulp-shell');
  
  const ISTANBUL_COMMAND = './node_modules/istanbul/lib/cli.js' +
    ' cover ./node_modules/mocha/bin/_mocha -- -R spec test/*Spec.js';
  
  gulp.task('istanbul', ['build'], shell.task([ISTANBUL_COMMAND]));

  gulp.task('test', ['istanbul']);

  gulp.task('build', ['concat-bundle']);
  
  gulp.task('concat-bundle', ['reformat-bundle'], () => {
    return gulp.src([
        './src/pre.txt',
        './tmp/main-replaced.js',
        './src/post.txt'
      ])
      .pipe(concat('main.js'))
      .pipe(gulp.dest('./'));
  });
  
  gulp.task('reformat-bundle', ['bundle'], (cb) => {
    return gulp.src('./tmp/main-rollupped.js')
      .pipe(replace('var EXPORTS = ', 'return '))
      .pipe(replace('export { EXPORTS };', ''))
      .pipe(concat('main-replaced.js'))
      .pipe(gulp.dest('./tmp'));
  });

  gulp.task('bundle', () => {
    return rollup({
      entry: 'src/main.js'
    }).then(bundle => {
      return bundle.write({
        format: 'es6',
        moduleId: 'test-asm',
        moduleName: 'testAsm',
        dest: './tmp/main-rollupped.js'
      });
    });
  });

  gulp.task('clean', callback => {
    del(['coverage'], callback);
  });
})();
