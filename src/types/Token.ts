type Token<CustomTokenPart = Record<string | number | symbol, unknown>> = CustomTokenPart & {
  access_token: string,
  expires_in?: number,
  scope?: string[],
  token_type?: string,
  local_expiry?: number
};

export {
  Token
};
