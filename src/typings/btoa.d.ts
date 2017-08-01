interface btoaInterface {
  (value: string): string;
}

declare const btoaVar: btoaInterface;

declare module 'btoa' {
  export = btoaVar;
}
