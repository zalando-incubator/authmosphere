type Token<CustomTokenPart = {}> = CustomTokenPart & {
  access_token: string;
  expires_in?: number;
  scope?: string[];
  token_type?: string;
  local_expiry?: number;
};

export {
  Token
};
