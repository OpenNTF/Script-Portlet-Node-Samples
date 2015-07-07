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

var util = require("./util");

module.exports = function(config) {
  var defaultConfig = require("./default-config.json");
  util.copy(config, defaultConfig);
  config = defaultConfig;
  config.wrapper = config.wrapper || config.mainPortletClass;

  var warnings = [];
  /**
   * Searches for unqualified selectors in jquery.
   * This can be improved by only considering selectors where a change to the DOM
   * will be made
   */
  var checkSelectors = function(js) {

    var tags = new RegExp("\\$\\([\"']" + util.tagRegStr + "[\"']\\)", "g");


    if (config.checks["js-selectors"]) {
      var match;
      while((match = tags.exec(js)) !== null) {
        warnings.push({
          message: "Please avoid using unqualified selectors: " + match[0],
          line: getLine(js, match.index)
        });
      }
      // Some other strings to look for in js.
      var otherChecks = /'body'|"body"|document\.body/g;
      while((match = otherChecks.exec(js)) !== null) {
        warnings.push({
          message: "Please avoid using the body tag: " + match[0],
          line: getLine(js, match.index)
        });
      }
    }
    if (config.fixes["js-selectors"]) {
      var reg = new RegExp(config.wrapper.replace(".", "\.") + " (body|html)");
      js = js.replace(tags, "$('" + config.wrapper + " $1')").replace(reg, config.wrapper);
    }

    return js;
  };

  /**
   * (Naively) Searches for dynamic urls and warns about any.
   */
  var checkUrls = function(js) {
    var check = config.checks["js-urls"];
    /*
     * The regex looks for two pattersn:
     * 1: "strings" + otherStrings + "literal/with/file-extension.file
     * 2: "directory/that/has/slash/" + other + "strings"
     */

    // REGEX documentation:
    // /                                         # First pattern
    //   ^(
    //      [\s\S]*\+\s*                         # A plus sign for string concat
    //      ["'][\w_\-\/]*\.(jpeg|png|gif)["']   # A string with a file extension
    //   )
    // |                                         # Second option
    //   (
    //     ["'][\w_\-\/\.]+\/["']                # Matches a directory (in a string literal)
    //     \s*\+                                 # + to match string concatenation
    //     [^\n;]+                               # Other strings
    //   )
    // /g
    var reg = /([^:\n=]*\+\s*["'][\w_\-\/]*\.(jpeg|png|gif|json)["'])|(["'][\w_\-\/\.]+\/["']\s*\+[^\n\)};]+)/g;

    var match;
    var lastMatchIndex = 0;

    while(check && (match = reg.exec(js)) !== null) {
      // to check if the matching string has been wrapped or not
      var str = "__SPNS__spHelper.getElementURL(";
      if (js.substring(match.index - str.length, match.index) !== str) {

        warnings.push({
          message: "Please map any dynamic urls: " + match[0],
          line: getLine(js, match.index),
          issue: "js-urls"
        });
      }
      lastMatchIndex = match.index;
    }

    if (config.fixes["js-urls"]) {
      /**
       * Not implemented yet. Simple regex replacing won't work because:
       * - What about strings that have already been mapped?
       * - Paths inside function calls
       * +
       */
    }

    return js;
  };

  /**
   * Returns the line number of the given index
   * @param js
   * @param index
   * @returns {number}
   */
  var getLine = function(js, index) {
    var line = 1;
    for (var i = 0; i < index; i++) {
      if (js[i] === '\n') {
        line++;
      }
    }
    return line;
  };

  var stripComments = function(js) {
    // multi line OR single line comment
    var comment = /(\/\*[\s\S]+?\*\/)|(\/\*[\s\S]+?\*\/)/gm;

    //return js.replace(comment, match => match.replace(/\w/g, "-"));
    return js.replace(comment, function(match) {
      return match.replace(/\w/g, "-");
    });
  };

  /**
   * Runs the checks and fixes
   * @param js - A string of valid javascript
   * @param options
   * @param cb
   * @returns {Array}
   */
  var check = function(js, options, cb) {
    if (!js) { throw new Error("ERROR js should not be undefined"); }

    // Start the handler
    var handler = util.createHandler(config, options, cb).start();

    warnings = [];
    js = checkSelectors(js);
    js = checkUrls(js);

    handler.finish(null, js, warnings);

    return warnings;
  };
  return check;
};