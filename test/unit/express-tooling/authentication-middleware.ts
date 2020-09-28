import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import { Response, Request } from 'express';

import {
  authenticationMiddleware,
  AuthenticationMiddlewareOptions
} from '../../../src';
import { GetTokenInfo } from '../../../src/types';

chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

describe('express tooling', () => {

  const createRequestMock = (scopes: string[]): Request => ({
    get: (name: string) => name,
    $$tokeninfo: {
      scope: scopes
    }
  } as any as Request);

  const createResponseMock = (): Response => ({
    sendStatus: sinon.spy((status: string) => status)
  } as any as Response);

  describe('authenticationMiddleware', () => {

    it('should throw a TypeError, if tokenInfoEndpoint is undefined', () => {

      // given
      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: ''
      };

      // then
      expect(
        () => authenticationMiddleware(config)
      ).to.throw(TypeError);
    });

    it('should call #next on public endpoint', (done) => {

      // given
      const next = sinon.spy();

      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: '/oauth2/tokeninfo'
      };
      const requestMock = {
        ...createRequestMock([]),
        originalUrl: '/healthcheck',
        headers: {}
      } as any as Request;

      // when
      authenticationMiddleware(config)(requestMock, createResponseMock(), next);

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
        ...createRequestMock([]),
        originalUrl: '/privateAPI',
        headers: {}
      } as any as Request;

      // when
      authenticationMiddleware(config)(requestMock, createResponseMock(), next);

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
        ...createRequestMock([]),
        originalUrl: '/privateAPI',
        headers: { authorization: ['auth1'] }
      } as any as Request;

      // when
      authenticationMiddleware(config)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        done();
      });
    });

    it('should call onNotAuthenticatedHandler', (done) => {
      // given
      const next = sinon.spy();

      const middleWareconfig: AuthenticationMiddlewareOptions = {
        tokenInfoEndpoint: '/oauth2/tokeninfo',
        onNotAuthenticatedHandler: sinon.spy()
      };
      const requestMock = {
        ...createRequestMock([]),
        originalUrl: '/privateAPI',
        headers: { authorization: ['invalid auth'] }
      } as any as Request;

      // when
      authenticationMiddleware(middleWareconfig)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.not.have.been.called;
        // tslint:disable-next-line
        expect(middleWareconfig.onNotAuthenticatedHandler).to.have.been.called;
        done();
      });
    });

    it('should call custom getTokenInfo with correct parameters', (done) => {

      // given
      const next = sinon.spy();
      const getTokenInfo = sinon.stub().resolves({
        expires_in: 3600,
        scope: ['uid'],
        access_token: 'foo'
      });

      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: '/oauth2/tokeninfo',
        getTokenInfo
      };
      const requestMock = {
        ...createRequestMock([]),
        originalUrl: '/privateAPI',
        headers: { authorization: ['Bearer auth1'] }
      } as any as Request;

      // when
      authenticationMiddleware(config)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        expect(getTokenInfo).to.have.been.calledWith('/oauth2/tokeninfo', 'auth1');
        // authenticationMiddleware extends the request by $$tokeninfo, which is not part of the Request type
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect((requestMock as any).$$tokeninfo).to.be.deep.equal({
          // access_token should be deleted
          expires_in: 3600,
          scope: ['uid']
        });
        done();
      });
    });

    it('should call custom getTokenInfo and return custom token object', (done) => {

      // given
      const next = sinon.spy();
      const getTokenInfo: GetTokenInfo<{ foo: string }> = () =>
        Promise.resolve({
          access_token: 'foo',
          expires_in: 3600,
          scope: ['uid'],
          foo: 'bar'
        });

      const config = {
        publicEndpoints: ['/public', '/healthcheck'],
        tokenInfoEndpoint: '/oauth2/tokeninfo',
        getTokenInfo
      };
      const requestMock = {
        ...createRequestMock([]),
        originalUrl: '/privateAPI',
        headers: { authorization: ['Bearer auth1'] }
      } as any as Request;

      // when
      authenticationMiddleware(config)(requestMock, createResponseMock(), next);

      // then
      setTimeout(() => {
        // tslint:disable-next-line
        expect(next).to.have.been.called;
        // authenticationMiddleware extends the request by $$tokeninfo, which is not part of the Request type
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect((requestMock as any).$$tokeninfo).to.be.deep.equal({
          // access_token should be deleted
          expires_in: 3600,
          scope: ['uid'],
          foo: 'bar'
        });
        done();
      });
    });
  });
});
