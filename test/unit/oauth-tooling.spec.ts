'use strict';

import * as chai from 'chai';

import {
  handleOAuthRequestMiddleware,
  requireScopesMiddleware,
  createAuthCodeRequestUri } from '../../src/oauth-tooling';

let expect = chai.expect;

describe('oauth tooling', () => {

  let requestMock: any;
  let responseMock: any;

  before(() => {

    requestMock = {};

    responseMock = {};
    responseMock.sendStatus = function(status: string) {
      this.status = status;
    };
  });

  it('should throw exception on missing configuration', () => {

    // TODO
  });

  describe('createAuthCodeRequestUri', () => {

    it('should return the correct uri as string', () => {

      // given
      const authorizationEndpoint = 'https://some.end.point';
      const clientId = 'clientID';
      const redirectUri = 'https://some.redirect.uri';

      // when
      const result = createAuthCodeRequestUri(authorizationEndpoint, clientId,
        redirectUri);

      // then
      const expected = authorizationEndpoint +
        '?client_id=' + clientId +
        '&redirect_uri=' + redirectUri +
        '&response_type=code' +
        '&realm=employees';

      expect(result).to.equal(expected);
    });
  });

  describe('requireScopesMiddleware', () => {

    it('should reject request with 403 if required scopes are not met', () => {

        // given
        requestMock.scopes = ['uid', 'test'];
        const requiredScopes = ['uid', 'test', 'additional'];
        let called = false;
        let next = () => {
          called = true;
        };

        // when
        requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

        // then
        expect(called).to.be.false;
        expect(responseMock.status).to.equal(403);
      });

    it('should call next() if required scopes are met', () => {

      // given
      requestMock.scopes = ['uid', 'test'];
      const requiredScopes = ['uid', 'test'];
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      requireScopesMiddleware(requiredScopes)(requestMock, responseMock, next);

      // then
      expect(called).to.be.true;
    });
  });

  describe('handleOAuthRequestMiddleware', () => {

    it('should call #next on public endpoint', () => {

      // given
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      handleOAuthRequestMiddleware({
        publicEndpoints: [ '/public', '/healthcheck' ]
      })({ 'originalUrl': '/healthcheck' }, undefined, next);

      // then
      expect(called).to.be.true;
    });

    it('should not call #next when non-public endpoint', () => {

      // given
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      handleOAuthRequestMiddleware({
        publicEndpoints: [ '/public', '/healthcheck' ]
      })({ 'originalUrl': '/privateAPI', headers: {} }, responseMock, next);

      // then
      expect(called).to.be.false;
    });
  });
});
