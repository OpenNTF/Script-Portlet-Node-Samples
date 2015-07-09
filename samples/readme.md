# Using Node Tools for Script Portlet

Make sure that Node is installed on your system. Then install gulp globally:
```
$ npm install -g gulp
```
Next, inside each sample's directory, run the following from inside each sample's
directory to install any dependencies:
```
$ npm installl
```
This should install gulp and several gulp plugins. Afterwards, gulp can be used with the command
```
$ gulp
```
This will push each sample to the same portlet. (Each sample has the same sp-config.json)
The running portlets can be found on the playground site at this link:

The sample's won't work without being built. To run the samples run `$ gulp` then use `release/index.html`.

#### angular_contacts
This is the original angular contacts with a few changes:
- There is a gulp file to build the project
- A few script and link tags have been changed to reference the build folder.

When any source file is changed, the gulp script will:
- minify the .css files into a single .css file called all-styles.css
- lint the .js files
- uglify the .js files and concatenate them into a single file called all-scripts.css
- push the sample to the Playground on the demo site.

To run the sample, first run `gulp` then open index.html in Firefox (or in any browser
with a server). Gulp will continue running in the command line window and wait for
any file changes.

This sample does not use splint.

#### angular_contacts_splint
First install bower via npm:
```
$ npm install -g bower
```
Then install the bower dependencies:
```
$ bower install
```

Splint will fix several issues with this sample that are not portlet friendly:
+ CSS styles that affect other parts of the page
+ Elements that are positioned outside of the portlet using `position: fixed`.
+ jQuery is loaded locally.

Splint is used to fix those issues.

Run `$ npm install` and `$ bower install` before running `gulp` for the first time.

Next run `$ gulp` to build and push the sample. 

Afterwards, the sample can run in Firefox by
opening `./release/index.html`. Note that while running gulp on the command line,
it will wait and do nothing until a file is changed. Once a file is changed, gulp
will build and push the sample again so everything will be up to date.
