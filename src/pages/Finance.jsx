import React from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { money } from '../utils/format.js';

export function Finance({ projects }) {
  return (
    <>
      <PageHeader
        title="การเงินโครงการ"
        description="ควบคุมการรับเงิน ขอเบิกจ่าย และตรวจงบคงเหลือของโครงการ"
        action={<button className="primary-btn">ขอเบิกจ่าย</button>}
      />
      <section className="panel finance-list">
        {projects.map((project) => (
          <article key={project.id}>
            <div>
              <strong>{project.name}</strong>
              <span>{project.id} · {project.owner}</span>
            </div>
            <div className="money-block">
              <span>คงเหลือ</span>
              <b>{money(project.budget - project.spent)}</b>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
