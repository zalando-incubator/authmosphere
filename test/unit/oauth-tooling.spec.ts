'use strict';

import * as chai from 'chai';

// TODO write more unit tests
import { handleAuthorziationBearer, getAccessToken } from '../../src/oauth-tooling';

let expect = chai.expect;

describe('OAuthService', () => {

  let responseMock: any;

  before(() => {

    responseMock = {};

    responseMock.status = function(status: string) {
      if (status) {
        this._status = status;
      }
      return this;
    };
    responseMock.type = function(p: string) {
      return this;
    };
    responseMock.sendStatus = function(status: string) {
      this.body = status;

      return this;
    };
    responseMock.end = function() {
      return this;
    };
  });

  it('should throw exception on missing configuration', () => {

    // TODO
    // then
    //expect(() => {
    //  new OAuthService(undefined);
    //}).to.throw(/Missing OAuthConfiguration./);
  });

  describe('handleAuthorziationBearer', () => {

    it('should call #next on public endpoint', () => {

      // given
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      handleAuthorziationBearer({
        publicEndpoints: [ '/public', '/healthcheck' ]
      })({ 'originalUrl': '/healthcheck' }, undefined, next);

      // then
      expect(called).to.be.true;
    });

    it('should not call #next when public endpoint is specified', () => {

      // given
      let called = false;
      let next = () => {
        called = true;
      };

      // when
      handleAuthorziationBearer({
        publicEndpoints: [ '/public', '/healthcheck' ]
      })({ 'originalUrl': '/privateAPI', headers: {} }, responseMock, next);

      // then
      expect(called).to.be.false;
    });
  });
});
