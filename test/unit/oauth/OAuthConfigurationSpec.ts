'use strict';

/// <reference path="../typings/tsd.d.ts" />

import * as chai from 'chai';
import * as NodeURL from 'url';

import { OAuthConfiguration } from '../../../src/oauth/OAuthConfiguration';

var expect = chai.expect;

describe('OAuthConfiguration', () => {

  describe('#addPublicEndpoints', () => {
    it('should add public paths', () => {

      // given
      const config: OAuthConfiguration = new OAuthConfiguration();
      const givenEndPoints: Array<string> = [ 'public', 'healthcheck' ];

      // when
      config.addPublicEndpoints(givenEndPoints);
      const endPoints: Set<string> = config.publicEndpoints;

      // then
      expect(Array.from(endPoints)).to.eql(givenEndPoints);
    });
  });

  describe('#setAuthServerUrl', () => {
    it('should set auth server URL', () => {

      // given
      const config: OAuthConfiguration = new OAuthConfiguration();
      const AUTH_URL:NodeURL.Url = NodeURL.parse('https://auth.zalando.com/oauth2');

      // when
      config.setAuthServerUrl(AUTH_URL);

      // then
      expect(config.authServerUrl).to.eql(AUTH_URL);
    });
  });


  describe('#toString', () => {
    // TODO change to implementation
    it('should return a string representation', () => {

      // given
      const config: OAuthConfiguration = new OAuthConfiguration();
      const AUTH_URL:NodeURL.Url = NodeURL.parse('https://auth.zalando.com/oauth2');
      const givenEndPoints: Array<string> = [ 'assets', 'images' ];

      // when
      config.setAuthServerUrl(AUTH_URL);
      config.addPublicEndpoints(givenEndPoints);

      // then
      const strResult = config.toString();
      expect(strResult)
      .to
      .equal('OAuth Configuration:\n' +
             'Auth Server URL: https://auth.zalando.com/oauth2\n' +
             'Public access patterns:\n' +
             ' - assets\n' +
             ' - images\n');
    });
  });

});
