'use strict';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var NodeURL = require('url');
var Express = require('express');
var oauth_tooling_1 = require('../../src/oauth-tooling');
chai.use(chaiAsPromised);
const expect = chai.expect;
// Setup API server
function setupTestEnvironment(authHeader, authServerApp) {
    authServerApp.post('/oauth2/access_token', function (req, res) {
        let valid = req.headers['authorization'] === authHeader;
        if (valid) {
            res
                .status(200)
                .send({ 'access_token': '4b70510f-be1d-4f0f-b4cb-edbca2c79d41' });
        }
        else {
            res
                .status(401)
                .send('Unauthorized');
        }
    });
}
describe('Password Credentials Grant integration test for client use cases', () => {
    let authenticationServer;
    let authServerApp;
    // Setup AuthServer
    beforeEach(() => {
        authServerApp = Express();
        authenticationServer = authServerApp.listen(30001);
    });
    // stop server after test
    afterEach(() => {
        authenticationServer.close();
    });
    it('should return the Bearer token', function () {
        //given
        setupTestEnvironment('Basic c3R1cHNfY2FtcC1mcm9udGVuZF80NTgxOGFkZC1jNDdkLTQ3MzEtYTQwZC1jZWExZmZkMGUwYzk6Nmk1Z2hCI1MyaUJLKSVidGI3JU14Z3hRWDcxUXIuKSo=', authServerApp);
        //when
        let bearer = oauth_tooling_1.getAccessToken({
            realm: 'services',
            scopes: 'campaing.edit_all campaign.read_all',
            accessTokenEndpoint: NodeURL.parse('http://127.0.0.1:30001/oauth2/access_token'),
            credentialsDir: 'integration-test/data/credentials',
            grant_type: oauth_tooling_1.PASSWORD_CREDENTIALS_GRANT
        })
            .then((token) => {
            return token;
        });
        //then
        return expect(bearer).to.become('4b70510f-be1d-4f0f-b4cb-edbca2c79d41');
    });
    it('should return an undefined access token', function () {
        //given
        setupTestEnvironment('invalid', authServerApp);
        //when
        let bearer = oauth_tooling_1.getAccessToken({
            realm: 'services',
            scopes: 'campaing.edit_all campaign.read_all',
            accessTokenEndpoint: NodeURL.parse('http://127.0.0.1:30001/oauth2/access_token'),
            credentialsDir: 'integration-test/data/credentials',
            grant_type: oauth_tooling_1.PASSWORD_CREDENTIALS_GRANT
        })
            .then((token) => {
            return token;
        });
        //then
        return expect(bearer).to.become(undefined);
    });
});
//# sourceMappingURL=password-grant-client.spec.js.map