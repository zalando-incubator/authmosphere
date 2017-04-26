interface TokenInfo {
  access_token: string;
  cn?: boolean;
  expires_in: number;
  grant_type?: string;
  open_id?: string;
  realm?: String;
  scope: String[];
  token_type?: string;
  uid?: string;
  local_expiry?: number;
}
export { TokenInfo };
