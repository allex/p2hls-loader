import {Segment} from '@hitv/p2p-core';
import {SegmentManager} from './segment-manager';

const DEFAULT_DOWNLOAD_SPEED = 12500; // bytes per millisecond

interface HlsLoaderImplSettings {
  segmentMgr: SegmentManager;
  xhrLoader: Newable<hlsjs.IXhrLoader>;
}

export class HlsLoaderImpl {
  private _x: any;
  private _ctx: hlsjs.Context | undefined;
  private _cfg: HlsLoaderImplSettings;

  get _xhr(): hlsjs.IXhrLoader {
    const cfg = this._cfg;
    return this._x || (this._x = new cfg.xhrLoader(cfg));
  }

  constructor(cfg: HlsLoaderImplSettings) {
    if (typeof cfg.xhrLoader !== 'function') {
      throw new Error('XHR loader required.');
    }
    this._cfg = cfg;
  }

  load(context: hlsjs.Context, config: any, callbacks: hlsjs.Callbacks): void {
    this._ctx = context;
    const { url, frag } = context;
    if (frag) {
      const now = performance.now();
      const stats = { trequest: now, tfirst: now, loaded: 0, tload: 0, total: 0 };
      this._cfg.segmentMgr.loadSegment(url, {
        onSuccess: (segment: Segment) => {
          const downloadSpeed = segment.downloadSpeed;
          const data = segment.data!.slice(0);
          const downloadTime = data.byteLength / ((downloadSpeed <= 0) ? DEFAULT_DOWNLOAD_SPEED : downloadSpeed);
          const len = data.byteLength;
          stats.tload = Math.max(stats.tfirst, performance.now());
          stats.trequest = Math.max(stats.tfirst, now - downloadTime);
          stats.loaded = stats.total = len;
          callbacks.onSuccess({ url, data }, stats, context);
        },
        onError: (error: any) => {
          this._xhr.load(context, config, callbacks);
        },
        onTimeout: (stats: any) => {
          this._xhr.load(context, config, callbacks);
        }
      });
    } else {
      this._xhr.load(context, config, callbacks);
    }
  }

  destroy(): void {
    this.abort();
  }

  abort(): void {
    const { _ctx, _cfg, _xhr } = this;
    if (_ctx) {
      _cfg.segmentMgr.abortSegment(_ctx.url);
    }
    if (_xhr) {
      _xhr.destroy();
    }
  }
}
