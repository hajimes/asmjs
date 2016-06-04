(() => {
  'use strict';
  
  const concat = require('gulp-concat');
  const del = require('del');
  const gulp = require('gulp');
  const jshint = require('gulp-jshint');
  const replace = require('gulp-replace');
  const rollup = require('rollup').rollup;
  const shell = require('gulp-shell');
  const stylish = require('jshint-stylish');
  
  const ISTANBUL_COMMAND = './node_modules/istanbul/lib/cli.js' +
    ' cover ./node_modules/mocha/bin/_mocha -- -R spec test/*Spec.js';

  gulp.task('build', ['concat-bundle']);

  gulp.task('bundle', () => {
    return rollup({
      entry: 'src/asmjs/main.js'
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
  
  gulp.task('concat-bundle', ['reformat-bundle'], () => {
    return gulp.src([
        './src/asmjs/pre.txt',
        './tmp/main-replaced.js',
        './src/asmjs/post.txt'
      ])
      .pipe(concat('main.js'))
      .pipe(gulp.dest('./'));
  });
  
  gulp.task('istanbul', ['build', 'jshint'], shell.task([ISTANBUL_COMMAND]));

  gulp.task('jshint', () => {
    return gulp.src('src/*/*.js')
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(jshint.reporter('fail'));
  });

  gulp.task('reformat-bundle', ['bundle'], (cb) => {
    return gulp.src('./tmp/main-rollupped.js')
      .pipe(replace('var EXPORTS = ', 'return '))
      .pipe(replace('export { EXPORTS };', ''))
      .pipe(replace('_CMP_FUNCTION_TABLE', 'CMP_FUNCTION_TABLE'))
      .pipe(concat('main-replaced.js'))
      .pipe(gulp.dest('./tmp'));
  });

  gulp.task('test', ['istanbul']);
})();
