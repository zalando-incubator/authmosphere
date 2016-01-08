'use strict';

import * as NodeURL from 'url';

class OAuthConfiguration {

  private _publicEndpoints: Set<string>;
  private _authServerUrl: NodeURL.Url;
  private _credentialsDir: string;

  constructor() {
    this._publicEndpoints = new Set<string>();
    this._credentialsDir = process.env.CREDENTIALS_DIR;
  }

  addPublicEndpoints(pattern:Array<string>): OAuthConfiguration {

    // TODO Do we need to validate the paths in some way?
    // TODO Use a reges pattern instead of just a string?
    if (pattern) {
      pattern.forEach((value) => {
        this._publicEndpoints.add(value);
      });
    }
    return this;
  }

  setAuthServerUrl(authServerUrl: NodeURL.Url): OAuthConfiguration {

    this._authServerUrl = authServerUrl;

    return this;
  }

  setCredentialsDir(credentialsDir: string): OAuthConfiguration {

    this._credentialsDir = credentialsDir;

    return this;
  }

  get publicEndpoints(): Set<string> {
    return new Set<string>(this._publicEndpoints);
  }

  get authServerUrl(): NodeURL.Url {
    return this._authServerUrl;
  }

  get credentialsDir(): string {
    return this._credentialsDir;
  }



  /**
   * Return the OAuthConfiguration as a string.
   * Could be used to print stuff to the log files.
   */
  toString(): string {

    function endpointsToString(endpoints: Set<string>) {

      var ret = 'Public access patterns:\n';

      endpoints.forEach((endpoint) => {
        ret += ' - ' + endpoint  + '\n';
      });

      return ret;
    }

    var strRep = 'OAuth Configuration:\n' +
                 'Credentials directory: ' + this.credentialsDir + '\n' +
                 'Auth Server URL: ' + this.authServerUrl.href + '\n' +
                 endpointsToString(this.publicEndpoints);

    return strRep;
  }
}

export { OAuthConfiguration };
