import { Logger, Token } from '.';

type GetTokenInfo<T = Record<string, unknown>> =
  (tokenInfoUrl: string, accessToken: string, logger?: Logger) => Promise<Token<T>>;

export {
  GetTokenInfo
};
