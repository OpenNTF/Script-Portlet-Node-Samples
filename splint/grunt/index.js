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

module.exports = function(grunt) {
  var fs = require("fs"),
      path = require("path"),
      splint = require("../lib/splint"),
      vinyl = require("vinyl-fs");

  var description = "script portlet linting and build tools with grunt";

  grunt.registerMultiTask("splint", description, function() {
    var options = this.options({
 //     log: grunt.log.writeln
    });

    //splint.config({ log: grunt.log.writeln });


    splint.init();

    // TODO this could be faster with async

    splint.config(options);


    splint.config({ log: grunt.log.writeln });

    var runs = [];
    var done = this.async();
    var i = 0;

    this.files.forEach(function(file) {
      var callback = i ? runs[i - 1] : function() { done(1); };

      runs.push(function() {
        // TODO test
        splint.run({src: file.orig.src, dest: file.orig.dest || "sp-build"}, callback);
      });

      i++;
    });

    runs[runs.length - 1]();
  });
};