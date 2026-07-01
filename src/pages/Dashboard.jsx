import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Flag,
  ListChecks,
  PlayCircle,
  TrendingUp,
  WalletCards
} from 'lucide-react';
import React, { useMemo } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { ProjectStatus } from '../components/ProjectStatus.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { money } from '../utils/format.js';

export function Dashboard({ projects, stats, loading, source, error, onNavigate }) {
  const overview = useMemo(() => buildOverview(projects), [projects]);
  const progressProjects = projects.slice(0, 5);

  return (
    <>
      <PageHeader
        title="แดชบอร์ดภาพรวมโครงการ"
        description="ระบบบริหารโครงการและงบประมาณสถานศึกษา"
        action={<button className="primary-btn" onClick={() => onNavigate('form')}>เพิ่มโครงการ</button>}
      />

      <DataNotice loading={loading} source={source} error={error} />

      <div className="stat-grid compact-four">
        <StatCard label="โครงการทั้งหมด" value={stats.totalProjects} hint="รายการในปีงบประมาณ" tone="violet" icon={ClipboardCheck} />
        <StatCard label="งบประมาณรวม" value={money(stats.totalBudget)} hint="บาท" tone="blue" icon={WalletCards} />
        <StatCard label="ใช้จ่ายแล้ว" value={money(stats.usedBudget)} hint={`${overview.usedPercent}% ของงบประมาณรวม`} tone="rose" icon={CircleDollarSign} />
        <StatCard label="คงเหลือ" value={money(stats.remainingBudget)} hint={`${overview.remainingPercent}% ของงบประมาณรวม`} tone="green" icon={Clock3} />
      </div>

      <section className="panel journey-panel">
        <div className="panel-title compact">
          <div>
            <h3>เส้นทางโครงการ</h3>
            <span className="small-note">ติดตามสถานะการดำเนินงานตลอดวงจรโครงการ</span>
          </div>
        </div>
        <div className="journey-steps">
          <JourneyStep number="01" title="จัดทำโครงการ" icon={Flag} count={stats.totalProjects} tone="blue" items={['สร้างโครงการ', 'กำหนดงบประมาณ', 'มอบหมายผู้รับผิดชอบ']} />
          <JourneyStep number="02" title="ดำเนินกิจกรรม" icon={PlayCircle} count={overview.inProgress} tone="cyan" items={['เริ่มกิจกรรม', 'ใช้งบประมาณ', 'บันทึกความคืบหน้า']} />
          <JourneyStep number="03" title="ติดตามงบประมาณ" icon={TrendingUp} count={overview.overBudget} tone="amber" items={['ตรวจงบคงเหลือ', 'เฝ้าระวังงบติดลบ', 'ทบทวนการใช้จ่าย']} />
          <JourneyStep number="04" title="สิ้นสุดโครงการ" icon={CheckCircle2} count={overview.done} tone="green" items={['สรุปผล', 'ปิดโครงการ', 'รายงานผล']} />
        </div>
      </section>

      <div className="dashboard-grid refined">
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>ภาพรวมความคืบหน้าโครงการ</h3>
              <span className="small-note">แสดง 5 โครงการล่าสุดสำหรับตรวจงานอย่างรวดเร็ว</span>
            </div>
            <button className="text-btn" onClick={() => onNavigate('projects')}>ดูทั้งหมด</button>
          </div>
          <div className="progress-table">
            <div className="progress-table-head">
              <span>#</span>
              <span>ชื่อโครงการ</span>
              <span>สถานะ</span>
              <span>งบประมาณ / ใช้จริง</span>
              <span>คงเหลือ</span>
            </div>
            {progressProjects.map((project, index) => {
              const remaining = project.budget - project.spent;
              const usage = project.budget > 0 ? Math.min((project.spent / project.budget) * 100, 100) : 0;
              return (
                <article className="progress-project-row" key={project.id || project.name}>
                  <span className="row-index">{index + 1}</span>
                  <div className="progress-project-name">
                    <strong>{project.name}</strong>
                    <span>{project.lead || '-'} · {project.owner || '-'}</span>
                  </div>
                  <ProjectStatus value={project.status} />
                  <div className="budget-mini">
                    <strong>{money(project.budget)} / {money(project.spent)}</strong>
                    <div className="progress-track">
                      <span style={{ width: `${usage}%` }} />
                    </div>
                  </div>
                  <strong className={remaining < 0 ? 'danger-text' : 'success-text'}>{money(remaining)}</strong>
                </article>
              );
            })}
            {!loading && projects.length === 0 && (
              <div className="empty-state">ยังไม่มีข้อมูลโครงการในฐานข้อมูล</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>รายการที่ต้องติดตาม</h3>
              <span className="small-note">ประเด็นที่ควรเปิดดูเป็นลำดับแรก</span>
            </div>
            <button className="text-btn" onClick={() => onNavigate('projects')}>ดูทั้งหมด</button>
          </div>
          <div className="follow-list">
            <FollowItem icon={AlertTriangle} tone="red" title="ใช้งบเกินแผน" detail="โครงการ/กิจกรรมที่คงเหลือติดลบ" count={overview.overBudget} />
            <FollowItem icon={PlayCircle} tone="orange" title="ยังไม่เริ่ม" detail="โครงการที่ยังไม่เริ่มดำเนินการ" count={overview.notStarted} />
            <FollowItem icon={ListChecks} tone="blue" title="มีกิจกรรมย่อย" detail="โครงการที่แยกงบตามกิจกรรม" count={overview.withActivities} />
            <FollowItem icon={Clock3} tone="violet" title="ใช้ระดับโครงการ" detail="โครงการที่ยังไม่แยกกิจกรรม" count={overview.singleBudget} />
            <FollowItem icon={CheckCircle2} tone="green" title="เสร็จสิ้น" detail="โครงการที่ปิดงานเรียบร้อยแล้ว" count={overview.done} />
          </div>
        </section>
      </div>
    </>
  );
}

function JourneyStep({ number, title, icon: Icon, count, tone, items }) {
  return (
    <article className={`journey-step ${tone}`}>
      <div className="journey-icon">
        <Icon size={24} />
        <span>{number}</span>
      </div>
      <div>
        <h4>{title}</h4>
        <ul>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <strong>{count} โครงการ</strong>
      </div>
    </article>
  );
}

function FollowItem({ icon: Icon, tone, title, detail, count }) {
  return (
    <article className={`follow-item ${tone}`}>
      <div className="follow-icon"><Icon size={20} /></div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <b>{count}</b>
    </article>
  );
}

function buildOverview(projects) {
  const totalBudget = projects.reduce((sum, item) => sum + item.budget, 0);
  const usedBudget = projects.reduce((sum, item) => sum + item.spent, 0);
  const overBudget = projects.filter((item) => item.spent > item.budget).length;
  const withActivities = projects.filter((item) => item.useActivities && item.activities.length > 0).length;
  const done = projects.filter((item) => item.status === 'เสร็จสิ้น').length;

  return {
    usedPercent: percent(usedBudget, totalBudget),
    remainingPercent: percent(totalBudget - usedBudget, totalBudget),
    notStarted: projects.filter((item) => item.status === 'ยังไม่เริ่ม').length,
    inProgress: projects.filter((item) => item.status === 'ดำเนินการ').length,
    done,
    overBudget,
    withActivities,
    singleBudget: Math.max(projects.length - withActivities, 0)
  };
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 10000) / 100;
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
