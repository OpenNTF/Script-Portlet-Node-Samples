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

// Contains some repetitive code that doesn't belong in any particular file

var tagList = require('./tags.json').join("|");
var tagRegex = "(((" // must be start of string
  + tagList + ")"     // match a html tag
  + "(::?\w+)?"       // pseudo element selectors
  + "[ ~>\+]*"        // sibling, child, descendant selectors
  +  ")+$";          // any descendants must also be tags


/**
 *
 * @param fromObject
 * @param toObject
 */
var copy = function(fromObject, toObject) {
  if (!fromObject || !toObject) return;

  for (var key in fromObject) {
    if (!fromObject.hasOwnProperty(key)) continue;

    if (typeof fromObject[key] === "object" && fromObject[key].constructor !== Array) {
      toObject[key] = toObject[key] || {};
      copy(fromObject[key], toObject[key]); // recurse
    } else {
      toObject[key] = fromObject[key];
    }
  }
};

var matchGlobs = function(str, globs) {
  if (globs.constructor !== Array) globs = [globs];

};


/**
 * Handles some common cases in splint
 *
 * @param config: a persistent config
 * @param options
 */
var createHandler = function(config, options, cb) {
  if (!cb && options && options.constructor === Function) {
    cb = options;
    options = null;
  }

  var temp = {};

  var that = {
    start: function(f) {
      if (options) {
        copy(config, temp);
        copy(options, config);
      }
      f && f();
      return that;
    },
    finish: function() {
      if (options) {
        for (var key in options) {
          if (config.hasOwnProperty(key)) {
            delete config[key];
          }
        }
        // faster way to copy an object
        copy(temp, config);
      }
      cb && cb.apply(null, arguments);
      return that;
    }
  };
  return that;
};

/**
 * Returns a new config object with default configurations for any keys that are
 * missing in the original object.
 */
var addDefaults = function(config) {
  var defaultConfig = require("./default-config.json");
  copy(config, defaultConfig);
  defaultConfig.wrapper = defaultConfig.wrapper || defaultConfig.mainPortletClass;
  return defaultConfig;
};

var getUrlRegExp = function() {
  var or = function() { return "(" + arguments.join("|") + ")";  };
  var stringify = function(pattern) { return or('"' + pattern + '"', "'" + pattern + "'")};
  var maybe = function(pattern) { return "(" + pattern + ")?" }; 

  var path = "[\\w\\/\\._-]+";
  var dir = stringify(path + "\\/"), file = stringify(path + "\\w+\\.\\w+");

  var variable = "\\w+(\\.\\w+)*";
  var plus = "\\s*\\+\\s*";

  var end = "[\s\S]*[;|$]";

  var pattern1 = dir + plus + variable;
  var pattern2 = variable + plus + file;

  return or(pattern1, pattern2);
};


module.exports = {
  addDefaults: addDefaults,
  copy: copy,
  createHandler: createHandler,
  tagRegStr: tagRegex
};