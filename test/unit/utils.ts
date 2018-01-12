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
import { OAuthGrantType } from '../../src';

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
        .then(([nonTailingCredentials, tailingCredentials]) => {
          expect(nonTailingCredentials).to.deep.equal(tailingCredentials);
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
    it('should return user credentials as object', () => {

      const clientId = 'clientId';
      const clientSecret = 'clientSecret';
      const applicationUsername = 'applicationUsername';
      const applicationPassword = 'applicationPassword';

      const given = {
        clientId,
        clientSecret,
        applicationUsername,
        applicationPassword
      };

      const expected: object = {
        applicationUsername,
        applicationPassword
      };

      const result = extractUserCredentials(given);

      return expect(result).to.deep.equal(expected);
    });

    it('should return client credentials as object', () => {

      const clientId = 'clientId';
      const clientSecret = 'clientSecret';
      const applicationUsername = 'applicationUsername';
      const applicationPassword = 'applicationPassword';

      const given = {
        clientId,
        clientSecret,
        applicationUsername,
        applicationPassword
      };

      const expected: object = {
        clientId,
        clientSecret
      };

      const result = extractClientCredentials(given);

      return expect(result).to.deep.equal(expected);
    });
  });

  describe('isCredentialsDirConfig', () => {
    it('should return true, if credentialsDir exists in config', () => {
      const config = {
        credentialsDir: 'credentialsDir'
      };

      const result = isCredentialsDirConfig(config);

      return expect(result).to.equal(true);
    });

    it('should return false, if credentialsDir do not exists in config', () => {
      const config = {
        credentialsDir: undefined
      };

      const result = isCredentialsDirConfig(config);

      return expect(result).to.equal(false);
    });
  });

  describe('isPassCredentialsClientConfig', () => {
    it('should return true, if clientId and client_secret exists in config', () => {
      const config = {
        clientId: 'clientId',
        clientSecret: 'clientSecret'
      };

      const result = isCredentialsClientConfig(config);

      return expect(result).to.equal(true);
    });

    it('should return false, if clientId do not exists in config', () => {
      const config = {
        clientId: undefined,
        clientSecret: 'clientSecret'
      };

      const result = isCredentialsClientConfig(config);

      return expect(result).to.equal(false);
    });

    it('should return false, if clientSecret do not exists in config', () => {
      const config = {
        clientId: 'clientId',
        clientSecret: undefined
      };

      const result = isCredentialsClientConfig(config);

      return expect(result).to.equal(false);
    });

    it('should return false, if applicationUsername do not exists in config', () => {
      const config = {
        grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
        applicationUsername: undefined,
        applicationPassword: 'applicationPassword',
        clientId: 'clientId',
        clientSecret: 'clientSecret'
      };

      const result = isPasswordGrantNoCredentialsDir(config);

      return expect(result).to.equal(false);
    });

    it('should return false, if applicationPassword do not exists in config', () => {
      const config = {
        grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
        applicationUsername: 'applicationUsername',
        applicationPassword: undefined,
        clientId: 'clientId',
        clientSecret: 'clientSecret'
      };

      const result = isPasswordGrantNoCredentialsDir(config);

      return expect(result).to.equal(false);
    });

    it('should return false, if clientId do not exists in config', () => {
      const config = {
        grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
        applicationUsername: 'applicationUsername',
        applicationPassword: 'applicationPassword',
        clientId: undefined,
        clientSecret: 'clientSecret'
      };

      const result = isPasswordGrantNoCredentialsDir(config);

      return expect(result).to.equal(false);
    });

    it('should return false, if clientSecret do not exists in config', () => {
      const config = {
        grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
        applicationUsername: 'applicationUsername',
        applicationPassword: 'applicationPassword',
        clientId: 'clientId',
        clientSecret: undefined
      };

      const result = isPasswordGrantNoCredentialsDir(config);

      return expect(result).to.equal(false);
    });

    it('should return false, if grantType != PASSWORD_CREDENTIALS_GRANT', () => {
      const config = {
        grantType: OAuthGrantType.CLIENT_CREDENTIALS_GRANT,
        applicationUsername: 'applicationUsername',
        applicationPassword: 'applicationPassword',
        clientId: 'clientId',
        clientSecret: 'clientSecret'
      };

      const result = isPasswordGrantNoCredentialsDir(config);

      return expect(result).to.equal(false);
    });
  });

  describe('isPasswordGrantWOCredentialsDir', () => {
    it('should return true, if clientId and clientSecret exists in config', () => {
      const config = {
        grantType: OAuthGrantType.PASSWORD_CREDENTIALS_GRANT,
        applicationUsername: 'applicationUsername',
        applicationPassword: 'applicationPassword',
        clientId: 'clientId',
        clientSecret: 'clientSecret'
      };

      const result = isPasswordGrantNoCredentialsDir(config);

      return expect(result).to.equal(true);
    });
  });
});
