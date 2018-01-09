import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { handleOAuthRequestMiddleware } from '../../../src';

import { Response, Request } from 'express';

chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

describe('express tooling', () => {

  const createRequestMock = (scopes: String[]): Request => ({
    get: (name: string) => name,
    $$tokeninfo: {
      scope: scopes
    }
  } as any as Request);

  const createResponseMock = (): Response => ({
    sendStatus: sinon.spy((status: string) => undefined)
  } as any as Response);

  describe('handleOAuthRequestMiddleware', () => {

    it('should throw a TypeError, if tokenInfoEndpoint is undefined', () => {

      // given
      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: ''
      };

      // then
      expect(() => { handleOAuthRequestMiddleware(config); }).to.throw(TypeError);
    });

    it('should call #next on public endpoint', (done) => {

      // given
      const next = sinon.spy();

      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const requestMock = {
        originalUrl: '/healthcheck',
        headers: {},
        ...createRequestMock([])
      } as any as Request;

      // when
      handleOAuthRequestMiddleware(config)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        done();
      });
    });

    it('should not call #next when non-public endpoint', (done) => {

      // given
      const next = sinon.spy();

      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const requestMock = {
        originalUrl: '/privateAPI',
        headers: {},
        ...createRequestMock([])
      } as any as Request;

      // when
      handleOAuthRequestMiddleware(config)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });

    it('should not call #next when no token is provided', (done) => {

      // given
      const next = sinon.spy();

      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const requestMock = {
        originalUrl: '/privateAPI',
        headers: { authorization: ['auth1'] },
        ...createRequestMock([])
      } as any as Request;

      // when
      handleOAuthRequestMiddleware(config)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });
  });
});
