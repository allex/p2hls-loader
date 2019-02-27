export declare class Playlist {
  readonly url: string;
  readonly manifest: any;
  static from(level: hlsjs.ILevel): Playlist;
  baseUrl: string;
  swarmId: string;
  isMaster: boolean;
  constructor(url: string, manifest: any);
  indexOf(url: string): number;
  resolveSegUrlByIndex(index: number): string;
  resolveSegUrl(url: string): string;
}
