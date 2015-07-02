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

/**
 * Reporter for printing the errors and warnings of one file to the console
 */
var fs = require("fs");

var chalk = require("chalk");

var outputStream;

var config = {
  verbose: false,
  log: console.log,
  silent: false
};

var totalWarnings = 0;

var logFile = "", logContents;

var log = function(str) {
  config.log(str);
  if (outputStream || logFile) {
  //  outputStream.write(chalk.stripColor(str) + "\n");
 //   console.log("lc: " + logContents);
    logContents += chalk.stripColor(str) + "\n";
  }
};

/**
 *
 * @param warnings for a single file
 * @param silent
 */
var warn = function(warnings, logger, verbose) {
  var path = warnings.path;
  warnings = warnings.messages;

  config.log = logger;

  if (warnings.constructor !== Array) {
    warnings = [warnings];
  }
  if (warnings.length) {
    log(chalk.red("\n" + warnings.length + " potential issue(s) in " + path + ":"));
    for (var i = 0, j = warnings.length; i < j; i++) {
      var warning = warnings[i], printLines, prefix;

      // Load the warning
      if (typeof warning === "string") {
        warning = { message: warning, line: ""}
      }
      prefix = "line " + formatInt(warning.line);

      // print the first line: "line xxx  message"
      printLines = warning.message.match(/[^\n]{1,68}(?:[^\w]|$)/g) || [];
      log(chalk.grey(prefix) + printLines[0]);

      // Change the prefix "line xxx" to spaces
      prefix = prefix.replace(/./g, " ");

      // print the remaining lines;
      for (var k = 1, l = printLines.length; k < l; k++) {
        log(prefix + printLines[k]);
      }

      // TODO delete?
      totalWarnings += warnings.length;
    }
  } else if (verbose) {
      log(chalk.green("\n0 issues found in " + path));
  }
};

var err = function(error, filepath, logger) {
  config.log = logger;

  log(chalk.bgRed("ERROR WHEN PARSING " + filepath));
  var lines = error.message.match(/[^\n]{1,68}(?:[^\w]|$)/g) || []; // TODO remove repetition

  for (var i = 0; i < lines.length; i++) {
    config.log(chalk.bgRed(lines[i]));
  }
};

var setFile = function(file) {
  logFile = file;
};

var close = function() {
  if (logFile) {
    fs.writeFileSync(logFile, logContents);
  }
  logContents = "";
  //logFile = ""
};

module.exports = {
  warn: warn,
  setFile: setFile,
  close: close,
  err: err
};

var formatInt = function(int) {
  var length = 4;
  if (!int) {
    return "  ? ";
  } else {
    var str = "" + int;
    while (str.length < length - 1) { str = " " + str; }
    return str + " ";
  }
};