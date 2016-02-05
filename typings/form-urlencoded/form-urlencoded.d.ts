interface formUrlencodedInterface{
  (value: string): string;
}

declare var formUrlencodedVar: formUrlencodedInterface;

declare module "form-urlencoded" {
  export = formUrlencodedVar;
}
