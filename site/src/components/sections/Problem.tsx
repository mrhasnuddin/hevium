import { SectionHead } from '@/components/SectionHead';
import { META } from '@/content/meta';
import { PROBLEMS, SECTIONS } from '@/content/sections';
import styles from './Problem.module.css';

export function Problem() {
  return (
    <section className="section" id="problem" aria-labelledby="problem-title">
      <div className="container">
        <div className={styles.whatIs}>
          <p className="eyebrow">What is Hevium</p>
          <p className={styles.statement} id="what-is-hevium">
            {META.whatIs}
          </p>
        </div>
        <SectionHead id="problem" {...SECTIONS.problem} />
        <ol className={styles.walls}>
          {PROBLEMS.map((wall, i) => (
            <li className="card" key={wall.title}>
              <p className="eyebrow">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="title">{wall.title}</h3>
              <p>{wall.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
