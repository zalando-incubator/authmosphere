interface FormUrlencodedInterface {
	(value: string): string;
}

declare var formUrlencodedVar: FormUrlencodedInterface;

declare module 'form-urlencoded' {
	export = formUrlencodedVar;
}
