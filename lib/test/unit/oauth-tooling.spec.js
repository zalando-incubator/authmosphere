'use strict';
var chai = require('chai');
// TODO write more unit tests
var oauth_tooling_1 = require('../../src/oauth-tooling');
let expect = chai.expect;
describe('OAuthService', () => {
    let responseMock;
    before(() => {
        responseMock = {};
        responseMock.status = function (status) {
            if (status) {
                this._status = status;
            }
            return this;
        };
        responseMock.type = function (p) {
            return this;
        };
        responseMock.sendStatus = function (status) {
            this.body = status;
            return this;
        };
        responseMock.end = function () {
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
            oauth_tooling_1.handleAuthorziationBearer({
                publicEndpoints: ['/public', '/healthcheck']
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
            oauth_tooling_1.handleAuthorziationBearer({
                publicEndpoints: ['/public', '/healthcheck']
            })({ 'originalUrl': '/privateAPI', headers: {} }, responseMock, next);
            // then
            expect(called).to.be.false;
        });
    });
});
//# sourceMappingURL=oauth-tooling.spec.js.map