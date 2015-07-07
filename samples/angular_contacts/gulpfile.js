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
var pkg = require('./package.json');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css')
var less = require('gulp-less');
var jshint = require('gulp-jshint');
var htmlTidy = require('gulp-htmltidy');
var shell = require('gulp-shell');

var runSequence = require('run-sequence');

var path = require('path');

var releaseFolder = 'release/';

var jsFiles = ['js/*.js'];
var cssFiles = ['css/*.css'];
var htmlFiles = ['index.html', 'partials/*.html'];
var assets = ['data/*.json', 'img/*.jpeg'];

// Compiles, concatenates, and minifies less
gulp.task('build-styles', function() {
  return gulp.src(cssFiles)
    .pipe(less())
    .pipe(minifyCss())
    .pipe(concat('all-styles.css'))
    .pipe(gulp.dest(releaseFolder));
});

gulp.task('build-scripts', function() {
  return gulp.src(jsFiles)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(uglify())
    .pipe(concat('all-scripts.js'))
    .pipe(gulp.dest(releaseFolder));
})

gulp.task('build-html', function() {
  return gulp.src(htmlFiles, { base: './' })
    .pipe(htmlTidy())
    .pipe(gulp.dest(releaseFolder));
});

gulp.task('build-assets', function() {
  return gulp.src(assets, { base: './' })
    .pipe(gulp.dest(releaseFolder));
});

gulp.task('build-all', ['build-scripts', 'build-styles', 'build-html', 'build-assets']);

gulp.task('sp-push', shell.task(
  'sp push -mainHtmlFile ' + releaseFolder + 'index.html'
));

gulp.task('watch', function() {
  gulp.watch(htmlFiles, function() { runSequence('build-html', 'sp-push') });
  gulp.watch(cssFiles, function() { runSequence('build-styles', 'sp-push') });
  gulp.watch(jsFiles, function() { runSequence('build-scripts', 'sp-push') });
  gulp.watch(assets, function() { runSequence('build-assets', 'sp-push') });
});

gulp.task('default', function() {
  runSequence('build-all', 'sp-push', 'watch');
});
