/// <reference path="../types/globals.d.ts" />

import {EventEmitter} from 'events';
import {Events, SegmentLoader} from '@hitv/p2p-core';
import {pipeEvents, createDebug} from '@hitv/p2p-util';
import {SegmentManager, PlaylistInfo} from './segment-manager';
import {HlsLoaderImpl} from './hlsjs-loader';

type ILevel = hlsjs.ILevel;
type IHlsLoader = hlsjs.IHlsLoader;

type HlsLoaderClass = Newable<hlsjs.IXhrLoader>;

interface EngineSettings {
  xhrLoader: HlsLoaderClass;
  loader: any;
  segments?: any;
}

const debug = createDebug('p2phls:engine');

export const version = '__VERSION__';

export const isSupported = (): boolean => SegmentLoader.isSupported();

export { Events };

export class Engine extends EventEmitter {
  private readonly _prefs: EngineSettings;
  private readonly _loader: SegmentLoader;
  private readonly _segmgr: SegmentManager;

  get peerId(): string | undefined {
    return this._loader.peerId;
  }

  get settings(): any {
    return {
      loader: this._loader.getSettings(),
      segments: this._segmgr.getSettings()
    };
  }

  get segmentMgr(): SegmentManager {
    return this._segmgr;
  }

  get xhrLoader(): HlsLoaderClass {
    return this._prefs.xhrLoader;
  }

  constructor(settings: EngineSettings) {
    debug('hls-loader initialized. (v%s)', version);

    super();

    const { loader, segments } = settings;
    const p2pLoader = new SegmentLoader({ ...loader });

    this._prefs = settings;
    this._loader = p2pLoader;
    this._segmgr = new SegmentManager(p2pLoader, segments);

    // Forward loader bindings.
    pipeEvents(this, p2pLoader, Object.values(Events));
  }

  attach(hlsObj: any): void {
    if (!hlsObj) {
      throw new Error('Invalid HLS.js instance to attaching.');
    }
    initHlsJsEvents(hlsObj, this);
  }

  loaderCreator(): HlsLoaderClass {
    return hlsLoaderFactory(HlsLoaderImpl, this);
  }

  syncSegment(url: string) {
    this._segmgr.syncSegment(url);
  }

  setPlaylists(e: PlaylistInfo) {
    return this._segmgr.setPlaylists(e);
  }

  destroy() {
    this._loader.destroy();
    this._segmgr.destroy();
  }
}

function hlsLoaderFactory(LoaderImpl: Newable<any>, engine: Engine): HlsLoaderClass {
  const { segmentMgr, xhrLoader } = engine;
  const L = ((config: any): IHlsLoader => {
    return new LoaderImpl({ segmentMgr, xhrLoader, ...config });
  }) as any;
  L.getEngine = () => engine;
  return L as HlsLoaderClass;
}

// EventArgs of hls.js
interface ILevelLoadedArgs { details: ILevel; level: number; id: number; stats: any; networkDetails: any; }
interface IManifestLoadedArgs { levels: ILevel[]; url: string | null; stats: any; networkDetails: any | null; }

function initHlsJsEvents(hls: any, engine: Engine): void {
  const Hls = hls.constructor;
  const { Events: HLSEvents } = Hls;

  const handleLevelLoaded = (e: any) => {
    const info: any = { ...e };
    info.levels = [ info.details ];
    delete info.details;
    engine.setPlaylists(info);
  };

  hls.on(HLSEvents.MANIFEST_PARSED, (type: string, e: any) => {
    debug('hls.js manifest parsed: %o', e);
  });

  hls.on(HLSEvents.MANIFEST_LOADED, (type: string, e: IManifestLoadedArgs) => {
    debug('hls.js manifest loaded: %o', e);
  });

  hls.on(HLSEvents.LEVEL_LOADED, (type: string, e: ILevelLoadedArgs) => {
    debug('hls.js level loaded: %o', e);
    handleLevelLoaded(e);
  });

  hls.on(HLSEvents.FRAG_CHANGED, (type: string, data: any) => {
    const url = data && data.frag ? data.frag.url : undefined;
    engine.syncSegment(url);
  });

  hls.on(HLSEvents.DESTROYING, () => {
    engine.destroy();
  });

  hls.on(HLSEvents.ERROR, (type: string, e: any) => {
    console.error(type, e, e.err);
  });
}
