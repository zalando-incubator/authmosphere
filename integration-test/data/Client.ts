
class Client {
  private _clientId: string;
  private _clientSecret: string;

  construct(clientId: string, clientSecret: string) {
    this._clientId = clientId;
    this._clientSecret = clientSecret;
  }

  get clientId(): string {
    return this._clientId;
  }

  get clientSecret(): string {
    return this._clientSecret;
  }
}

export { Client };
