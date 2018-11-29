import {Segment} from '@hitv/p2p-core';
import {SegmentManager} from './segment-manager';

interface HlsLoaderImplSettings {
  segMgr: SegmentManager;
  xhrLoader: Newable<hlsjs.IXhrLoader>;
}

const now = (performance && (() => performance.now())) || Date.now || (() => +new Date); /* tslint:disable-line */

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
      const startTime = now();
      const stats = { trequest: startTime, tfirst: startTime, loaded: 0, tload: 0, total: 0, speed: 0 };
      this._cfg.segMgr.loadSegment(url, {
        onSuccess: (segment: Segment) => {
          const data = segment.data!.slice(0);
          const timeStamp = now();
          const timeElapsed = timeStamp - startTime;
          let speed = segment.downloadSpeed;
          if (speed <= 0) {
            speed = data.byteLength / timeElapsed;
          }
          const size = data.byteLength;
          const downloadTime = size / speed;
          stats.tload = Math.max(stats.tfirst, now());
          stats.trequest = Math.max(stats.tfirst, startTime - downloadTime);
          stats.loaded = stats.total = size;
          stats.speed = speed * 1000 / 1024 ; // 'kb/s';
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
      _cfg.segMgr.abortSegment(_ctx.url);
    }
    if (_xhr) {
      _xhr.destroy();
    }
  }
}
