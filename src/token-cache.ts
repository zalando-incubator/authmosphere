import { getAccessToken, getTokenInfo } from './oauth-tooling';

import { validateOAuthConfig } from './utils';

import {
  TokenCacheOAuthConfig,
  Token,
  TokenCacheOptions,
  Logger,
  CacheConfig
} from './types';

import { safeLogger } from './safe-logger';

const defaultCacheConfig: CacheConfig = {
  /**
   * To determine when a token is expired locally (means
   * when to issue a new token): if the token exists for
   * ((1 - percentageLeft) * lifetime) then issue a new one.
   */
  percentageLeft: 0.75
};

type TokenMap = { [key: string]: Token | undefined };

/**
 * Class to request and cache tokens on client-side.
 *
 * Usage:
 *  const tokenCache = new TokenCache({
 *    'nucleus': ['write.all', 'read.all']
 *  }, oAuthConfig, options);
 *
 *  tokenCache.get('nucleus')
 *  .then((token) => {
 *    console.log(token.access_token);
 *  });
 *
 */
class TokenCache {

  private _tokens: TokenMap = {};
  private logger: Logger;

  private cacheConfig: CacheConfig = defaultCacheConfig;

  /**
   * @param tokenConfig
   * @param oauthConfig
   */
  constructor(private tokenConfig: { [key: string]: string[] },
              private oauthConfig: TokenCacheOAuthConfig,
              options: TokenCacheOptions = {}) {

    validateOAuthConfig(oauthConfig);

    this.logger = safeLogger(options.logger);

    this.cacheConfig = {
      ...this.cacheConfig,
      ...options.cacheConfig
    };

    if (!oauthConfig.tokenInfoEndpoint) {
      throw TypeError('tokenInfoEndpoint must be defined');
    }

    this.logger.debug('TokenCache initilialised successfully');
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

    if (!this.isTokenConfigured(tokenName)) {
      const msg = `TokenCache miss: ${tokenName} does not exist`;
      this.logger.debug(msg);

      return Promise.reject(msg);
    }

    const promise = this.getCachedToken(tokenName)
      .catch(() => {

        const config = {
          ...this.oauthConfig,
          scopes: this.tokenConfig[tokenName]
        };

        return getAccessToken(config)
          .then((token) => {

            const expiresIn = token.expires_in || 0;

            const localExpiry = Date.now() + (expiresIn * 1000 * (1 - this.cacheConfig.percentageLeft));

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

    this.logger.debug(`TokenCache: refresh of ${tokenName} triggered`);

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
  refreshAllTokens(): Promise<TokenMap> {

    const refreshPromises = Object
      .keys(this.tokenConfig)
      .map(tokenName => this.refreshToken(tokenName));

    this._tokens = {};

    return Promise
      .all(refreshPromises)
      .then(() => this._tokens);
  }

  private isTokenConfigured(tokenName: string): boolean {
    return this.tokenConfig[tokenName] !== undefined;
  }

  /**
   * Checks whether a valid token for the given name is present.
   * Resolves with that token if that is the case.
   * Rejects otherwise.
   *
   * @param tokenName
   * @returns {Promise<Token>}
   */
  private getCachedToken(tokenName: string): Promise<Token> {

    const token = this._tokens[tokenName];

    if (token === undefined) {
      const msg = `TokenCache miss: ${tokenName}`;
      this.logger.debug(msg);
      return Promise.reject(msg);
    }

    const localExpiry = token.local_expiry || 0;

    if (localExpiry < Date.now()) {
      const msg = `TokenCache miss: ${tokenName} expired locally`;
      this.logger.debug(msg);
      return Promise.reject(msg);
    }

    this.logger.debug(`TokenCache hit: ${tokenName}`);
    return Promise.resolve(token);
  }
}

export {
  TokenMap,
  TokenCache,
  defaultCacheConfig
};
