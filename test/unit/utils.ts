import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  getFileDataAsObject,
  extractAccessToken,
  extractUserCredentials,
  extractClientCredentials,
  isCredentialsDirConfig,
  isCredentialsClientConfig,
  isPasswordGrantNoCredentialsDir
} from '../../src/utils';
import { OAuthGrantType } from '../../src/types';

chai.use(chaiAsPromised);
const expect = chai.expect;

const AUTHORIZATION_BEARER_PREFIX = 'Bearer';

describe('utils', () => {
  describe('getFileData', () => {
    it('should ignore tailing / in filepath', () => {
      return Promise.all([
        getFileDataAsObject('test/unit/credentials', 'user.json'),
        getFileDataAsObject('test/unit/credentials/', 'user.json')
      ])
      .then((credentials) => {
        expect(credentials[0]).to.deep.equal(credentials[1]);
      });
    });

    it('should be rejected, if file does not exist', () => {
      const promise = getFileDataAsObject('test/unit/credentials', 'foo.json');
      return expect(promise).to.be.rejected;
    });
  });

  describe('extractAccessToken', () => {
    it('should return access_token from an authorization header', () => {
      const token = 'token1';
      const header = AUTHORIZATION_BEARER_PREFIX + ' ' + token;
      const result = extractAccessToken(header);
      return expect(result).to.equal(token);
    });

    it('should be rejected, if file does not exist', () => {
      const token = 'token1';
      const header = token;
      const result = extractAccessToken(header);
      return expect(result).to.equal(undefined);
    });
  });

  describe('extractUserCredentials', () => {
    it('return user credentials as string', () => {

      const clientId = 'client_id';
      const clientSecret = 'client_secret';
      const applicationUsername = 'application_username';
      const applicationPassword = 'application_password';

      const given = {
        client_id: clientId,
        client_secret: clientSecret,
        application_username: applicationUsername,
        application_password: applicationPassword
      };

      const expected: object = {
        application_username: applicationUsername,
        application_password: applicationPassword
      };

      const result = extractUserCredentials(given);

      return expect(result).to.deep.equal(expected);
    });
  });

  describe('extractClientCredentials', () => {
    it('return client credentials as string', () => {

      const clientId = 'client_id';
      const clientSecret = 'client_secret';
      const applicationUsername = 'application_username';
      const applicationPassword = 'application_password';

      const given = {
        client_id: clientId,
        client_secret: clientSecret,
        application_username: applicationUsername,
        application_password: applicationPassword
      };

      const expected: object = {
        client_id: clientId,
        client_secret: clientSecret
      };

      const result = extractClientCredentials(given);

      return expect(result).to.deep.equal(expected);
    });
  });

  describe('isCredentialsDirConfig', () => {
    it('return true, if credentialsDir exists in config', () => {
      const config = {
        credentialsDir: 'credentialsDir'
      };

      const result = isCredentialsDirConfig(config);

      return expect(result).to.equal(true);
    });
  });

  it('return false, if credentialsDir do not exists in config', () => {
    const config = {
      credentialsDir: undefined
    };

    const result = isCredentialsDirConfig(config);

    return expect(result).to.equal(false);
  });

  describe('isPassCredentialsClientConfig', () => {
    it('return true, if client_id and client_secret exists in config', () => {
      const config = {
        client_id: 'client_id',
        client_secret: 'client_secret'
      };

      const result = isCredentialsClientConfig(config);

      return expect(result).to.equal(true);
    });
  });

  it('return false, if client_id do not exists in config', () => {
    const config = {
      client_id: undefined,
      client_secret: 'client_secret'
    };

    const result = isCredentialsClientConfig(config);

    return expect(result).to.equal(false);
  });

  it('return false, if client_secret do not exists in config', () => {
    const config = {
      client_id: 'client_id',
      client_secret: undefined
    };

    const result = isCredentialsClientConfig(config);

    return expect(result).to.equal(false);
  });

  describe('isPasswordGrantWOCredentialsDir', () => {
    it('return true, if client_id and client_secret exists in config', () => {
      const config = {
        grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
        application_username: 'application_username',
        application_password: 'application_password',
        client_id: 'client_id',
        client_secret: 'client_secret'
      };

      const result = isPasswordGrantNoCredentialsDir(config);

      return expect(result).to.equal(true);
    });
  });

  it('return false, if application_username do not exists in config', () => {
    const config = {
      grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
      application_username: undefined,
      application_password: 'application_password',
      client_id: 'client_id',
      client_secret: 'client_secret'
    };

    const result = isPasswordGrantNoCredentialsDir(config);

    return expect(result).to.equal(false);
  });

  it('return false, if application_password do not exists in config', () => {
    const config = {
      grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
      application_username: 'application_username',
      application_password: undefined,
      client_id: 'client_id',
      client_secret: 'client_secret'
    };

    const result = isPasswordGrantNoCredentialsDir(config);

    return expect(result).to.equal(false);
  });

  it('return false, if client_id do not exists in config', () => {
    const config = {
      grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
      application_username: 'application_username',
      application_password: 'application_password',
      client_id: undefined,
      client_secret: 'client_secret'
    };

    const result = isPasswordGrantNoCredentialsDir(config);

    return expect(result).to.equal(false);
  });

  it('return false, if client_secret do not exists in config', () => {
    const config = {
      grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
      application_username: 'application_username',
      application_password: 'application_password',
      client_id: 'client_id',
      client_secret: undefined
    };

    const result = isPasswordGrantNoCredentialsDir(config);

    return expect(result).to.equal(false);
  });

  it('return false, if grantType != PASSWORD_CREDENTIALS_GRANT', () => {
    const config = {
      grantType: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
      application_username: 'application_username',
      application_password: 'application_password',
      client_id: 'client_id',
      client_secret: 'client_secret'
    };

    const result = isPasswordGrantNoCredentialsDir(config);

    return expect(result).to.equal(false);
  });
});
