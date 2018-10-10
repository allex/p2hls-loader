/// <reference path="./globals.d.ts" />

import * as Debug from "debug";
import {EventEmitter} from "events";
import {Events, SegmentLoader} from "p2p-core";
import {pipeEvents} from "p2p-core/lib/utils";
import {SegmentManager} from "./segment-manager";
import {HlsLoaderImpl} from "./hlsjs-loader";

type ILevel = hlsjs.ILevel;
type IHlsLoader = hlsjs.IHlsLoader;

type HlsLoaderClass = Newable<hlsjs.IXhrLoader>;

type EngineSettings = {
  xhrLoader: HlsLoaderClass,
  loader: any,
  segments?: any
};

const debug = Debug('p2phls:engine');

const version = "__VERSION__";

const isSupported = (): boolean => {
  return SegmentLoader.isSupported();
};

const initHlsJsPlayer = (hlsObj: any): void => {
  if (hlsObj && hlsObj.config && hlsObj.config.loader && typeof hlsObj.config.loader.getEngine === "function") {
    initHlsJsEvents(hlsObj, hlsObj.config.loader.getEngine());
  }
};

export {
  version,
  Events,
  isSupported,
  initHlsJsPlayer
};

export class Engine extends EventEmitter {
  private readonly _prefs: EngineSettings;
  private readonly _loader: SegmentLoader;
  private readonly _segmgr: SegmentManager;

  get peerId(): string | undefined {
    return this._loader.peerId;
  }

  get settings(): EngineSettings {
    return this._prefs;
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

  loaderCreator(): HlsLoaderClass {
    return hlsLoaderFactory(HlsLoaderImpl, this);
  }

  getSettings(): any {
    return {
      segments: this._segmgr.getSettings(),
      loader: this._loader.getSettings()
    };
  }

  syncSegment(url: string) {
    this._segmgr.syncSegment(url);
  }

  setPlaylists(list: ILevel[]) {
    return this._segmgr.setPlaylists(list)
  }

  destroy() {
    this._loader.destroy();
    this._segmgr.destroy();
  }
};

function hlsLoaderFactory (LoaderImpl: Newable<any>, engine: Engine): HlsLoaderClass {
  const { segmentMgr, xhrLoader } = engine;
  const L = <any> ((config: any): IHlsLoader => {
    return new LoaderImpl({ segmentMgr, xhrLoader, ...config })
  });
  L.getEngine = () => engine;
  return <HlsLoaderClass>L;
}

function initHlsJsEvents(hlsObj: any, engine: Engine): void {
  const Hls = hlsObj.constructor
  const { Events: HLSEvents } = Hls;

  hlsObj.on(HLSEvents.MANIFEST_PARSED, (type: string, e: {
    levels: ILevel[],
    firstLevel: number,
    stats: any,
    audio: boolean,
    video: boolean,
    altAudio: boolean
  }) => {
    debug('hlsjs manifest parsed: %o', e);
  })

  hlsObj.on(HLSEvents.MANIFEST_LOADED, (type: string, e: {
    levels: ILevel[],
    url: string | null,
    stats: any,
    networkDetails: any | null
  }) => {
    engine.setPlaylists(e.levels.map(o => o.details))
  });

  hlsObj.on(HLSEvents.FRAG_CHANGED, (type: string, data: any) => {
    const url = data && data.frag ? data.frag.url : undefined;
    engine.syncSegment(url);
  });

  hlsObj.on(HLSEvents.DESTROYING, () => {
    engine.destroy();
  });

  hlsObj.on(HLSEvents.ERROR, (type: string, e: any) => {
    console.error(type, e)
  })
}
