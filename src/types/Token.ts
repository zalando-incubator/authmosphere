interface Token {
  access_token: string;
  expires_in?: number;
  scope?: string[];
  token_type?: string;
  local_expiry?: number;
  [key: string]: number | string | string[] | undefined;
}

export { Token };
