/**
 * Helpers utilities
 *
 * @author Allex Wang (allex.wxn@gmail.com) <http://fedor.io/>
 * MIT Licensed
 */
export declare function fetchAny<T = string>(url: string, responseType: XMLHttpRequestResponseType): Promise<T>;
export declare function fetchText(url: string): Promise<string>;
export declare function fetchBuffer(url: string): Promise<ArrayBuffer>;
