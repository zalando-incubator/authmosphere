
// interface Fetch {
// 	(uri: string, options: Object): Promise<Object>
// }
//
// declare var fetch: Fetch;
//
// declare module "node-fetch" {
// 	export = fetch;
// }





declare var fetch: typeof window.fetch;

declare module "node-fetch" {
	export = fetch;
}
