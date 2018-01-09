import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  getFileData,
  extractAccessToken,
  extractUserCredentials,
  extractClientCredentials,
  isCredentialsDirConfig,
  isPassCredentialsClientConfig,
  isPasswordGrantWOCredentialsDir
} from '../../src/utils';
import { OAuthGrantType } from '../../src/types';

chai.use(chaiAsPromised);
const expect = chai.expect;

const AUTHORIZATION_BEARER_PREFIX = 'Bearer';

describe('utils', () => {
  describe('getFileData', () => {
    it('should ignore tailing / in filepath', () => {
      const promise = Promise.all([
        getFileData('test/unit/credentials', 'user.json'),
        getFileData('test/unit/credentials/', 'user.json')
      ])
      .then((credentials) => {
        return credentials[0] === credentials[1];
        });
      return expect(promise).to.become(true);
    });

    it('should be rejected, if file does not exist', () => {
      const promise = getFileData('test/unit/credentials', 'foo.json');
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
      const given = {
        client_id: 'client_id',
        client_secret: 'client_secret',
        application_username: 'application_username',
        application_password: 'application_password'
      };

      const expected = '{"application_password":"application_password","application_username":"application_username"}';

      const result = extractUserCredentials(given);

      return expect(result).to.equal(expected);
    });
  });

  describe('extractClientCredentials', () => {
    it('return client credentials as string', () => {
      const given = {
        client_id: 'client_id',
        client_secret: 'client_secret'
      };

      const expected = '{"client_id":"client_id","client_secret":"client_secret"}';

      const result = extractClientCredentials(given);

      return expect(result).to.equal(expected);
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

      const result = isPassCredentialsClientConfig(config);

      return expect(result).to.equal(true);
    });
  });

  it('return false, if client_id do not exists in config', () => {
    const config = {
      client_id: undefined,
      client_secret: 'client_secret'
    };

    const result = isPassCredentialsClientConfig(config);

    return expect(result).to.equal(false);
  });

  it('return false, if client_secret do not exists in config', () => {
    const config = {
      client_id: 'client_id',
      client_secret: undefined
    };

    const result = isPassCredentialsClientConfig(config);

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

      const result = isPasswordGrantWOCredentialsDir(config);

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

    const result = isPasswordGrantWOCredentialsDir(config);

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

    const result = isPasswordGrantWOCredentialsDir(config);

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

    const result = isPasswordGrantWOCredentialsDir(config);

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

    const result = isPasswordGrantWOCredentialsDir(config);

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

    const result = isPasswordGrantWOCredentialsDir(config);

    return expect(result).to.equal(false);
  });
});
