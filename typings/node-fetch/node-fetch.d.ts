declare var fetch: typeof window.fetch;

declare module "node-fetch" {
	export = fetch;
}
