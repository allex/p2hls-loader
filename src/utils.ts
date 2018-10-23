/**
 * Helpers utilities
 *
 * @author Allex Wang (allex.wxn@gmail.com) <http://fedor.io/>
 * MIT Licensed
 */

export async function fetchAny<T = string>(url: string, responseType: XMLHttpRequestResponseType): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = responseType;
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) { return; }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(xhr.statusText);
      }
    };
    xhr.send();
  });
}

export async function fetchText(url: string): Promise<string> {
  return fetchAny(url, 'text');
}

export async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  return fetchAny<ArrayBuffer>(url, 'arraybuffer');
}
