/*
 * Copyright 2015  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css')
var less = require('gulp-less');
var jshint = require('gulp-jshint');
var shell = require('gulp-shell');
var htmlTidy = require('gulp-htmltidy')

var splint = require('splint/gulp');

var releaseFolder = './release/';
var jsFiles = ['js/!(jquery)*.js'];
var lessFiles = ['less/*.less', 'bower_components/bootstrap-less/**/bootstrap.less'];
var htmlFiles = ['index.html', 'partials/*.html'];
var assets = ['data/*.json'];

// Compiles, concatinates, and minifies less
gulp.task('build-styles', function() {
  return gulp.src(lessFiles)
    .pipe(less())
    .pipe(splint()) // TODO sourcemap for linting
    .pipe(minifyCss())
    .pipe(concat('all-styles.css'))
    .pipe(gulp.dest(releaseFolder));
});

// builds js files
gulp.task('build-scripts', function() {
  return gulp.src(jsFiles)
   .pipe(splint())
   .pipe(jshint())
   .pipe(jshint.reporter('default'))
   .pipe(uglify())
   .pipe(concat('all-scripts.js'))
   .pipe(gulp.dest(releaseFolder));
});

// Compiles, concatinates, and minifies less
gulp.task('build-html', function() {
  return gulp.src(htmlFiles, { base: './' })
    .pipe(splint())
    .pipe(htmlTidy())
    .pipe(gulp.dest(releaseFolder));
});

gulp.task('build-assets', function() {
  return gulp.src(assets, { base: './' })
    .pipe(gulp.dest(releaseFolder));
});

gulp.task('build-all', ['build-html', 'build-styles', 'build-scripts', 'build-assets']);

gulp.task('sp-push', ['build-all'], shell.task(
  'sp push -mainHtmlFile ' + releaseFolder + 'index.html'
));

gulp.task('watch', function() {
  // Merges all the files into a single array
  var allFiles = [].concat.apply([], [jsFiles, lessFiles, htmlFiles, assets, ['splint-config.json']]);

  // Build and push the app when a source file is changed
  gulp.watch(allFiles, ['sp-push']);
});


gulp.task('default', ['sp-push', 'watch']);