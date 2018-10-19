declare module "m3u8-parser" {
  export const Parser: any;
}

declare namespace hlsjs {
  type Fragment = {
    autoLevel: boolean,
    baseurl: string,
    bitrateTest?: boolean,
    cc: number,
    duration: number,
    levelkey: any,
    level: number,
    loaded: 0 | 1,
    loader: any,
    programDateTime?: string
    rawProgramDateTime?: Date
    relurl: string,
    sn: number,
    start: number,
    tagList: string[],
    title?: string,
    type: string,
    urlId: number,
    _byteRange?: any,
    [key: string]: any
  }

  // Adapter for hls.js level interface
  interface ILevel {
    averagetargetduration: number,
    endCC: number,
    endSN: number,
    fragments: Fragment[],
    initSegment: any | null,
    live: boolean,
    needSidxRanges: boolean
    startCC: number,
    startSN: number,
    startTimeOffset: number | null,
    targetduration: number,
    tload: number,
    totalduration: number,
    type: "VOD"
    url: string
    version: 3,
    [key: string]: any
  }

  type Response = { url: string, data?: any }
  type IXhrLoader = IHlsLoader;
  type Context = { url: string, frag: boolean }

  interface Callbacks {
    onSuccess(response: Response, stats: any, context: any, xhr?: any): void;
    onError(error: any, context?: any, xhr?: any): void;
    onTimeout(stats: any, context?: any): void;
  }

  interface IHlsLoader {
    load(context: any, config: any, callbacks: Callbacks): void;
    abort(): void;
    destroy(): void;
  }
}
