interface BtoaInterface {
    (value: string): string;
}

declare var btoaVar: BtoaInterface;

declare module 'btoa' {
	export = btoaVar;
}
