import { Logger, Token } from '.';

type GetTokenInfo<T> = (tokenInfoUrl: string, accessToken: string, logger?: Logger) => Promise<Token<T>>;

export {
  GetTokenInfo
};
