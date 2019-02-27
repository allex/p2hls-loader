import { SegmentManager } from './segment-manager';
interface HlsLoaderImplSettings {
  segMgr: SegmentManager;
  xhrLoader: Newable<hlsjs.IXhrLoader>;
}
export declare class HlsLoaderImpl {
  private _x;
  private _ctx;
  private _cfg;
  readonly _xhr: hlsjs.IXhrLoader;
  constructor(cfg: HlsLoaderImplSettings);
  load(context: hlsjs.Context, config: any, callbacks: hlsjs.Callbacks): void;
  destroy(): void;
  abort(): void;
}
export {};
