/// <reference path="./globals.d.ts" />

import {isAbsUrl} from "p2p-core/lib/utils";

// Playlist manager
export class Playlist {
  baseUrl: string;
  swarmId: string = "";

  constructor(readonly url: string, readonly manifest: any) {
    const pos = url.lastIndexOf("/");
    if (pos === -1) {
      throw new Error("Unexpected playlist URL format");
    }

    this.baseUrl = url.substring(0, pos + 1);
  }

  indexOf(url: string): number {
    for (let i = 0; i < this.manifest.segments.length; ++i) {
      if (url === this.resolveSegUrlByIndex(i)) {
        return i;
      }
    }

    return -1;
  }

  resolveSegUrlByIndex(index: number): string {
    return this.resolveSegUrl(this.manifest.segments[index].uri);
  }

  resolveSegUrl(url: string): string {
    return isAbsUrl(url) ? url : this.baseUrl + url;
  }

  // Transform hls.js {ILevel} instance to {Playlist}, This helper also cleanup some
  // noused properties.
  static from (level: hlsjs.ILevel): Playlist {
    const {
      url,
      startSN,
      fragments
    } = level
    const manifest = {
      ...level,
      mediaSequence: startSN,
      segments: fragments.map(f => {
        const { relurl } = f
        // sanitize and cleanup fragment fields
        return [ 'relurl', 'loader', 'levelkey', 'baseurl' ]
          .reduce((o: any, k: string) => (delete o[k], o), { ...f, uri: relurl })
      })
    }
    delete manifest['fragments']
    return new Playlist(url, manifest)
  }
}
