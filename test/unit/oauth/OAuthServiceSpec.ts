'use strict';



import * as chai from 'chai';
import * as NodeURL from 'url';
import * as HttpStatus from 'http-status';
import * as Express from 'express';


import { OAuthConfiguration } from '../../../src/oauth/OAuthConfiguration';
import { OAuthService } from '../../../src/oauth/OAuthService';

var expect = chai.expect;
const AUTHORIZATION_HEADER_FIELD_NAME = 'authorization';


describe('OAuthService', () => {

  let config: OAuthConfiguration;
  let responseMock: any;

  before(() => {
    config = new OAuthConfiguration();
    config.addPublicEndpoints([ '/public', '/healthcheck' ]);

    responseMock = function() {
    };
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

    // then
    expect(() => {
      new OAuthService(undefined);
    }).to.throw(/Missing OAuthConfiguration./);
  });

  describe('OAuth middleware', () => {
    it('should call #next on public endpoint', () => {

      // given
      var called = false;
      const service: OAuthService = new OAuthService(config);
      var next = function() {
        called = true;
      }

      // when
      service.oauthMiddleware()({ "originalUrl": "/healthcheck" }, undefined, next);

      // then
      expect(called).to.be.true;
    });

    it('should not call #next when public endpoint is specified', () => {

      // given
      var called = false;
      const service: OAuthService = new OAuthService(config);
      var next = function() {
        called = true;
      }

      // when
      service.oauthMiddleware()({ "originalUrl": "/privateAPI", headers: {} }, responseMock, next);

      // then
      expect(called).to.be.false;
    });
  });
});
