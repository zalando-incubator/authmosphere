type StaticTokenPart = {
  access_token: string;
  expires_in?: number;
  scope?: string[];
  token_type?: string;
  local_expiry?: number;
};

type Token<T = any> = T & StaticTokenPart;

export {
  StaticTokenPart,
  Token
 };
