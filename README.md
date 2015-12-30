# oauth-client-to-server-ts


A simple typescript based OAuth support library for the [Authorization Code flow](http://stups.readthedocs.org/en/latest/user-guide/access-control.html#implementing-a-client-asking-resource-owners-for-permission).



## Setup

* Install node >=4.0.0
* `npm install -g typescript@1.8.0-dev.20151113` - need this version to create ES6 output with commonjs modules
* `npm install -g tsd`
* `npm install -g ts-node`
* `npm install -g mocha`
* //npm install --global gulp
* clone project
* `npm i`


## IDE support

* Atom + the wonderful [atom-typescript](https://atom.io/packages/atom-typescript)
plugin offers all needed features (refactoring, semantic view, autocomplete, js preview, dependency graph)
* IntelliJ can open the project using `tsconfig.json` file.



## development

* console 1
  * `tsc -w`
* console 2
  * `node build/bootstrap-content-server.js`


## Testing

Both commands requires a global installed Mocha: `npm install -g mocha`.

* `mocha integration-test/**/*.ts` - runs all tests
* `mocha` - run all unit tests
* [How to Debug Mocha Tests With Chrome](http://blog.andrewray.me/how-to-debug-mocha-tests-with-chrome/)


## debug

* https://greenido.wordpress.com/2013/08/27/debug-nodejs-like-a-pro/
* start app:  node debug build/js/bootstrap-content-server.js
  * type `c` for next break point
* `node-inspector &`
* open in chrome http://127.0.0.1:8080/debug?port=5858
  * enjoy debugging
