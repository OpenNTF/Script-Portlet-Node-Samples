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

var fs   = require("fs"),
    path = require("path");

/* Libraries */
var chalk  = require("chalk"),
    vinyl  = require("vinyl-fs"),
    es     = require("event-stream"),
    ignore = require("gulp-ignore");

var reporter = require("./reporter"),
    util     = require("./util");

/* Global variables */
var lint        = {},
    config      = {},
    warnings    = [],
    initialized = false,
    outputLog   = "",
    running     = false,
    files       = [];

/* Config Functions */
/**
 * Resets stateful variables
 */
var reset = function() {
  outputLog = "";
  warnings = []; // reset warnings
  files = [];
};

/**
 * For setting config options programmatically. Overrides prev configurations
 * @param conf
 * @returns {*}
 */
var configure = function(options) {
  util.copy(options, config);

  update(Object.keys(options));
};

/**
 * Sets config to default values.
 */
var initConfig = function() {
  var defaultConfig = "./default-config.json";

  config = config || {};

  configure(require(defaultConfig));

  config.cwd = config.cwd || process.cwd();

  // Set config.log, this can't be done in default-config, it must be done in js
  var logger = config.log || console.log;
  config.log = function(str) {
    if (!config.silent) {
      logger(str);
    }
    outputLog += str + "\n";
  };

  update();
};

var loadLints = function() {
  lint[".css"] = require("./splint-css");
  lint[".html"] = require("./splint-html");
  lint[".js"] = require("./splint-js");
};

var init = function() {
  initConfig();
  loadLints();

  var configFile = config.config || "splint-config.json";
  var searchDir = config.cwd;
  var searchParents = config.config;

  do {
    try {
      var conf = fs.readFileSync(path.resolve(searchDir, configFile), "utf8");
      configure(JSON.parse(conf));

      reporter.log("Loading configurations from: " + path.resolve(searchDir, configFile), config.log);

      searchParents = false;
    } catch (err) {
      if (err.code == "ENOENT") {
        searchDir = path.resolve(searchDir + '/../'); // search the parent
        searchParents = searchDir !== path.resolve('/'); // stop when the root is reached
      } else if (err.constructor === SyntaxError) {
        reporter.err(err, path.relative(process.cwd(), path.resolve(searchDir, configFile)), config.log)
      } else {
        throw err;
      }
    }
  } while (searchParents);

  initialized = true;
};

/**
 * Updates other variables when config has changed
 */
var update = function(options) {
  options = options || "";
  if (options.constructor !== Array) options = [options];

  for (var opt in options) {
    opt = options[opt];
    switch (opt) {
      case "log":
        var logger = config.log || console.log;
        config.log = function(str) {
          if (!config.silent && !(config.output && config.output.silent)) {
            logger(str);
          }
          outputLog += str + "\n";
        };
        break
    }
  }

  config.logFile = config.logFile || "";
  if (config.output && config.output.file) {
    config.logFile = config.output.file; 
  }
  if (!path.isAbsolute(config.logFile) && config.logFile.length) {
    config.logFile = path.normalize(config.cwd + "/" + config.logFile);
  }
  if (config.logFile) {
    reporter.setFile(config.logFile);
  }

  config.wrapper = "";
  if (true || config.mainPortletClass.match(/__SPNS__/)) {
    config.wrapper = "." + config.mainPortletClass;
  } else if (config.mainPortletClass) {
    config.wrapper = ".__SPNS__" + config.mainPortletClass;
  }
};

var run = function(options, callback) {
  initialized || init();

  running = true;

  var handler = util.createHandler(config, options, callback).start();
  
  // save the results
  var conf = JSON.parse(JSON.stringify(config));
  var src = conf.src;
  var dest = conf.dest;
  var cwd = conf.cwd;
  var fix = conf.fix;

  var warns = [], fs = [];
  
  // The actual running
  vinyl.src(src, {cwd: cwd})
    .pipe(es.map(function(file, callback) {
      inspect(file, conf, cwd, fs, warns);
      return callback(null, file);
    }))
    .pipe(ignore.include(fix))
    .pipe(vinyl.dest(dest, {cwd: cwd}))
    .on("end", function() {
      running = false;
      reporter.close();

      var out = chalk.stripColor(outputLog);
      reset();

      // Let handler reset config, call the callback
      handler.finish(null, out, warns, fs);
    });
};

/**
 * Lints the given file and writes the output to the console.
 * @param file
 */
var inspect = function(file, conf, cwd, fs, warns) {
  conf = conf || config;
  cwd = cwd || conf.cwd;
  fs = fs || files;
  warns = warns || warnings;
  var result = {};

  file.extname = file.extname || path.extname(file.path);

  if (file.extname.match(/\.(html|css|js)$/)) {
    var linter = lint[file.extname](conf);
    result = {
      path: path.relative(cwd, file.path),
      messages: linter(file.contents.toString(), updateFile(file))
    };
  }
  fs.push(file);

  if (result.path) {
    reporter.warn(result, config.log, conf.verbose);
    warns.push(result);
  }
};

/**
 * Changes the contents of the given vinyl file object.
 *
 * Note: The object is modified in memory so it is not saved to the disk.
 */
var updateFile = function(file, conf) {
  conf = conf || config;
  return function(err, contents) {
    if (err) {
      reporter.err(err, path.relative(conf.cwd, file.path), config.log);
    } else if (conf.dest && conf.fix) {
      file.contents = new Buffer(contents);
    }
  }
};

loadLints();
var _lint = {
  js: function() {
    return lint[".js"](config).apply(this, arguments);
  },
  css: function() {
    return lint[".css"](config).apply(this, arguments);
  },
  html: function() {
    return lint[".html"](config).apply(this, arguments);
  }
};


module.exports = {
  init: init,
  config: configure,
  run: run,
  inspect: inspect,
  js: _lint.js,
  css: _lint.css,
  html: _lint.html
};