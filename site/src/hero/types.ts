// The hero scene, as the page sees it. The scene itself is in ./scene and is only ever loaded through ./index.

export type HeroSceneHandle = {
  /** Light the top of the cube, for as long as a Launch app button is pointed at or focused. */
  setSpotlight(on: boolean): void;
  dispose(): void;
};

export type MountHeroScene = (
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean; dragMinWidth?: number; onProgress(fraction: number): void },
) => Promise<HeroSceneHandle>;
