interface btoaInterface{
    (value: string): string;
}

declare var btoaVar: btoaInterface;

declare module "btoa" {
  export = btoaVar;
}
