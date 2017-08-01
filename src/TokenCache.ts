import { getAccessToken, getTokenInfo } from './oauth-tooling';

import { validateOAuthConfig } from './utils';
import { OAuthConfig, Token, TokenCacheConfig } from './types';

const defaultTokenCacheConfig: TokenCacheConfig = {
  /**
   * To determine when a token is expired locally (means
   * when to issue a new token): if the token exists for
   * ((1 - percentageLeft) * lifetime) then issue a new one.
   */
  percentageLeft: 0.75
};

/**
 * Class to request and cache tokens on client-side.
 *
 * Usage:
 *  const tokenCache = new TokenCache({
 *    'nucleus': ['write.all', 'read.all']
 *  }, oAuthConfig);
 *
 *  tokenCache.get('nucleus')
 *  .then((token) => {
 *    console.log(token.access_token);
 *  });
 *
 */
class TokenCache {

  private _tokens: { [key: string]: Token } = {};

  /**
   * `oauthConfig`:
   * `credentialsDir` string
   * `grantType` string
   * `accessTokenEndpoint` string
   * `tokenInfoEndpoint` string
   * `realm` string
   * `scopes` string[] optional
   * `queryParams` {} optional
   * `redirect_uri` string optional (required with `AUTHORIZATION_CODE_GRANT`)
   * `code` string optional (required with `AUTHORIZATION_CODE_GRANT`)
   *
   * @param tokenConfig
   * @param oauthConfig
   */
  constructor(private tokenConfig: { [key: string]: string[] },
              private oauthConfig: OAuthConfig,
              private tokenCacheConfig?: TokenCacheConfig) {

    validateOAuthConfig(oauthConfig);

    this.tokenCacheConfig = Object.assign({}, defaultTokenCacheConfig, tokenCacheConfig);

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
      .then(token => token.access_token);
  }

  /**
   * Resolves with either a cached token for the given name or with a newly requested one (which is then cached).
   * Rejects if there is no token present and is not able to request a new one.
   *
   * @param tokenName
   * @returns {Promise<Token>}
   */
  get(tokenName: string): Promise<Token> {

    const promise = this.validateToken(tokenName)
      .catch(() => {

        const config = {
          ...this.oauthConfig,
          scopes: this.tokenConfig[tokenName]
        };

        return getAccessToken(config)
          .then((token) => {

            const localExpiry = Date.now() + (token.expires_in * 1000 * (1 - this.tokenCacheConfig.percentageLeft));
            this._tokens[tokenName] = {
              ...token,
              local_expiry: localExpiry
            };

            return token;
          })
          .then((token) => getTokenInfo(this.oauthConfig.tokenInfoEndpoint, token.access_token));
    });

    return promise;
  }

  /**
   * Forces the cache to delete present token for the given name.
   * Will resolve the newly requested token if the request was successful.
   * Otherwise, rejects.
   *
   * @param tokenName
   * @returns {Promise<Token>}
   */
  refreshToken(tokenName: string): Promise<Token> {

    this._tokens[tokenName] = undefined;

    return this.get(tokenName);
  }

  /**
   * Forces the cache to delete present tokens and request new ones.
   * Will resolve with an hashmap of the newly requested tokens if the request was successful.
   * Otherwise, rejects.
   *
   * @returns {Promise<Token>}
   */
  refreshAllTokens(): Promise<{ [key: string]: Token }> {

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
   * @returns {Promise<Token>}
   */
  private validateToken(tokenName: string): Promise<Token> {

    if (this.tokenConfig[tokenName] === undefined) {
      return Promise.reject(`Token ${tokenName} does not exist.`);
    }

    const token = this._tokens[tokenName];

    if (token === undefined) {
      return Promise.reject(`No token available for ${tokenName}`);
    }

    if (token.local_expiry < Date.now()) {
      return Promise.reject(`Token ${tokenName} expired locally.`);
    }

    return Promise.resolve(token);
  }
}

export {
  TokenCache,
  defaultTokenCacheConfig
};
