import { ILoader, ILoaderCallbacks } from '@hitv/p2p-core';
declare type ILevel = hlsjs.ILevel;
declare type SwarmIdGenerator = (url: string, options?: any) => string;
interface Settings {
  prefetchCount: number;
  swarmId: SwarmIdGenerator;
}
export interface PlaylistInfo {
  levels: ILevel[];
  url: string | null;
}
export declare class SegmentManager {
  private master;
  private playlists;
  private _queue;
  private _current;
  private _genSwarmId;
  private readonly _prefs;
  private readonly _loader;
  constructor(loader: ILoader, settings: Settings);
  getSettings(): Settings;
  setPlaylists(info: PlaylistInfo): this;
  loadSegment(url: string, callbacks: ILoaderCallbacks): void;
  /**
   * Update the play _queue in order to sync with the player real segment.
   */
  syncSegment(url: string): void;
  abortSegment(url: string): void;
  destroy(): void;
  private renewQueue;
  private updateSegments;
  private getSegmentLoc;
  private loadSegments;
  private getSwarmId;
}
export {};
