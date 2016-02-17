# lib-oauth-tooling

A simple typescript based OAuth support library supporting OAuth2 flow, currently it supports:

* Authorization Code flow
* Resource Owner Password Credentials Grant
* Express middlewares to simplify authentication/authorization
* `TokenCache` service to manage your access tokens in your node application

See [STUPS documentation](http://stups.readthedocs.org/en/latest/user-guide/access-control.html#implementing-a-client-asking-resource-owners-for-permission) and [OAuth2 documentation](https://tools.ietf.org/html/rfc6749) for more information.


## Usage

Run `npm install --save git+ssh://git@github.bus.zalan.do:graviton/lib-oauth-tooling.git#TAG/COMMIT` where `TAG/COMMIT` has to be replaced with the release tag or commit id you want to use.
Import a member of this lib like so (of course ES5 syntax is working as well...):
```
import {
    TokenCache,
    handleOAuthRequestMiddleware,
    requireScopesMiddleware,
    ...
} from 'oauth-lib-tooling';
```

#### TokenCache(tokenConfig: any, oauthConfig: any)
Class to request and cache tokens on client-side. 
```
let tokenCache = new TokenCache({
  'service-foo': ['foo.read', 'foo.write'],
  'service-bar': ['bar.read']
}, oAuthConfig);

tokenCache.get('your-app-name')
  .then((tokeninfo) => {
    console.log(tokeninfo.access_token);
  });
```
`oauthConfig`:
* `credentialsDir` string
* `grantType` string
* `accessTokenEndpoint` string
* `tokenInfoEndpoint` string
* `realm` string
* `scopes` string optional
* `redirect_uri` string optional (required with `AUTHORIZATION_CODE_GRANT`)
* `code` string optional (required with `AUTHORIZATION_CODE_GRANT`)

#### handleOAuthRequestMiddleware(options: any)
Express middleware to extract and validate an access token. It attaches the scopes matched by the token to the request (`request.scopes`) for further usage.
If the token is not valid the request is rejected (with 401 Unauthorized).
```
app.use(handleOAuthRequestMiddleware({
    publicEndpoints: ['/heartbeat', '/status'],
    tokenInfoEndpoint: 'auth.example.com/tokeninfo'
});
```
`options`:
* `publicEndpoints` string[]
* `tokenInfoEndpoint` string


#### requireScopesMiddleware(scopes: string[])
Specifies the scopes needed to access an endpoint. Assumes that there is an `req.scopes` property (as attached by `handleOAuthRequestMiddleware`) to match the required scopes against.
If the the requested scopes are not matched request is rejected (with 403 Forbidden).
```
app.get('/secured/route', requireScopesMiddleware(['scopeA', 'scopeB']), (req, res) => {
    // do your work...
})
```

#### getTokenInfo(tokenInfoUrl: string, accessToken: string): Promise<any>
Makes a request to the `tokenInfoUrl` to validate the given `accessToken`.
```
getTokenInfo(tokenInfoUrl, accessToken)
  .then((tokeninfo) => {
    console.log(tokeninfo.access_token);
  })
  .catch((err) => {
    console.log(err);
  });
```

#### getAccessToken(options: any)
Helper function to get an access token for the specified scopes.
```
getAccessToken(options)
  .then((accessToken) => {
    console.log(accessToken);
  })
  .catch((err) => {
    console.log(err);
  });
```
`options`:
* `credentialsDir` string
* `grantType` string
* `accessTokenEndpoint` string
* `realm` string
* `scopes` string optional
* `redirect_uri` string optional (required with `AUTHORIZATION_CODE_GRANT`)
* `code` string optional (required with `AUTHORIZATION_CODE_GRANT`)

#### AUTHORIZATION_CODE_GRANT
String constant specifying the Authorization Code Grant type.

#### PASSWORD_CREDENTIALS_GRANT
String constant specifying the Resource Owner Password Credentials Grant type.

#### SERVICES_REALM
String constant specifying the services realm.

#### EMPLOYEES_REALM
String constant specifying the employees realm.


## Testing

Both commands require a global installed mocha (`npm install -g mocha`) and ts-node (`npm install -g ts-node`).

* `npm test` - runs unit tests
* `npm run integration-test` - runs integration tests
* [How to Debug Mocha Tests With Chrome](http://blog.andrewray.me/how-to-debug-mocha-tests-with-chrome/)


## Debugging

* https://greenido.wordpress.com/2013/08/27/debug-nodejs-like-a-pro/
* start app:  node debug build/js/bootstrap-content-server.js
  * type `c` for next break point
* `node-inspector &`
* open in chrome http://127.0.0.1:8080/debug?port=5858
  * enjoy debugging
