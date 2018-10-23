import {Segment, ILoader, ILoaderCallbacks} from '@hitv/p2p-core';
import {isAbsUrl, hash, createDebug} from '@hitv/p2p-util';
import {Playlist} from './playlist';

const debug = createDebug('p2phls:segment-manager');

type ILevel = hlsjs.ILevel;
type SwarmIdGenerator = (url: string, options?: any) => string;
interface Settings {
  /* Number of segments for building up predicted forward segments sequence; used to predownload and share via P2P */
  prefetchCount: number;
  swarmId: SwarmIdGenerator;
}

const defaultSettings: Settings = {
  prefetchCount: 10,
  swarmId: (url: string, options: any = {}): string => url.split('?')[0]
};

const genSegId = (swarmId: string, sn: number): string => `${swarmId}+${sn}`;

export interface PlaylistInfo {
  levels: ILevel[];
  url: string | null;
}

export class SegmentManager {

  private master: Playlist | null = null; // Optional store master playlist
  private playlists: Map<string, Playlist> = new Map(); // Cache all of the variant playlist
  private _queue: Array<{ sn: number, url: string }> = [];
  private _current: { url: string, playlist: string } = { url: '', playlist: '' };
  private _genSwarmId: SwarmIdGenerator;
  private readonly _prefs: Settings;
  private readonly _loader: ILoader;

  constructor(loader: ILoader, settings: Settings) {
    settings = { ...defaultSettings, ...settings };
    this._prefs = settings;
    this._loader = loader;
    this._genSwarmId = (settings.swarmId || defaultSettings.swarmId).bind(this);
  }

  getSettings() {
    return this._prefs;
  }

  setPlaylists(info: PlaylistInfo): this {
    const { url, levels } = info;

    if (!levels) {
      debug('Invalid HLS.js playlist info', info);
      return this;
    }

    if (url && levels.length > 1) {
      // build master playlist

      const playlists: Playlist[] = [];
      const manifest = { playlists };

      levels.forEach((level) => {
        const ls = Playlist.from(level);
        this.playlists.set(ls.url, ls);
        playlists.push(ls);
      });

      this.master = new Playlist(url, manifest);
      this.playlists.forEach((ls) => ls.swarmId = this.getSwarmId(ls.url));

    } else {
      const level: ILevel = levels[0];
      const url = level.url;
      const playlist = Playlist.from(level); // convert
      const swarmId = this.getSwarmId(url);
      if (swarmId !== url || !this.master) {
        playlist.swarmId = swarmId;
        this.playlists.set(url, playlist);
        this.updateSegments();
      }
    }

    return this;
  }

  loadSegment(url: string, callbacks: ILoaderCallbacks): void {
    const loc = this.getSegmentLoc(url);
    if (!loc) {
      callbacks.onError({ message: 'Segment location not found.', code: 'P2P_404' });
      return;
    }

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

    debug('[%s] fetch segment: %s', swarmId, url);

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
    const urlIndex = this._queue.findIndex((segment) => segment.url === url);
    if (urlIndex >= 0) {
      this._queue = this._queue.slice(urlIndex);
      this.updateSegments();
    }
  }

  abortSegment(url: string): void {
    debug('abort segment: %s', url);
    this._loader.abort(url);
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
        return { playlist, index };
      }
    }

    return undefined;
  }

  private loadSegments(playlist: Playlist, offset: number): void {
    const segments: Segment[] = [];
    const { swarmId, manifest } = playlist;
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

  private getSwarmId(url: string): string {
    const { master, _genSwarmId } = this;
    if (master) {
      for (let k, i = 0, lists = master.manifest.playlists, l = lists.length; i < l; ++i) {
        k = lists[i].url;
        k = isAbsUrl(k) ? k : master.baseUrl + k;
        if (k === url) {
          url = `${_genSwarmId(master.url)}+V${i}`;
          break;
        }
      }
    }
    return hash(_genSwarmId(url));
  }

} // end of SegmentManager
