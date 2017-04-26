import { getAccessToken, getTokenInfo } from './oauth-tooling';

import { validateOAuthConfig } from './utils';

const EXPIRE_THRESHOLD = 60 * 1000;

/**
 * Class to request and cache tokens on client-side.
 *
 * Usage:
 *  const tokenCache = new TokenCache({
 *    'nucleus': ['write.all', 'read.all']
 *  }, oAuthConfig);
 *
 *  tokenCache.get('nucleus')
 *  .then((tokeninfo) => {
 *    console.log(tokeninfo.access_token);
 *  });
 *
 */
class TokenCache {

  private _tokens: { [key: string]: TokenInfo } = {};

  /**
   * `oauthConfig`:
   * `credentialsDir` string
   * `grantType` string
   * `accessTokenEndpoint` string
   * `tokenInfoEndpoint` string
   * `realm` string
   * `scopes` string optional
   * `queryParams` {} optional
   * `redirect_uri` string optional (required with `AUTHORIZATION_CODE_GRANT`)
   * `code` string optional (required with `AUTHORIZATION_CODE_GRANT`)
   *
   * @param tokenConfig
   * @param oauthConfig
   */
  constructor(private tokenConfig: { [key: string]: string[] }, private oauthConfig: OAuthConfig) {

    validateOAuthConfig(oauthConfig);

    if (!oauthConfig.tokenInfoEndpoint) {
      throw TypeError('tokenInfoEndpoint must be defined');
    }
  }

  /**
   * The resolveAccessTokenFactory function, creates a function,
   * which resolves a specific access_token.
   *
   * @param {string} The key configured on the tokenCache instance
   * @return {Promise<string>} the resolved access_token
   */
  public resolveAccessTokenFactory(key: string): () => Promise<string> {
    return () => this
      .get(key)
      .then(tokenInfo => tokenInfo.access_token);
  }

  /**
   * Resolves with either a cached token for the given name or with a newly requested one (which is then cached).
   * Rejects if there is no token present and is not able to request a new one.
   *
   * @param tokenName
   * @returns {Promise<T>}
   */
  get(tokenName: string): Promise<TokenInfo> {

    const promise = new Promise((resolve, reject) => {

      this
      .validateToken(tokenName)
      .then((token) => {

        return resolve(token);
      })
      .catch(() => {

        const config = {
          ...this.oauthConfig,
          scopes: this.tokenConfig[tokenName]
        };

        return getAccessToken(config)
          .then((token: Token) => {

            return getTokenInfo(this.oauthConfig.tokenInfoEndpoint, token.access_token);
          })
          .then((tokenInfo: TokenInfo) => {

            tokenInfo.local_expiry = Date.now() + tokenInfo.expires_in * 1000 - EXPIRE_THRESHOLD;
            this._tokens[tokenName] = tokenInfo;
            resolve(tokenInfo);
          })
          .catch((err) => {

            return reject(err);
          });
      });
    });

    return promise;
  }

  /**
   * Forces the cache to delete present token for the given name.
   * Will resolve the newly requested token if the request was successful.
   * Otherwise, rejects.
   *
   * @param tokenName
   * @returns {Promise<TokenInfo>}
   */
  refreshToken(tokenName: string): Promise<TokenInfo> {

    this._tokens[tokenName] = undefined;

    return this.get(tokenName);
  }

  /**
   * Forces the cache to delete present tokens and request new ones.
   * Will resolve with an hashmap of the newly requested tokens if the request was successful.
   * Otherwise, rejects.
   *
   * @returns {Promise<T>}
   */
  refreshAllTokens(): Promise<{ [key: string]: TokenInfo }> {

    const refreshPromises = Object
      .keys(this.tokenConfig)
      .map(tokenName => this.refreshToken(tokenName));

    this._tokens = {};

    return Promise
      .all(refreshPromises)
      .then(() => this._tokens);
  }

  /**
   * Checks whether a valid token for the given name is present.
   * Resolves with that token if that is the case.
   * Rejects otherwise.
   *
   * @param tokenName
   * @returns {Promise<T>}
   */
  private validateToken(tokenName: string): Promise<TokenInfo> {

    if (!this.tokenConfig[tokenName]) {
      throw Error(`Token ${tokenName} does not exist.`);
    }

    if (!this._tokens[tokenName]) {
      return Promise.reject(`No token available for ${tokenName}`);
    }

    const token = this._tokens[tokenName];
    if (token.local_expiry < Date.now()) {
      return Promise.reject(`Token ${tokenName} expired locally.`);
    }

    return getTokenInfo(this.oauthConfig.tokenInfoEndpoint, token.access_token)
      .then(validatedToken => {
        return Promise.resolve(validatedToken);
      })
      .catch(() => {
        return Promise.reject(`Token ${tokenName} is invalid.`);
      });
  }
}

export { TokenCache };
