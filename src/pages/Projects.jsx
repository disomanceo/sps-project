import { ChevronDown, ChevronRight, Edit3, RefreshCw, Search, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { ProjectStatus } from '../components/ProjectStatus.jsx';
import { money } from '../utils/format.js';
import { PROJECT_STATUSES } from '../utils/projectMapper.js';

export function Projects({ projects, loading, source, error, onNavigate, onEditProject, refreshProjects, deleteProject }) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [year, setYear] = useState('all');
  const [expandedProjectId, setExpandedProjectId] = useState('');
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const departments = useMemo(() => unique(projects.map((item) => item.owner)), [projects]);
  const years = useMemo(() => unique(projects.map((item) => item.raw?.FiscalYear || '2569')), [projects]);

  const filteredProjects = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return projects.filter((project) => {
      const text = `${project.id} ${project.name} ${project.owner} ${project.lead}`.toLowerCase();
      const matchQuery = !keyword || text.includes(keyword);
      const matchDepartment = department === 'all' || project.owner === department;
      const matchStatus = status === 'all' || project.status === status;
      const matchYear = year === 'all' || String(project.raw?.FiscalYear || '2569') === String(year);
      return matchQuery && matchDepartment && matchStatus && matchYear;
    });
  }, [department, projects, query, status, year]);

  const toggleProject = (projectId) => {
    setExpandedProjectId((current) => (current === projectId ? '' : projectId));
  };

  return (
    <>
      <PageHeader
        title="รายการโครงการ"
        description="ค้นหา กรอง และตรวจสอบงบประมาณของโครงการจาก Google Sheet"
        action={<button className="primary-btn" onClick={() => onNavigate('form')}>เพิ่มโครงการ</button>}
      />

      <section className="project-table-card">
        <div className="project-filterbar">
          <label className="project-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาโครงการ..." />
          </label>

          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="all">ทุกแผนงาน</option>
            {departments.map((item) => <option value={item} key={item}>{cleanDepartment(item)}</option>)}
          </select>

          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {PROJECT_STATUSES.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>

          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="all">ทุกปี</option>
            {years.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>

          <button className="refresh-btn" onClick={refreshProjects} title="รีเฟรชข้อมูล">
            <RefreshCw size={18} />
          </button>
        </div>

        <div className={`data-notice inside ${source}`}>
          <span>{getSourceMessage({ loading, source })}</span>
          {error && <small>{error}</small>}
        </div>

        <div className="project-table-wrap">
          <table className="project-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ปี</th>
                <th>ชื่อโครงการ</th>
                <th>แผนงาน</th>
                <th>ผู้รับผิดชอบ</th>
                <th>งบจัดสรร</th>
                <th>ใช้จริง</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => {
                const isExpanded = expandedProjectId === project.id;
                return (
                  <React.Fragment key={project.id}>
                    <tr className={isExpanded ? 'is-expanded-row' : ''}>
                      <td data-label="#">{index + 1}</td>
                      <td data-label="ปี">{project.raw?.FiscalYear || '2569'}</td>
                      <td data-label="ชื่อโครงการ" className="project-name-cell">
                        <button
                          className="project-name-link"
                          onClick={() => toggleProject(project.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span>{project.name}</span>
                        </button>
                      </td>
                      <td data-label="แผนงาน">{cleanDepartment(project.owner)}</td>
                      <td data-label="ผู้รับผิดชอบ" className="nowrap">{project.lead}</td>
                      <td data-label="งบจัดสรร" className="money-cell">{money(project.budget)} บาท</td>
                      <td data-label="ใช้จริง" className="money-cell">{money(project.spent)} บาท</td>
                      <td data-label="สถานะ"><ProjectStatus value={project.status} /></td>
                      <td data-label="จัดการ">
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => onEditProject(project)} title="แก้ไข"><Edit3 size={16} /></button>
                          <button className="action-btn delete" onClick={() => { setDeletingProject(project); setDeleteMessage(''); }} title="ลบ"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="project-expanded-row">
                        <td colSpan="9">
                          <ProjectInlineDetail project={project} onEdit={() => onEditProject(project)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {!loading && filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">{projects.length === 0 ? 'ยังไม่มีข้อมูลโครงการในฐานข้อมูล' : 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก'}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {deletingProject && (
        <DeleteConfirmModal
          project={deletingProject}
          message={deleteMessage}
          onCancel={() => setDeletingProject(null)}
          onConfirm={async () => {
            setDeleteMessage('กำลังลบข้อมูล...');
            try {
              await deleteProject(deletingProject.id);
              setDeletingProject(null);
            } catch {
              setDeleteMessage('ลบไม่สำเร็จ');
            }
          }}
        />
      )}
    </>
  );
}

function ProjectInlineDetail({ project, onEdit }) {
  const raw = project.raw || {};
  const remaining = project.budget - project.spent;

  return (
    <div className="inline-detail-panel">
      <div className="inline-detail-head">
        <div>
          <h3>{project.name}</h3>
          <p>{project.id || 'ยังไม่มีรหัสโครงการ'}</p>
        </div>
        <button className="ghost-btn" onClick={onEdit}>แก้ไขโครงการ</button>
      </div>

      <div className="detail-grid">
        <Detail label="ปีงบประมาณ" value={raw.FiscalYear || '2569'} />
        <Detail label="แผนงาน" value={cleanDepartment(project.owner)} />
        <Detail label="ผู้รับผิดชอบ" value={project.lead} />
        <Detail label="สถานะ" value={project.status} />
        <Detail label="ระยะเวลา" value={formatPeriod(raw.StartDate, raw.EndDate)} />
        <Detail label="รูปแบบงบ" value={project.useActivities ? 'แยกตามกิจกรรม' : 'โครงการก้อนเดียว'} />
      </div>

      <div className="budget-summary-grid compact">
        <BudgetBox label="งบจัดสรร" value={project.budget} />
        <BudgetBox label="ใช้จริง" value={project.spent} />
        <BudgetBox label="คงเหลือ" value={remaining} tone={remaining < 0 ? 'danger' : 'normal'} />
      </div>

      {project.useActivities ? (
        <section className="activity-detail-section">
          <div className="section-head">
            <h4>กิจกรรมภายใต้โครงการ</h4>
            <span>{project.activities.length} กิจกรรม</span>
          </div>
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>กิจกรรม</th>
                  <th>ผู้รับผิดชอบ</th>
                  <th>ระยะเวลา</th>
                  <th>งบกิจกรรม</th>
                  <th>ใช้จริง</th>
                  <th>คงเหลือ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {project.activities.map((activity) => (
                  <tr key={activity.id || activity.name}>
                    <td data-label="กิจกรรม"><strong>{activity.name}</strong></td>
                    <td data-label="ผู้รับผิดชอบ">{activity.lead}</td>
                    <td data-label="ระยะเวลา">{formatPeriod(activity.startDate, activity.endDate)}</td>
                    <td data-label="งบกิจกรรม" className="money-cell">{money(activity.budget)} บาท</td>
                    <td data-label="ใช้จริง" className="money-cell">{money(activity.spent)} บาท</td>
                    <td data-label="คงเหลือ" className="money-cell">{money(activity.budget - activity.spent)} บาท</td>
                    <td data-label="สถานะ"><ProjectStatus value={activity.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="single-budget-note">
          โครงการนี้ยังไม่แยกกิจกรรม รายการใช้จ่ายจะนับรวมที่ระดับโครงการโดยตรง
        </div>
      )}

      <div className="detail-grid detail-text-grid">
        <Detail label="แหล่งงบประมาณ" value={raw.BudgetSource || '-'} />
        <Detail label="วัตถุประสงค์" value={raw.Objectives || '-'} wide />
        <Detail label="กิจกรรมเดิม/หมายเหตุ" value={raw.Activities || '-'} wide />
        <Detail label="สรุปผล" value={raw.ResultSummary || '-'} wide />
        <Detail label="ปัญหา/ข้อเสนอแนะ" value={raw.Problems || '-'} wide />
      </div>
    </div>
  );
}

function DeleteConfirmModal({ project, message, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <div className="confirm-modal">
        <h3>ยืนยันการลบโครงการ</h3>
        <p>ต้องการลบโครงการนี้ใช่ไหม? กิจกรรมภายใต้โครงการจะถูกลบไปด้วย</p>
        <strong>{project.name}</strong>
        {message && <div className="delete-message">{message}</div>}
        <div className="modal-actions">
          <button className="ghost-btn" onClick={onCancel}>ยกเลิก</button>
          <button className="danger-btn" onClick={onConfirm}>ยืนยันลบ</button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, wide }) {
  return (
    <div className={wide ? 'detail-item wide' : 'detail-item'}>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function BudgetBox({ label, value, tone = 'normal' }) {
  return (
    <div className={`budget-box ${tone}`}>
      <span>{label}</span>
      <strong>{money(value)} บาท</strong>
    </div>
  );
}

function getSourceMessage({ loading, source }) {
  if (loading) return 'กำลังโหลดข้อมูลจากฐานข้อมูล...';
  if (source === 'sheet') return 'ใช้ข้อมูลจริงจาก Google Sheet ปัจจุบัน';
  if (source === 'empty') return 'ฐานข้อมูลพร้อมแล้ว แต่ยังไม่มีข้อมูลโครงการ';
  return 'ไม่สามารถโหลดข้อมูลจากฐานข้อมูลได้';
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function cleanDepartment(value) {
  return String(value || '-').replace(/^\d+\.\s*/, '');
}

function formatPeriod(startDate, endDate) {
  if (!startDate && !endDate) return '-';
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
