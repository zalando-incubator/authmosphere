interface FetchInterface {
    (url: string, init?: any): Promise<any>;
}

declare var fetch: FetchInterface;

declare module 'node-fetch' {
  export = fetch;
}
