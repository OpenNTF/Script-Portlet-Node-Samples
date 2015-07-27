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

var cheerio = require("cheerio");

var util = require("./util");

/**
 * NOTE: at the moment this is not a stand alone library
 * @param config
 * @returns {Function}
 */
module.exports = function(config) {
  var defaultConfig = require("./default-config.json");
  util.copy(config, defaultConfig);
  config = defaultConfig;
  config.wrapper = config.wrapper || config.mainPortletClass;

  var warnings = [], $;

  var lintCss = require("./splint-css"),
      lintJs  = require("./splint-js");

  var lineNumAttr = "splint-line-number";

  /**
   * Lints the script tags
   * @param $
   */
  var checkScripts = function($) {
    $("script").each(function() {
      var $this = $(this);
      var src        = $this.attr("src"),
          lineNumber = getLineNumber($this);

      checkJquery($this, src, lineNumber);
      checkExternalLib($this, src, lineNumber);

      // Lint the script
      if ($this.html()) {
        var linter = lintJs(config);
        var jsWarnings = linter($this.html(), function(err, js) {
          $this.html(js);
        });
        // Add the warnings to the global warnings
        for (var i = 0; i < jsWarnings.length; i++) {
          jsWarnings[i].line += lineNumber - 1;
          warnings.push(jsWarnings[i]);

        }
      }
    });
  };

  /**
   * Checks if jquery is locally hosted
   *
   * @param $script
   * @param src: the src attr. If this param is not given, it will be calculated.
   *        However, providing its value may reduce redundant computations.
   * @param lineNumber: ditto
   */
  var checkJquery = function($script, src, lineNumber) {
    var src        = src || $script.attr("src"),
        lineNumber = lineNumber || getLineNumber($script);

    var jquery    = /jquery(-|_|\.|\d|min|js|\/|mobile)+$/ig,
        cdn       = /\.(com|net|org|edu)|^http/g,
        jqueryCdn = "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.0.0/jquery.min.js";

    if (src && src.match(jquery) && !src.match(cdn)) {
      // Check jquery
      if (config.checks["html-jquery"]) {
        warnings.push({
          message: "Please use a cdn to load jquery",
          line: lineNumber,
          issue: "html-jquery"
        });
      }
      // Fix - replace the local ref with a cdn
      if (config.fixes["html-jquery"]) {
        $script.attr("src", jqueryCdn);
      }
    }
  };

  var checkExternalLib = function($script, src, lineNumber) {
    var src = src || $script.attr("src"),
        lineNumber = lineNumber || getLineNumber($script),
        externalLib = /\.(com|net|org|edu)|^http|bower|vendor/g;

    var themeAttr = "data-scriptportlet-theme-capability";
    if (src && src.match(externalLib) && !$script.attr(themeAttr)) {
      if (config.checks["html-external-libs"]) {

        var lib = (src.match(/([\w\.\d_-]+)$/) || [""])[0];
        lib = lib.length ? "'" + lib + "' " : lib;
        warnings.push({
          message: "Please load the library " + lib + "from the page's Portal theme"
           + ": " + src,
          line: lineNumber,
          issue: "html-external-libs"
        });
      }
      if (config.fixes["html-external-libs"]) {
        $script.attr(themeAttr, "true");
      }
    }
  };

  /**
   * Checks the css of style tags using splint-css
   */
  var checkStyles = function() {
    // check css styles
    $("style").each(function() {
      var $this = $(this);
      var linter = lintCss(config);
      var styleWarnings = linter($this.html(), function(err, css) {
        $this.html("\n" + css + "\n");
      });

      var lineNumber = parseInt($this.attr(lineNumAttr));

      for (var i = 0; i < styleWarnings.length; i++) {
        styleWarnings[i].line += lineNumber - 1;
        warnings.push(styleWarnings[i]);
      }
    });
  };

  var checkUrlMapping = function() {
    if (config.checks["js-urls"] && !$("*[data-scriptportlet-generate-url-map='true']").length) {
      warnings.push("Include the attr `data-scriptportlet-generate-url-map='true'` on the html tag");
    }
  };

  /**
   * Performs changes to the body tag
   * @param $
   */
  var modifyBody = function($) {
    if (config.fixes["css-positions"]) {
      $("body").css("position", "relative");
    }
    if (config.fixes["css-selectors"]) {
      // Remove periods if config.wrapper has any
      $("body").addClass(config.wrapper.replace(".", ""));
    }
  };

  /**
   * Adds a line number attribute to html elements that will be checked
   * @param $
   */
  var loadLineNumbers = function(html) {
    var tags = /<(script|style)([^>]*)>/g;

    return html.replace(tags, function(match, $1, $2, index) {
      return "<" + $1 + $2 + " " + lineNumAttr + "=\"" + counLineNumber(html, index) + "\">";
    });
  };

  /**
   * Removes the line number attribute that was added by loadLineNumbers()
   * @param $
   */
  var removeLineNumbers = function($) {
    $("[" + lineNumAttr + "]").removeAttr(lineNumAttr);
  };

  /**
   * Counts the line number of the index in the given string (starting at 1)
   * @param str
   * @param index
   * @returns {number}
   */
  var counLineNumber = function(str, index) {
    index = index || str.length;
    var newLines = 1;
    for (var i = 0; i < index; i++) {
      if (str[i] === '\n') {
        newLines++;
      }
    }
    return newLines;
  };

  var getLineNumber = function($el) {
    return parseInt($el.attr(lineNumAttr));
  };

  /**
   * The main function
   * @param html
   * @param save
   * @returns {Array}
   */
  var check = function(html, options, save) {
    warnings = [];

    var handler = util.createHandler(config, options, save).start();

    html = loadLineNumbers(html);
    $ = cheerio.load(html);
    modifyBody($);
    checkScripts($);
    checkStyles($);

    removeLineNumbers($);
    html = $.html();

    handler.finish(null, html, warnings);

    return warnings;
  };

  return check;
};