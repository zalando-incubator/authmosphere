interface BodyParameters {
  grant_type: string;
  username?: string;
  password?: string;
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
}

export { BodyParameters };
