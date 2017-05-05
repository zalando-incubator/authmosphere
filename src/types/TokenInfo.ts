interface TokenInfo {
  access_token: string;
  expires_in: number;
  grant_type?: string;
  scope: String[];
  token_type?: string;
  uid?: string;
  local_expiry?: number;
}

export { TokenInfo };
