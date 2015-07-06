# Command Line Usage

To install (or update), run:
```
npm install -g https://github.com/OpenNTF/Script-Portlet-Node-Samples/raw/master/splint.tgz
```
To use:
```
splint [options]
```
Documentation about options can be found below

### Command Line options
For more information about options, see the options section below. Some options
can be specified on the command line and will override any corresponding options
in splint-config.json. More options can be set in `splint-config.json` as detailed
below.

The config file can be set by `--config` or `-c`. For example,
```
splint --config="src/splint-config.json"
```
By default, `--config` is set to `./splint-config.json`.

Including any of the following options will set the option to true:
+ `--fix`, `-f`
+ `--silent`, `-s`
+ `--verbose`, `-v`: Not implemented

Arguments can be passed as well:
+ `--src`: e.g. `node <splint-cli.js> --src="/**.css"`. Arrays cannot be passed to
  `--src` on the command line.
+ `--conf, -c`: path to configuration options. If it is not specified, splint will
  search for `splint-config.json` in the current working directory and its parent directories.
+ `--cwd`: current working directory. Defaults to `./`.
+ `--dest, -d`: The destination for modified files. If `--fix` is specified, 
  then modified files with any fixes will be saved on the disk relative to `--dest`.
  If no fixes were necessary, then the files will simply be copied to the destination.

# Using Splint from Javascript
Splint can be called from other javascript files (that's how the Gulp and Grunt
plugins are implemented). To use in a project (as a library, not a build/lint tool),
go to your project's root folder and run:
```
npm install --save https://github.com/OpenNTF/Script-Portlet-Node-Samples/raw/master/splint.tgz
```

Then inside a javascript file call
```
splint = require("splint/lib/splint");

splint.init();

splint.config(myOptions); // optionally configure splint with your desired options

splint.run();
```

There are a few more functions available:
```
splint.init()
splint.config(options)
splint.run([options, [callback]])
splint.inspect(file)
splint.html(html, [options], [callback])
splint.css(css, [options], [callback])
splint.js(js, [options], [callback])
```
### splint.init()
This function loads default configurations and any configurations from `splint-config.json`.
By default it assumes that `splint-config.json` is in the current working directory,
however that can be changed by first calling `splint.config({ config: "path/to/whatever/file.json" })`.
No other functions should be used before `splint.init` except `splint.config` to change the config
path.

### splint.config(options)
Changes the configuration of `splint` during runtime. The possible options matches
the format for splint-config.json described below. For example, to enable fixing, use
```
splint.config({ fix: true });
```
and to change the output file, use
```
splint.config({ logFile: "my-file.log" } );
```
But don't call `splint.config` while `splint.run` is being executed concurrently.
Note, the config file can be specified by using 
```
splint.config({ config: "path/to/whatever/file" });
```
before calling `splint.init`. Use `splint.init` to reset configurations to undo any
configurations set since starting splint.

### splint.run([options], [callback])
Runs splint. `splint.init()` should be called first.

This function is asynchronous so make sure that `splint.run()` is finished before
calling `splint.run()` again or `splint.config`. 


#### options
updates the configuration of splint when executing `run`. The configuration
changes to not persist when `splint.run` is finished.

#### callback(err, out, raw, files)
a callback for when `run` finishes. It takes four arguments:
- `err`: Any errors that occurred during splint's execution.
  * NOTE: not currently implemented, for the time being, this argument will be null.
- `out`: A string containing the formatted output. The output can still be written
  to the command line and/or to a file by setting the `silent` and `output.file`
  options respectively.
- `raw`: An array containing information about issues found in the portlet.
  Each element is an array of objects with the following properties:
  * `path`: The (relative) path to the file that was checked
  * `messages`: An array of objects with the following properties:
    + `message`: A message describing the issue (A string)
    + `line`: The line number in the file of the issue (A number)
    + `issue`: The issue (a string). This takes the form of `checks` in splint-config.json.
      For example, this may equal `"css-selectors"`, `"js-urls"`, or `"html-jquery"`.
      - NOTE: At the moment, the `issue` property may be `undefined` sometimes
- `files`: An array of [vinyl](https://github.com/wearefractal/vinyl) files that
  were processed (that is, every file that matches the `src` option). If `fix` is true, then
  the contents of the file will contain the changes made. The file object has the following
  properties:
  * `path`: The original path of the file
  * `contents`: If `fix` is true, then this will contain the changes as a Buffer.
    Otherwise, the contents will be the contents of the original, unmodified file.
  * `extname`: The file extension, eg: `".js"`.

#### Notes
`splint.run` can be called multiple times in series using the callback:

```
splint.run(function() {
  splint.config(newOptions); // splint.config is synchronous
  splint.run();
});
```

Below is an example (in pseudocode) of calling `splint.run` an arbitrarily number
of times using a list of callbacks. 
```[javascript]
var runs = [];

for (var i = 0; i < limit; i++) {
  var callback;
  if (i > 0) {
    callback = runs[i - 1];
  }
  
  runs.push(function() {
    splint.config({ src: newSrc(), dest: newDest() }); // Change the options
    splint.run(callback);
  });
}

runs[0](); // Call the first run function to start the chain of run calls.
});
```

NOTE: when `run()` is called, it will overwrite any prior log files.

### splint.html(html, [options], [callback])
### splint.css(css, [options], [callback])
### splint.js(js, [options], [callback])
Runs the splint on a string. Each function returns a list of warning objects.
More info coming soon.

**Note**: these functions synchronous. These functions do **NOT** produce any
output the console.
#### Parameters
+ `htmls|css|js`: a string of valid html, css, or js (depending on the respective
  function used).
+ `options`: Non-persistent configurations
+ `callback(err, output, warnings)`: A callback with the following parameters:
  - `err`: An Error object
  - `output`: A new string containing any fixes made.
  - `warnings`: A list of warnings.

### ~~splint.inspect(file)~~
`splint.init` and `splint.config` should be called first.

This function is part of `splint.run`'s implementation. It is exported since it was
helpful when writing the Gulp plugin.

Runs `splint` on a single file. The file object needs two properties:
+ `path`: the path of the file
+ `contents`: the contents of the file as a Buffer (although a string would probably work too)
This function is synchronous. It performs most operations of `splint` except saving
the fixes to the disk. If fixing is enabled, the property `file.contents` will be
updated with the fixes. The fixes can be saved using `fs.writeSync` or a similar function.

It will do everything else, though, including saving output to a file, printing to
the command line, fixing, etc.

`splint.run` calls this function on all files that match the `src` option.

# Using the Grunt Plugin
To install, run:
```
npm install --save-dev https://github.com/OpenNTF/Script-Portlet-Node-Samples/raw/master/splint.tgz
```
Make sure that `package.json` contains
```
"devDependencies": {
    "splint": "https://github.com/OpenNTF/Script-Portlet-Node-Samples/raw/master/splint.tgz"
}
```

First install splint as above. The splint plugin for Grunt can be configured and used as follows:
```[javascript]
module.exports = function(grunt) {
    grunt.initConfig({
        options: {
          verbose: true,
          fix: true
        },
        splint: {
            default: {
                src: ["./**", "!./**/sp-build/**", "!./**/node_modules/**"],
                dest: "./grunt-sp-build",
                options: {
                    silent: true,
                    output: {
                        file: "splint.log"
                    }
                }
            }
        }
    });

    grunt.loadTasks("node_modules/splint/grunt");
    grunt.registerTask("default", "splint:default");
}
```

Any options given will override splint-config.json. The `src` and `dest` options
should be specified in Gruntfile.js as shown above. But note that `dest` should be 
a directory, not a file. 

You can use splint to fix source files after concatenating and minifying them. However,
if you want to lint the files, use splint before concatenating or minifying them.

# Using the gulp plugin
To install, run:
```
npm install --save-dev https://github.com/OpenNTF/Script-Portlet-Node-Samples/raw/master/splint.tgz
```
Make sure that `package.json` contains
```
"devDependencies": {
    "splint": "https://github.com/OpenNTF/Script-Portlet-Node-Samples/raw/master/splint.tgz"
}
```

Make sure that splint is installed correctly. Afterwards, Splint can be used with Gulp as follows:
```[javascript]
var gulp = require("gulp");
var splint = require("splint/gulp");

gulp.task("default", function() {
    gulp.src("./index.html")
      .pipe(splint());
      .pipe(gulp.dest("my/build/folder"));
});
```

The paths to splint/plugins/gulp-splint and index.html my differ depending on where
splint is installed and the path of index.html relative to the gulpfile. Options
can be passed to `splint` for configuration. However, with Gulp, the `src` option
is specified as the argument to `gulp.src`.
```[javascript]
var gulp = require("gulp");
var splint = require("splint/gulp");

gulp.task("default", function() {
  gulp.src(["./**", "!./**/sp-build/**", "!./**/node_modules/**", "!gulpfile.js"])
    .pipe(splint({
      fix: true
    }))
    .pipe(gulp.dest("sp-build"));
;
```

The output can be passed on to other gulp plugins. If `fix` is set to true,
then the fixed files will be passed on. Otherwise the original, unmodified file is
piped. Also, any file that isn't a .html, .js, or .css file will be piped without
performing any checks or fixes.

Below is an example of building all files then minifying and concatenating all css files.
```[javascript]
var gulp = require("gulp");
var gulpFilter = require("gulp-filter");
var minifyCss = require("gulp-minify-css");
var concat = require("gulp-concat");
var splint = require("splint/gulp");

var cssFilter = gulpFilter("**/*.css");

gulp.task("default", function() {
  gulp.src(["./**","!**/node_modules/**","!**/my-build-folder/**"])
    .pipe(splint.fix())
    .pipe(cssFilter)             // Removes any non-css files from the stream
      .pipe(minifyCss())
      .pipe(concat("css/build.css"))
    .pipe(cssFilter.restore())   // Restores all of the removed files
    .pipe(gulp.dest("my-build-folder")); 
});
```
Another example where .less files are compiled to .css then fixed and checked:
```[javascript]
var gulp = require("gulp");
var less = require("gulp-less");
var splint = require("splint/gulp");

gulp.task("default", function() {
    gulp.src(["**/*.less"])
      .pipe(less())
      .pipe(splint({ fix: true }))
      .pipe(gulp.dest("my-build-folder")); 
});
```

# Options & splint-config.json
Options can be set in `splint-config.json` or in a Gulpfile or Gruntfile. A sample
`splint-config.json` file which contains the default values is shown below:
```
{
  "mainHtmlFile": "index.html",
  "mainPortletClass": "__SPNS__sp-wrapper",
  "fix": false,

  "cwd": "./",

  "fixes": {
    "html-jquery": true,
    "html-external-libs": true,
    "css-selectors": true,
    "css-positions": true,
    "css-widths": true,
    "js-selectors": true
  },

  "checks" : {
    "html-jquery": true,
    "html-external-libs": true,
    "css-selectors": true,
    "css-widths": true,
    "css-positions": true,
    "css-fonts": true,
    "js-selectors": true,
    "js-urls": true
  },

  "raw": false,
  "logFile": "",
  "silent": false,
  "verbose": true,
  
  "src": ["./**", "!**/node_modules/**", "!node_modules", "!**/sp-build/**", "!.", "!sp-build"],
  "dest": "sp-build",
}
```
The configuration file should be located in the current working directory or in
the same folder as any build file (if using a Grunt or gulp plugin).

The possible options

#### src
If using the Grunt and gulp plugins, this option should be specified in the Gruntfile/gulpfile.

A string or array of strings listing which files should be checked and/or fixed. This field supports globs and wildcards.
For example, `**/*.html` will match all html files. By default, the value is
set to the current directory.

This option accepts wildcards and globs. For example:
```
"src": ["**/*.html", "**/*.css", "!node_modules/**"]
```
will look at all html and css files, but ignore files under the node_modules directory.
Each element is executed in order. So if the following was given:
```
"src": ["**/*.html", "!node_modules/**", "**/*.css",]
```
then any css files in node_modules would not be ignored. The build directory should be ignored
to prevent creating unnecessary files.

#### fix
Either true or false. If this option is given, splint will fix some of the issues and store the
results in the directory specified by the build option

#### dest 
The build directory. If `fix` is false, no output will be produced in this directory.
With Grunt and Gulp, this is specified in the Gruntfile/gulpfile.

#### mainPortletClass
A class to be generated for the body. This will be used to restrict all
css stylings to descendants of the portlet's body tag. By default, this will have the
value of `__SPNS__sp-wrapper`.

#### fixes
The option can be used to choose which issues should be fixed. However, note
 that `fix` should be set to true in order for the fixes to be saved.
+ `html-jquery`: Either true or false. If true, any source tag that loads jquery without
    a CDN will be changed to use a CDN. Jquery Version ___ is used by default.
+ `html-external-libs`: Either true or false. If true, the attribute `data-scriptporltet-theme-capability="true"`
  will be given to all `script` tags that load external libraries. By default, this fix
  won't be performed as it also involves adding the library to the Portal theme.
- `css-selectors`: Either true or false. If true, css styles will be restricted to
  elements of the portlet and will not affect elements on the page that are outside the portlet.
    * NOTE: to completely fix css positions, splint should be called on all css and html files.
- `css-positions`: Either true or false. If true, any css that may position elements
  outside the portlet will be changed. In particular, `position: fixed` will be
  changed to `position: absolute` and the body will be given the style `position: relative`.
    * NOTE: to completely fix css positions, splint should be called on all css and html files.
- `css-widths`: Changes widths that may exceed the size of the portlet. In general,
  `width: 1200px` or `min-width: 1200px` will be changed to `width: 100%; max-width: 1200px`.
- `js-selectors`: Similar to the `css-selectors` option. If specified, splint will
  look for and fix unqualified selectors in javascript such as `$("body")` or `$("span")`.
    
#### checks
Selects which issues should be checked for:
- `html-jquery`:  Checks if jquery is locally hosted.
- `html-external-libs`: Checks if any external libraries are missing the
  `data-scriptporltet-theme-capability` attribute.
- `css-selectors`: Checks if there are any unqualified selectors in .css files.
  For example, `div { ... }` is an unqualified selector so it may affect the style
  of divs outside the portlet.
- `css-widths`: Checks .css files for any styles that may exceed the width of
  the portlet.
- `css-positions`: Checks for `position: fixed` since that may place elements
  outside the area of the portlet.
- `css-fonts`: checks for .ttf and .woff fonts.
- `js-selectors`: Similar to 
- `js-urls`: Looks for unmapped dynamic urls.
  
#### ~~verbose~~
Not currently implemented.

#### silent
If true, no output will be sent to the command line.

#### raw
Not currently implemented. If true, the warnings will be outputted in raw JSON.
If false, the output will be nicely formatted text, as in the default.
However, the raw output can be obtained by using callbacks

#### logFile
If specified, the output will be saved to the given file. This option
does not affect any output to the command line.

Some options are still being implemented and my be changed. Details of certain 
options can be found below.


# Checks and Fixes
Currently, splint performs the following checks:
+ For any unqualified selector that may affect other parts of the page
+ For fixed position in the css.
+ For some font types (in the css) that have caused issues
+ For a script tag linking to a locally hosted jquery library.
+ It warns if some widths may exceed the size of the portlet.
+ It naively searches for any unmapped dynamic urls.

The following fixes are done:
+ Automatically limiting styles to descendants of the given wrapper.
+ Automatically changes `position: fixed` to `position: absolute`.
+ Automatically give the body `position: relative` styling.
+ It can replace a jquery local source to a cdn.

[glob-stream]: https://github.com/wearefractal/glob-stream
[node-glob]: https://github.com/isaacs/node-glob