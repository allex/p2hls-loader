/// <reference path="./globals.d.ts" />

import * as Debug from "debug";
import {Segment, ILoader, ILoaderCallbacks} from "p2p-core";
import {isAbsUrl, hash} from "p2p-core/lib/utils";
import {Playlist} from './playlist';

const debug = Debug('p2phls:segment-manager');

type Settings = {
  /**
   * Number of segments for building up predicted forward segments sequence; used to predownload and share via P2P
   */
  prefetchCount: number;
};

const defaultSettings: Settings = {
  prefetchCount: 10
};

const genSegId = (swarmId: string, sn: number): string => `${swarmId}+${sn}`;

export class SegmentManager {

  private master: Playlist | null = null; // Optional store master playlist
  private playlists: Map<string, Playlist> = new Map(); // Cache all of the variant playlist
  private _queue: { sn: number, url: string }[] = [];
  private _current: { url: string, playlist: string } = { url: '', playlist: '' };
  private readonly _prefs: Settings;
  private readonly _loader: ILoader;

  constructor(loader: ILoader, settings?: Settings) {
    this._prefs = { ...defaultSettings, ...settings };
    this._loader = loader;
  }

  getSettings() {
    return this._prefs;
  }

  setPlaylists(list: hlsjs.ILevel[] | hlsjs.ILevel): this {
    if (!Array.isArray(list)) {
      list = <hlsjs.ILevel[]>[list]
    }
    list.forEach(level => {
      const url = level.url
      const playlist = Playlist.from(level)

      if (playlist.manifest.playlists) {
        this.master = playlist;
        this.playlists.forEach(playlist => playlist.swarmId = this.getSwarmId(playlist.url));
      } else {
        const swarmId = this.getSwarmId(url);
        if (swarmId !== url || !this.master) {
          playlist.swarmId = swarmId;
          this.playlists.set(url, playlist);
          this.updateSegments();
        }
      }
    })
    return this
  }

  loadSegment(url: string, callbacks: ILoaderCallbacks): void {
    const loc = this.getSegmentLoc(url);
    if (!loc) {
      callbacks.onError({ message: 'Segment location not found.', code: 'P2P_404' });
      return;
    }

    debug('fetch segment: %s', url);

    const { playlist, index } = loc;
    const sn = (playlist.manifest.mediaSequence || 0) + index;
    if (this._queue.length > 0) {
      const prev = this._queue[this._queue.length - 1];
      if (prev.sn !== sn - 1) {
        // Reset play _queue in case of segment loading out of sequence
        this._queue = [];
      }
    }

    const { swarmId } = playlist;
    const id = genSegId(swarmId, sn);
    const segment = Segment.new(id, url);

    this._current = { url, playlist: playlist.url };
    this._loader.load(segment, { swarmId }, callbacks);
    this._queue.push({ url, sn });
    this.loadSegments(playlist, index);
  }

  /**
   * Update the play _queue in order to sync with the player real segment.
   */
  syncSegment(url: string): void {
    debug('sync segment: %s', url);
    const urlIndex = this._queue.findIndex(segment => segment.url === url);
    if (urlIndex >= 0) {
      this._queue = this._queue.slice(urlIndex);
      this.updateSegments();
    }
  }

  abortSegment(url: string): void {
    debug('abort segment: %s', url);
    this._loader.abort(url)
  }

  destroy(): void {
    this._loader.destroy();
    this.master = null;
    this.playlists.clear();
    this._queue = [];
  }

  private updateSegments(): void {
    if (this._loader.isIdle) {
      return;
    }
    const loc = this.getSegmentLoc(this._current.url);
    if (loc) {
      this.loadSegments(loc.playlist, loc.index);
    } else { // the segment not found in current playlist
      const playlist = this.playlists.get(this._current.playlist);
      if (playlist) {
        this.loadSegments(playlist, 0);
      }
    }
  }

  private getSegmentLoc(url: string): { playlist: Playlist, index: number } | undefined {
    const entries = this.playlists.values();
    for (let entry = entries.next(); !entry.done; entry = entries.next()) {
      const playlist = entry.value;
      const index = playlist.indexOf(url);
      if (index >= 0) {
        return { playlist: playlist, index: index };
      }
    }

    return undefined;
  }

  private loadSegments(playlist: Playlist, offset: number): void {
    const segments: Segment[] = [];
    const { swarmId, manifest } = playlist
    const playlistSegments: any[] = manifest.segments;
    const initialSequence: number = +manifest.mediaSequence || 0;

    let priority = Math.max(0, this._queue.length - 1);

    for (let i = offset, prefetchCount = this._prefs.prefetchCount, l = playlistSegments.length; i < l && segments.length < prefetchCount; ++i) {
      const url = playlist.resolveSegUrlByIndex(i);
      const id = genSegId(swarmId, initialSequence + i);
      segments.push(Segment.new(id, url, priority++));
    }

    if (segments.length) {
      this._loader.setSwarmId(swarmId).prefetch(segments);
    }
  }

  private getSwarmId(playlist: string): string {
    const { master } = this

    if (master) {
      for (let url, i = 0, lists = master.manifest.playlists, l = lists.length; i < l; ++i) {
        url = lists[i].uri;
        url = isAbsUrl(url) ? url : master.baseUrl + url;
        if (url === playlist) {
          playlist = `${master.url.split("?")[0]}+V${i}`;
          break
        }
      }
    }

    return hash(playlist);
  }

} // end of SegmentManager
