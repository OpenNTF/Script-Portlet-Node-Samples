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

var es = require("event-stream"),
    splint =require("../lib/splint");

/**
 * Applies splint to each file
 */
var splintPlugin = function(options) {
  options = options || {};
  options.recursive = false;

 // splint.init();
 // splint.config(options);

  // The following function is mapped to each of the incoming files
  return es.map(function(file, callback) {
    splint.init();          // so that concurrent gulp tasks don't share options
    splint.config(options); // TODO this is a temp fix, use a more efficient solution
    splint.inspect(file);
    callback(null, file);
  });
};

// splintPlugin.raw = function() {}

splintPlugin.fix = function(options) {
  options.fix = true;
  options.silent = true;
  return splintPlugin(options);
};

module.exports = splintPlugin;