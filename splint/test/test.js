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

var chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

var fs = require("fs");

var Promise = require("bluebird");

/**
 * SPLINT CSS TESTS
 */
describe("splint-css", function() {
  var lintCss;

  beforeEach(function() {
    lintCss = require("../lib/splint-css.js")({ log: console.log });
  });

  it("should find unqualified tagName selectors", function() {
    var css = "body { }";
    var warnings = lintCss(css);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("css-selectors");

    css = "a { }";
    warnings = lintCss(css);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("css-selectors");

    css = "a, p, h1 { }";
    warnings = lintCss(css);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("css-selectors");
  });

  it("should find unqualified descendant selectors", function() {
    var css = "div p { }";
    var warnings = lintCss(css);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("css-selectors");

    css = "a, div p, h1 { }";
    warnings = lintCss(css);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("css-selectors");
  });

  it("should fix unqualified tagName selectors", function() {
    var css = "body { width: 100px; }";
    lintCss(css, function(err, result) {
      expect(result.replace(/\s/g, "")).to.equal("__SPNS__sp-wrapper{width:100px;}");
    });

    css = "a { width: 100px; }";
    lintCss(css, function(err, result) {
      expect(result.replace(/\s/g, "")).to.equal("__SPNS__sp-wrappera{width:100px;}");
    });

    css = "a, p, h1 {width: 100px; }";
    lintCss(css, function(err, result) {
      expect(result.replace(/\s/g, "")).to
        .equal("__SPNS__sp-wrappera,__SPNS__sp-wrapperp,__SPNS__sp-wrapperh1{width:100px;}");
    });
  })

});

/**
 * SPLINT HTML TESTS
 */
describe("splint-html", function() {
  var lintHtml;

  beforeEach(function() {
    var config = require("../lib/default-config.json");
    config.wrapper = config.mainPortletClass;
    lintHtml = require("../lib/splint-html")(config);
  });

  it("should handle all possible configs correctly", function() {
    require("../lib/splint-html");
    require("../lib/splint-html")();
    require("../lib/splint-html")({});
  });

  it("should find local jquery script tag(s) if such tags exist", function() {
    var html = "<script src='jquery.js'></script>";
    var warnings = lintHtml(html);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("html-jquery");

    html = "<script src='jquery.js'></script><script src='jquery.min.js'></script>";
    warnings = lintHtml(html);
    expect(warnings).to.have.length(2);
    expect(warnings[0].issue).to.equal("html-jquery");
    expect(warnings[1].issue).to.equal("html-jquery");

    html = "";
    warnings = lintHtml(html);
    expect(warnings).to.be.empty;
  });

  it("should find external libs from bower", function() {
    var html = "<script src='bower_components/something.js'></script>";
    var warnings = lintHtml(html);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("html-external-libs");
  });

  it("should check the css of style tags", function() {

  });
});

/**
 *  SPLINT JS TESTS
 */
describe("splint-js", function() {
  var lintJs;

  beforeEach(function() {
    var config = require("../lib/default-config.json");
    config.wrapper = config.mainPortletClass;
    lintJs= require("../lib/splint-js")(config);
  });

  /**
   * This tests splint-js' ability to find dynamic unmapped urls. Currently,
   * it should match strings of the following form:
   *
   * + "directory" + string
   *   - eg: "local/path/to/" + file
   *   - the directory string must end in a forward slash
   */
  it("should find all unmapped dynamic urls with directories", function() {
    var js = "'local/path/to/' + file";
    var warnings = lintJs(js);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("js-urls");

    js = "return 'local/path/to/' + file";
    lintJs(js);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("js-urls");

    js = "functionOf('local/path/to/' + file)";
    lintJs(js);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("js-urls");
  });

  it("should find all unmapped dynamic urls with file extensions", function() {
    var js = "pic + '.jpeg'";
    var warnings = lintJs(js);
    expect(warnings).to.have.length(1);
    expect(warnings[0].issue).to.equal("js-urls");
  });

  it("should not warn about any mapped dynamic urls with directories", function() {
    var js = "__SPNS__spHelper.getElementURL('local/path/to/' + file)";
    var warnings = lintJs(js);
    expect(warnings).to.be.empty;
  });
});

/**
 * SPLINT CORE TESTS
 */
describe("splint", function() {
  var splint;
  beforeEach(function() {
    splint = require("../lib/splint");
    splint.init();
    splint.config({ cwd: "./test", silent: true });
  });

  it("should not persistently save options passed to run()", function(done) {
    fs.writeFileSync("./test/script_for_testing.js", "var pic='';pic+'.jpeg';");
    var opts = {
      checks: { "js-urls": false }
    };
    splint.config({ src: "script_for_testing.js" });
    splint.run(opts, function(err, out, raw) {
      expect(raw).to.have.length(1);
      expect(raw[0].messages).to.be.empty;

      // Run it with no options so that defaults are used
      splint.run(function(err, out, raw) {
        expect(raw).to.have.length(1);
        expect(raw[0].messages).to.have.length(1);
        expect(raw[0].messages[0].issue).to.equal("js-urls");
        done();
      });
    });
  });

  it("should be able to promisify run", function(done) {
    fs.writeFileSync("./test/script_for_testing.js", "var pic='';pic+'.jpeg';");
    splint.config({ src: "script_for_testing.js" });
    var spRun = Promise.promisify(splint.run);
    spRun({}).spread(function(out, raw) {
      expect(raw).to.have.length(1);
      expect(raw[0].messages).to.have.length(1);
      expect(raw[0].messages[0].issue).to.equal("js-urls");
      done();
    });
  });

});