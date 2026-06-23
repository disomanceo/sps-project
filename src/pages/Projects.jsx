import { Edit3, Eye, Filter, RefreshCw, Search, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { ProjectStatus } from '../components/ProjectStatus.jsx';
import { money } from '../utils/format.js';

export function Projects({ projects, loading, source, error, onNavigate, onEditProject, refreshProjects, deleteProject }) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [year, setYear] = useState('all');
  const [viewingProject, setViewingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const departments = useMemo(() => unique(projects.map((item) => item.owner)), [projects]);
  const years = useMemo(() => unique(projects.map((item) => item.raw?.FiscalYear || '2569')), [projects]);
  const statuses = ['ยังไม่เริ่ม', 'ดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก'];

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

  return (
    <>
      <PageHeader
        title="รายการโครงการ"
        description="ค้นหา ตรวจสอบสถานะ และปรับปรุงข้อมูลโครงการ"
        action={<button className="primary-btn" onClick={() => onNavigate('form')}>เพิ่มใหม่</button>}
      />

      <section className="project-table-card">
        <div className="project-filterbar">
          <label className="project-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา..." />
          </label>

          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="all">ทุกฝ่ายงาน</option>
            {departments.map((item) => <option value={item} key={item}>{cleanDepartment(item)}</option>)}
          </select>

          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {statuses.map((item) => <option value={item} key={item}>{item}</option>)}
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
          <span>
            {loading
              ? 'กำลังโหลดข้อมูลจากฐานข้อมูล...'
              : source === 'sheet'
                ? 'ใช้ข้อมูลจริงจาก Google Sheet ปัจจุบัน'
                : source === 'empty'
                  ? 'ฐานข้อมูลพร้อมแล้ว แต่ยังไม่มีข้อมูลโครงการ'
                  : 'ไม่สามารถโหลดข้อมูลจากฐานข้อมูลได้'}
          </span>
          {error && <small>{error}</small>}
        </div>

        <div className="project-table-wrap">
          <table className="project-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ปี</th>
                <th>ชื่อโครงการ</th>
                <th>ฝ่ายงาน</th>
                <th>ผู้รับผิดชอบ</th>
                <th>งบจัดสรร</th>
                <th>ใช้จริง</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr key={project.id}>
                  <td data-label="#">{index + 1}</td>
                  <td data-label="ปี">{project.raw?.FiscalYear || '2569'}</td>
                  <td data-label="ชื่อโครงการ" className="project-name-cell">
                    <strong>{project.name}</strong>
                  </td>
                  <td data-label="ฝ่ายงาน">{cleanDepartment(project.owner)}</td>
                  <td data-label="ผู้รับผิดชอบ" className="nowrap">{project.lead}</td>
                  <td data-label="งบจัดสรร" className="money-cell">{money(project.budget)} ฿</td>
                  <td data-label="ใช้จริง" className="money-cell">{money(project.spent)} ฿</td>
                  <td data-label="สถานะ"><ProjectStatus value={project.status} /></td>
                  <td data-label="จัดการ">
                    <div className="action-buttons">
                    <button className="action-btn view" onClick={() => setViewingProject(project)} title="ดูรายละเอียด"><Eye size={16} /></button>
                    <button className="action-btn edit" onClick={() => onEditProject(project)} title="แก้ไข"><Edit3 size={16} /></button>
                    <button className="action-btn delete" onClick={() => { setDeletingProject(project); setDeleteMessage(''); }} title="ลบ"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
              ))}
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

      {viewingProject && (
        <ProjectDetailModal project={viewingProject} onClose={() => setViewingProject(null)} />
      )}

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

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function cleanDepartment(value) {
  return String(value || '-').replace(/^\d+\.\s*/, '');
}

function ProjectDetailModal({ project, onClose }) {
  const raw = project.raw || {};
  return (
    <div className="modal-backdrop">
      <div className="project-modal">
        <div className="modal-head">
          <div>
            <h3>รายละเอียดโครงการ</h3>
            <p>{project.id}</p>
          </div>
          <button className="ghost-btn" onClick={onClose}>ปิด</button>
        </div>

        <div className="detail-grid">
          <Detail label="ชื่อโครงการ" value={project.name} wide />
          <Detail label="ปีการศึกษา" value={raw.FiscalYear || '2569'} />
          <Detail label="แผนงาน" value={cleanDepartment(project.owner)} />
          <Detail label="ผู้รับผิดชอบ" value={project.lead} />
          <Detail label="สถานะ" value={project.status} />
          <Detail label="งบจัดสรร" value={`${moneyValue(project.budget)} บาท`} />
          <Detail label="ใช้จริง" value={`${moneyValue(project.spent)} บาท`} />
          <Detail label="คงเหลือ" value={`${moneyValue(project.budget - project.spent)} บาท`} />
          <Detail label="แหล่งงบประมาณ" value={raw.BudgetSource || '-'} />
          <Detail label="วัตถุประสงค์" value={raw.Objectives || '-'} wide />
          <Detail label="กิจกรรมที่ดำเนินการ" value={raw.Activities || '-'} wide />
          <Detail label="สรุปผล" value={raw.ResultSummary || '-'} wide />
          <Detail label="ปัญหา/ข้อเสนอแนะ" value={raw.Problems || '-'} wide />
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ project, message, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <div className="confirm-modal">
        <h3>ยืนยันการลบโครงการ</h3>
        <p>ต้องการลบโครงการนี้ใช่ไหม?</p>
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

function moneyValue(value) {
  return Number(value || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
