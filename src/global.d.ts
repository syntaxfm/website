/* eslint-disable @typescript-eslint/no-explicit-any */
declare const APP_VERSION: string;
declare module 'postcss-import' {
	export const at_import: any;
	export default at_import;
}
