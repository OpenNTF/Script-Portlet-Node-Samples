#Sample Node.js Build Tools for Script Portlet

## Samples
There are a few sample portlets that use a few Node.js build tools. To run the samples, first install gulp and bower globally:
```
$ npm install -g bower gulp
```
Then, inside each sample's directory, run the following to install any dependencies:
```
$ npm install
$ bower install
```
This should install gulp and several gulp plugins. Afterwards, gulp can be used with the command
```
$ gulp
```
This will push each sample to the same portlet. (Each sample has the same sp-config.json)
The running portlets can be found on the playground site at this link:


#### angular_contacts
This is the original angular contacts with a few changes:
- There is a gulp file to build the project
- A few script and link tags have been changed to reference the build folder.

When any source file is changed, the gulp script will:
- minify the .css files into a single .css file called all-styles.css
- lint the .js files
- uglify the .js files and concatenate them into a single file called all-scripts.css
- push the sample to the Playground on the demo site.

When gulp lints the javascript, one error will appear but everything works.

To run the sample, first run `gulp` then open index.html in Firefox (or in any browser
with a server). Gulp will continue running in the command line window and wait for
any file changes.

#### angular_contancts_splint
The original sample with more changes.
- The bootstrap less source is used instead of cdn.
- Some link and script tags have been changed in index.html
- Some styling has been changed
- jquery was used for some dynamic styles
- The 'Example Inc' logo was inserted.

Run `npm install` before running `gulp` for the first time.

Run `gulp` to build and push the sample. Afterwards, the sample can run in Firefox by
opening `./release/index.html`. Note that while running gulp on the command line,
it will wait and do nothing until a file is changed. Once a file is changed, gulp
will build and push the sample again so everything will be up to date.

# Splint
Splint is a Node.js utility for making your application more portlet 
friendly. More information can be found in its README.
