declare const AUTHORIZATION_CODE_GRANT: string;
declare const PASSWORD_CREDENTIALS_GRANT: string;
/**
 * Specifies the scopes needed to access this endpoint.
 *
 * Returns a function that validates the scopes against the
 * user scopes attached to the request.
 *
 * Usage:
 *  route.get('/path', requireScopes['scopeA', 'scopeB'], () => { // Do route work })
 *
 * @param scopes
 * @returns {function(any, any, any): undefined}
 */
declare function requireScopes(scopes: string[]): (req: any, res: any, next: any) => void;
/**
 * Helper function to get an access token for the specified scopes.
 *
 * Currently supports the following OAuth flows (specified by the `grant_type` property):
 *  - Resource Owner Password Credentials Grant (PASSWORD_CREDENTIALS_GRANT)
 *  - Authorization Code Grant (AUTHORIZATION_CODE_GRANT)
 *
 *  The options object can have the following properties:
 *  - credentialsDir string
 *  - grant_type string
 *  - accessTokenEndpoint string
 *  - realm string
 *  - scopes string optional
 *  - redirect_uri string optional
 *  - code string optional
 *
 * @param scopes
 * @param options
 * @returns {any}
 */
declare function getAccessToken(options: any): Promise<string>;
/**
 * Express middleware to extract and validate an access token.
 * Furthermore, it attaches the scopes matched by the token to the request for further usage.
 * If the token is not valid the request is rejected (with 401 Unauthorized).
 *
 * The options object can have the following properties:
 *  - publicEndpoints string[]
 *  - tokenInfoEndpoint string
 *
 * Usage:
 * app.use(handleAuthorziationBearer(options))
 *
 * @param options
 * @returns {function(any, any, any): undefined} express middleware
 */
declare function handleAuthorziationBearer(options: any): (req: any, res: any, next: any) => any;
export { handleAuthorziationBearer, requireScopes, getAccessToken, AUTHORIZATION_CODE_GRANT, PASSWORD_CREDENTIALS_GRANT };
