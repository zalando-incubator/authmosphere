## Changelog

### `authmosphere 2.0.x` - **BREAKING**

**TODO**

---

### `authmosphere 1.0.0` - **BREAKING**

Modified signature of `createAuthCodeRequestUri`, see migration guide for more information.

---

### `lib-oauth-tooling 2.0.0` - **BREAKING**

The (zalando-specific) `realm` property was removed from `OAuthConfig`. Also, the corresponding constants (`SERVICES_REALM` and `EMPLYEES_REALM`) were removed. Instead, you can add the realm (and arbitrary other query parameters) via the `queryParams` property in `OAuthConfig`.

### `lib-oauth-tooling 1.0.0` - **BREAKING**

The signature of `requireScopesMiddleware` is now incompatible with previous versions, `precedenceFunction?` is now part of `precedenceOptions?`.
