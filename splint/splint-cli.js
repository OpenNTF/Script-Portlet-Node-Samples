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

var splint = require("./lib/splint");

var args = require("minimist")(process.argv.slice(2));

var initArgs = function() {
  args.fix = args.fix || args.f;

  args.silent = args.silent || args.s;

  args.dest = args.dest || args.d || "sp-build";

  args.cwd = args.cwd || "./";

  args.conf = args.conf || args.c || "splint-config.json";

  args.verbose = args.verbose || args.v;
};

initArgs();

splint.init();

splint.config(args);

splint.run();
