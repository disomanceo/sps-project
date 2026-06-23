import React from 'react';

export function StatCard({ label, value, tone, icon: Icon }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {Icon && <Icon size={28} />}
    </article>
  );
}
