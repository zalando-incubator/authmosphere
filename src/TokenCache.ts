'use strict';

import {
  getAccessToken,
  getTokenInfo
} from './oauth-tooling';

import {
  validateOAuthConfig
} from './utils';

const EXPIRE_THRESHOLD = 60 * 1000;

/**
 * Class to request and cache tokens on client-side.
 *
 * Usage:
 *  let tokenCache = new TokenCache({
 *    'nucleus': ['write.all', 'read.all']
 *  }, oAuthConfig);
 *
 *  tokenCache.get('nucleus')
 *    .then((tokeninfo) => {
 *      console.log(tokeninfo.access_token);
 *    });
 *
 */
class TokenCache {

  private _tokens: any = {};

  /**
   * `oauthConfig`:
   * `credentialsDir` string
   * `grantType` string
   * `accessTokenEndpoint` string
   * `tokenInfoEndpoint` string
   * `realm` string
   * `scopes` string optional
   * `redirect_uri` string optional (required with `AUTHORIZATION_CODE_GRANT`)
   * `code` string optional (required with `AUTHORIZATION_CODE_GRANT`)
   *
   * @param tokenConfig
   * @param oauthConfig
   */
  constructor(private tokenConfig: any, private oauthConfig: any) {

    validateOAuthConfig(oauthConfig);

    if (!oauthConfig.tokenInfoEndpoint) {
      throw TypeError('tokenInfoEndpoint must be defined');
    }
  }

  /**
   * Resolves with either a cached token for the given name or with a newly requested one (which is then cached).
   * Rejects if there is no token present and is not able to request a new one.
   *
   * @param tokenName
   * @returns {Promise<T>}
   */
  get(tokenName: string): Promise<any> {

    const promise = new Promise((resolve, reject) => {

      this.validateToken(tokenName)
        .then((token) => {

          return resolve(token);
        })
        .catch(() => {

          const config = Object.assign({}, this.oauthConfig, {
            scopes: this.tokenConfig[tokenName]
          });

          return getAccessToken(config)
            .then((token: any) => {

              return getTokenInfo(this.oauthConfig.tokenInfoEndpoint, token.access_token);
            })
            .then((tokenInfo: any) => {

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
   * @returns {Promise<any>}
   */
  refreshToken(tokenName: string): Promise<any> {

    this._tokens[tokenName] = undefined;
    return this.get(tokenName);
  }

  /**
   * Forces the cache to delete present tokens and request new ones.
   * Will resolve with an array of the newly requested tokens if the request was successful.
   * Otherwise, rejects.
   *
   * @returns {Promise<T[]>}
   */
  refreshAllTokens(): Promise<any> {

    let refreshPromises = Object.keys(this.tokenConfig).map(tokenName => this.refreshToken(tokenName));
    this._tokens = {};
    return Promise.all(refreshPromises);
  }

  /**
   * Checks whether a valid token for the given name is present.
   * Resolves with that token if that is the case.
   * Rejects otherwise.
   *
   * @param tokenName
   * @returns {Promise<T>}
   */
  private validateToken(tokenName: string): Promise<any> {

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
      .then(token => {
        return Promise.resolve(token);
      }).catch(() => {
        return Promise.reject(`Token ${tokenName} is invalid.`);
      });
  }
}

export {
  TokenCache
};
