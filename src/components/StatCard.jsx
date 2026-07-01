import React from 'react';

export function StatCard({ label, value, hint, tone, icon: Icon }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
      {Icon && <Icon size={28} />}
    </article>
  );
}
