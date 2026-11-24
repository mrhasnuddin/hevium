'use client';

import { useEffect, useRef } from 'react';
import { asset } from '@/config/site';
import type { HeroSceneHandle } from '@/hero/types';
import styles from './HeroScene.module.css';

// One scene at a time may hold the canvas. In development React mounts every component twice, and
// two scenes starting on one canvas would trip over each other, so each mount waits its turn.
let turn: Promise<unknown> = Promise.resolve();

/** Viewport width (px) below which 3D logo dragging is locked so mobile scrolling stays undisturbed. */
export const HERO_DRAG_BREAKPOINT = 768;

/**
 * The hero's art: a poster, and over it the 3D scene wherever a device has WebGL2 on a GPU and
 * reduced motion off. Below `HERO_DRAG_BREAKPOINT` (768px), the 3D assets render with dragging
 * locked so touch/mobile scrolling is never interrupted.
 *
 * Whatever happens, `hevium:scene-ready` goes out exactly once, so the loader never waits in vain:
 * at once when there will be no scene, when the scene is up, when it fails, or after 2500ms.
 */
export function HeroScene() {
  const art = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = art.current!;
    const surface = canvas.current!;
    let handle: HeroSceneHandle | null = null;
    let gone = false;
    let said = false;
    const ready = () => {
      if (said || gone) return; // a mount that was thrown away, as React does once in development, says nothing
      said = true;
      document.documentElement.dataset.scene = 'ready'; // for a listener that starts after this has been said
      document.dispatchEvent(new CustomEvent('hevium:scene-ready'));
    };

    const off = new AbortController();
    const listen = (type: string, handler: (e: Event) => void) => document.addEventListener(type, handler, { signal: off.signal });
    // either Launch app button lights the cube for as long as it is pointed at or focused
    const launch = (on: boolean) => (e: Event) => {
      if (e.target instanceof Element && e.target.closest('[data-launch]')) handle?.setSpotlight(on);
    };
    listen('pointerover', launch(true));
    listen('pointerout', launch(false));
    listen('focusin', launch(true));
    listen('focusout', launch(false));

    const canWebGL2 = () => {
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
        (matchMedia(`(max-width: ${HERO_DRAG_BREAKPOINT - 1}px)`).matches ? testCanvas.getContext('webgl2') : null);
      if (!gl) return false;
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : '';
      return !/swiftshader|llvmpipe|software|basic render/i.test(renderer);
    };
    const able = !matchMedia('(prefers-reduced-motion: reduce)').matches && canWebGL2();
    let late: ReturnType<typeof setTimeout> | undefined;
    let rafId = 0;
    let idleId = 0;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (!able) queueMicrotask(ready); // not at once: a mount that is about to be thrown away must not speak
    else {
      late = setTimeout(ready, 2500);
      const startMount = () => {
        if (gone) return;
        const mine = turn.then(async () => {
          if (gone) return;
          const { mountHeroScene } = await import('@/hero');
          if (gone) return;
          const mounted = await mountHeroScene(surface, {
            reducedMotion: false,
            dragMinWidth: HERO_DRAG_BREAKPOINT,
            onProgress: (fraction) => document.dispatchEvent(new CustomEvent('hevium:scene-progress', { detail: fraction })),
          });
          if (gone) return mounted.dispose();
          handle = mounted;
          box.classList.add('is-live');
        });
        // a download or a mount that fails leaves the poster, and the next mount still gets its turn
        turn = mine
          .catch(() => {})
          .finally(() => {
            clearTimeout(late);
            ready();
          });
      };
      // Yield past first paint so the SVG poster and headline render before downloading Three.js + Rapier.
      rafId = requestAnimationFrame(() => {
        if (gone) return;
        if ('requestIdleCallback' in window) {
          idleId = window.requestIdleCallback(startMount, { timeout: 300 });
        } else {
          timerId = setTimeout(startMount, 0);
        }
      });
    }

    return () => {
      gone = true;
      off.abort();
      if (rafId) cancelAnimationFrame(rafId);
      if (idleId && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      clearTimeout(timerId);
      clearTimeout(late);
      handle?.dispose();
    };
  }, []);

  return (
    <div className={styles.art} ref={art} data-hero-art>
      {/* eslint-disable-next-line @next/next/no-img-element -- a static export: images are plain <img> */}
      <img className={styles.poster} src={asset('/brand/hevium-mark-mint.svg')} alt="" width={512} height={512} fetchPriority="high" decoding="sync" />
      <canvas className={styles.canvas} ref={canvas} aria-hidden="true" />
    </div>
  );
}
