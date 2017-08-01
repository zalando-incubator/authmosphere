interface formUrlencodedInterface {
  (obj: object, options?: object): string;
}

declare const formUrlencodedVar: formUrlencodedInterface;

declare module "form-urlencoded" {
  export = formUrlencodedVar;
}
