import { AppLink } from '@/components/AppLink';
import { HeroScene } from '@/components/HeroScene';
import { HERO } from '@/content/sections';
import styles from './Hero.module.css';

// The first screen: the headline and two buttons over the 3D scene, which fills it.
export function Hero() {
  const at = HERO.title.indexOf(HERO.highlight);
  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-title" data-hero>
      <HeroScene />
      <div className={styles.copy}>
        <h1 className={styles.title} id="hero-title">
          {HERO.title.slice(0, at)}
          <span className="hl">{HERO.highlight}</span>
          {HERO.title.slice(at + HERO.highlight.length)}
        </h1>
        <p className={`row ${styles.actions}`}>
          <AppLink target="app" placement="hero" className="btn btn-primary" data-launch>
            Launch app
          </AppLink>
          <a className="btn btn-secondary" href="#how">
            How it works
          </a>
        </p>
      </div>
    </section>
  );
}
