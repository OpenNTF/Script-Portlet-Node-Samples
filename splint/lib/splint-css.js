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

var cssParser = require("css");

var util = require("./util");

module.exports = function(config) {
  var defaultConfig = require("./default-config.json");
  util.copy(config, defaultConfig);
  config = defaultConfig;
  config.wrapper = config.wrapper || config.mainPortletClass;

  var warnings = [];

  /**
   * Checks for css selectors that may affect elements on the page outside the portlet.
   *
   * @param rule
   */
  var checkSelectors = function(rule) {
    var selectors = rule.selectors || [];

    var tagRegex = new RegExp("^" + util.tagRegStr + "$");

    var re = new RegExp("^(" + config.wrapper.replace(".", "\.") + "|body|html)");

    if (config.checks["css-selectors"]) {
      var selectorMatches = selectors.map(function(selector) {
        var matches = selector.match(tagRegex);
        return matches ? matches[0] : null;
      }).filter(function(el) { return el; }).join();

      if (selectorMatches) {
        warnings.push({
          message: "Please avoid using unqualified selectors: " + selectorMatches + " { ... }",
          line: rule.position.start.line,
          issue: "css-selectors"
        });
      }
    }

    for (var k = 0, l = selectors.length; k < l; k++) {
      if (config.fixes["css-selectors"]) {
        selectors[k] = config.wrapper + " " + selectors[k].replace(re, "");
      }
    }
  };

  var checkWidth = function(width, rule) {
    var matches = width.value.match(/^(\d+)px/) || ["0"],
        val     = parseInt(matches[0], 10); // Base 10

    if (val > 750) { // 750 was chosen arbitrarily
      if (config.checks["css-widths"]) {
        var line = width.position.start.line;
        warnings.push({
          message: "Warning: width of " + val + "px may exceed the portlet's width",
          line: line
        });
      }
      if (config.fixes["css-widths"]) {
        width.property = "max-width";
        var newDeclaration = {
          type: "declaration",
          property: "width",
          value: "100%",
          position: width.position
        };
        rule.declarations.push(newDeclaration);
      }
    }

  };

  /**
   * Checks whether the value of the given position is fixed and if so, changes the
   * value to absolute.
   */
  var checkPosition = function(position, rule) {
    if (position.value === "fixed") {
      var line = position.position.start.line;

      if (config.checks["css-positions"]) {
        warnings.push({
          message: "Please don't use `position: fixed`",
          line: line
        });
      }

      if (config.fixes["css-positions"]) {
        position.value = "absolute";
      }
    }
  };

  /**
   *  Checks the properties of the given css rule and makes any necessary changes.
   */
  var checkProperties = function(rule) {
    var declarations = rule.declarations || [];

    for (var i = 0, j = declarations.length; i < j; i++) {
      switch (declarations[i].property) {
        case "width":
        case "min-width":
          checkWidth(declarations[i], rule);
          break;
        case "position":
          checkPosition(declarations[i], rule);
          break;
      }
    }
  };

  /**
   * Checks for fonts that have caused problems with script portlet
   *
   * @param fontFace A node from the css ast
   */
  var checkFonts = function(fontFace) {
    if (!config.checks["css-fonts"]) { return; }

    var badFonts = /url\((\S+\.(ttf|woff)\S+\))/g,
        cdn = /\.(com|net|org|edu)|^http/g;
    var declarations = fontFace.declarations;

    for (var i = 0, j = declarations.length; i < j; i++) {
      var prop = declarations[i].property,
          val = declarations[i].value;

      // Checks that the font is not a locally hosted "bad" font
      if (prop === "src" && val.match(badFonts) && !val.match(cdn)) {
        var line = declarations[i].position.start.line;
        warnings.push({ message: "Please avoid using .ttf and .woff fonts", line: line });
      }
    }
  };

  /**
   * Checks each rule in the AST
   */
  var checkRules = function(rules) {
    for (var i = 0, j = rules.length; i < j; i++) {
      if (rules[i].type === "rule") {
        checkProperties(rules[i]);
        checkSelectors(rules[i]);
      } else if (rules[i].type === "media") {
        checkRules(rules[i].rules);
      } else if (rules[i].type === "font-face") {
        checkFonts(rules[i]);
      }
    }
  };

  /**
   * Removes double slash comments from the given str since they aren't valid
   * CSS comments
   */
  var stripSlashComments = function(str) {
    return str.replace(/(\n\s*\/\/[^\n]+)/g, "/*$1*/");
  };

  /**
   * @param css: the contents of the stylesheet
   * @param save: a function that persistently that takes the resulting css as a
   *              a string and processes/saves the new css.
   * @return warnings: a list of warnings
   */
  var check = function(css, options, save) {
    warnings = []; // Reset the warnings for this file
    var ast, rules, error = null;

    var handler = util.createHandler(config, options, save).start();
    try {
      ast = cssParser.parse(css);
      rules = ast.stylesheet.rules;
      checkRules(rules);
      css = cssParser.stringify(ast)

    } catch (err) {
      error = err;
    }

    handler.finish(error, css, warnings);

    return warnings;
  };


  return check;
};
