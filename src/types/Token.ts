type CustemTokenPart<T> = {
  [P in keyof T]: T[P]
};

type StaticTokenPart = {
  access_token: string;
  expires_in?: number;
  scope?: string[];
  token_type?: string;
  local_expiry?: number;
}

type Token<T = {}> = CustemTokenPart<T> & StaticTokenPart;

export {
  StaticTokenPart,
  CustemTokenPart,
  Token,
 };
