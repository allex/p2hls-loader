import {isAbsUrl, isArray, isNil} from "@hitv/p2p-util";

// Playlist manager
export class Playlist {
  baseUrl: string;
  swarmId: string = "";
  isMaster: boolean = false;

  constructor(readonly url: string, readonly manifest: any) {
    const pos = url.lastIndexOf("/");
    if (pos === -1) {
      throw new Error("Unexpected playlist URL format");
    }

    if (!manifest.segments || !isNil(manifest.level)) {
      this.isMaster = true;
    }

    this.baseUrl = url.substring(0, pos + 1);
  }

  indexOf(url: string): number {
    if (this.isMaster) return -1;

    for (let i = 0; i < this.manifest.segments.length; ++i) {
      if (url === this.resolveSegUrlByIndex(i)) {
        return i;
      }
    }

    return -1;
  }

  resolveSegUrlByIndex(index: number): string {
    return this.resolveSegUrl(this.manifest.segments[index].url);
  }

  resolveSegUrl(url: string): string {
    return isAbsUrl(url) ? url : this.baseUrl + url;
  }

  // Transform hls.js {ILevel} instance to {Playlist}, This helper also cleanup some
  // noused properties.
  static from (level: hlsjs.ILevel): Playlist {
    const {
      startSN,
      fragments
    } = level;

    let url = level.url;

    // master playlists's url may be a swarm of m3u8 url list
    if (isArray(url)) {
      url = url[0];
    }

    const manifest: any = { ...level, url };

    if (fragments) {
      // is a ts segments level playlist, sanitize and cleanup fragment fields
      manifest.mediaSequence = startSN;
      manifest.segments = fragments.map(f => {
        const { relurl } = f;
        return [ "relurl", "loader", "levelkey", "baseurl" ]
          .reduce((o: any, k: string) => (delete o[k], o), { ...f, url: relurl });
      });
      delete manifest["fragments"];
    }

    return new Playlist(url, manifest);
  }
}
