import { mountHeroScene as mount } from './scene/hero.js';
import type { MountHeroScene } from './types';

// The one door into the scene. HeroScene imports this file on demand, which keeps three.js and the
// physics engine out of the page's first load.
export const mountHeroScene: MountHeroScene = mount;
