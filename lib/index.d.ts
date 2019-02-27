/// <reference path="types/globals.d.ts" />
import { EventEmitter } from 'events';
import { Events } from '@hitv/p2p-core';
import { SegmentManager, PlaylistInfo } from './segment-manager';
declare type HlsLoaderClass = Newable<hlsjs.IXhrLoader>;
interface EngineSettings {
  xhrLoader: HlsLoaderClass;
  loader: any;
  segments?: any;
}
export declare const version = "0.0.3";
export declare const isSupported: () => boolean;
export { Events };
export declare class Engine extends EventEmitter {
  private readonly _prefs;
  private readonly _loader;
  private readonly _segmgr;
  readonly peerId: string | undefined;
  readonly settings: any;
  readonly segMgr: SegmentManager;
  readonly xhrLoader: HlsLoaderClass;
  constructor(settings: EngineSettings);
  attach(hlsObj: any): void;
  loaderCreator(): HlsLoaderClass;
  syncSegment(url: string): void;
  setPlaylists(e: PlaylistInfo): SegmentManager;
  destroy(): void;
}
