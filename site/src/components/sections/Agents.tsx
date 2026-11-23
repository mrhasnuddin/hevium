'use client';

import type { CSSProperties } from 'react';
import { SectionHead } from '@/components/SectionHead';
import { SITE } from '@/config/site';
import { useWords } from '@/components/Words';
import { CYCLE } from '@/lib/agentSession';
import { AgentChart } from './AgentChart';
import { AgentPrompt } from './AgentPrompt';
import styles from './Agents.module.css';

// The section's one piece: a natural-language MCP prompt card beside a price chart. One number runs from
// 0 to 1 over the session on the piece itself, and both halves read it: the prompt types and sends, and
// each execution lands in the card and on the chart at the same moment. The still, shown when nothing may
// move, is the end of the session.
export function Agents() {
  const { SECTIONS, UI } = useWords().copy;
  return (
    <section className="section" id="agents" aria-labelledby="agents-title">
      <div className="container">
        <SectionHead id="agents" {...SECTIONS.agents} />
        <div className={`section-piece ${styles.stage}`} data-session style={{ '--cycle': `${CYCLE}s` } as CSSProperties}>
          <AgentPrompt />
          <AgentChart />
        </div>
        <div className="section-foot">
          <a className="btn btn-tonal" href={SITE.mcp} target="_blank" rel="noopener">
            {UI.connectAgent}
          </a>
        </div>
      </div>
    </section>
  );
}
