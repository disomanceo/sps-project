import { CircleDollarSign, ClipboardCheck, Clock3, WalletCards } from 'lucide-react';
import React from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { ProjectStatus } from '../components/ProjectStatus.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { money } from '../utils/format.js';

export function Dashboard({ projects, stats, loading, source, error, onNavigate }) {
  return (
    <>
      <PageHeader
        title="แดชบอร์ดภาพรวม"
        description="ติดตามโครงการ งบประมาณ และรายการที่ต้องดำเนินการต่อ"
        action={<button className="primary-btn" onClick={() => onNavigate('form')}>เพิ่มโครงการ</button>}
      />

      <DataNotice loading={loading} source={source} error={error} />

      <div className="stat-grid">
        <StatCard label="โครงการทั้งหมด" value={stats.totalProjects} tone="violet" icon={ClipboardCheck} />
        <StatCard label="งบประมาณรวม" value={money(stats.totalBudget)} tone="blue" icon={WalletCards} />
        <StatCard label="ใช้จ่ายแล้ว" value={money(stats.usedBudget)} tone="rose" icon={CircleDollarSign} />
        <StatCard label="คงเหลือ" value={money(stats.remainingBudget)} tone="dark" icon={Clock3} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title">
            <h3>ความคืบหน้าโครงการ</h3>
            <button className="text-btn" onClick={() => onNavigate('projects')}>ดูทั้งหมด</button>
          </div>
          <div className="progress-list">
            {projects.slice(0, 5).map((project) => (
              <div className="progress-row" key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <span>{project.owner} · {project.lead}</span>
                </div>
                <b>{project.progress}%</b>
                <div className="progress-track">
                  <span style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            ))}
            {!loading && projects.length === 0 && (
              <div className="empty-state">ยังไม่มีข้อมูลโครงการในฐานข้อมูล</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>รายการที่ต้องติดตาม</h3>
            <span className="small-note">{stats.pending} รายการรออนุมัติ</span>
          </div>
          <div className="activity-list">
            {projects.slice(0, 8).map((project) => (
              <article key={project.id}>
                <ProjectStatus value={project.status} />
                <div>
                  <strong>{project.name}</strong>
                  <span>ครบกำหนด {project.due}</span>
                </div>
              </article>
            ))}
            {!loading && projects.length === 0 && (
              <div className="empty-state">ยังไม่มีรายการที่ต้องติดตาม</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function DataNotice({ loading, source, error }) {
  const label = loading
    ? 'กำลังโหลดข้อมูลจากฐานข้อมูล...'
    : source === 'sheet'
      ? 'ใช้ข้อมูลจริงจาก Google Sheet ปัจจุบัน'
      : source === 'empty'
        ? 'ฐานข้อมูลพร้อมแล้ว แต่ยังไม่มีข้อมูลโครงการ'
        : 'ไม่สามารถโหลดข้อมูลจากฐานข้อมูลได้';

  return (
    <div className={`data-notice ${source}`}>
      <span>{label}</span>
      {error && <small>{error}</small>}
    </div>
  );
}
