import { BookOpenCheck, BriefcaseBusiness, ChevronDown, ChevronRight, Edit3, ExternalLink, FileImage, FileText, FileType2, Landmark, RefreshCw, Search, Settings2, Trash2, UsersRound } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { ProjectStatus } from '../components/ProjectStatus.jsx';
import { money } from '../utils/format.js';
import { PROJECT_STATUSES } from '../utils/projectMapper.js';
import '../styles/projects-compact.css';

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
                <th>ชื่อโครงการ</th>
                <th>แผนงาน</th>
                <th>ผู้รับผิดชอบ</th>
                <th>งบจัดสรร</th>
                <th>ใช้จริง</th>
                <th>คงเหลือ</th>
                <th>สถานะ</th>
                <th>ไฟล์</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => {
                const isExpanded = expandedProjectId === project.id;
                const remaining = project.budget - project.spent;
                return (
                  <React.Fragment key={project.id}>
                    <tr className={isExpanded ? 'is-expanded-row is-selected-project' : ''}>
                      <td data-label="#">{index + 1}</td>
                      <td data-label="ชื่อโครงการ" className="project-name-cell">
                        <button
                          className="project-name-link"
                          onClick={() => toggleProject(project.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <ProjectTypeIcon department={project.owner} />
                          <span>{project.name}</span>
                        </button>
                      </td>
                      <td data-label="แผนงาน">{cleanDepartment(project.owner)}</td>
                      <td data-label="ผู้รับผิดชอบ" className="nowrap">{project.lead}</td>
                      <td data-label="งบจัดสรร" className="money-cell">{money(project.budget)} บาท</td>
                      <td data-label="ใช้จริง" className="money-cell">{money(project.spent)} บาท</td>
                      <td data-label="คงเหลือ" className={`money-cell ${remaining < 0 ? 'danger-text' : ''}`}>{money(remaining)} บาท</td>
                      <td data-label="สถานะ"><ProjectStatus value={project.status} /></td>
                      <td data-label="ไฟล์">
                        <ProjectFileLink project={project} />
                      </td>
                      <td data-label="จัดการ">
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => onEditProject(project)} title="แก้ไข"><Edit3 size={16} /></button>
                          <button className="action-btn delete" onClick={() => { setDeletingProject(project); setDeleteMessage(''); }} title="ลบ"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="project-expanded-row">
                        <td colSpan="10">
                          <ProjectInlineDetail project={project} onEdit={() => onEditProject(project)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {!loading && filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="10">
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
  const hasActivities = project.useActivities && project.activities.length > 0;
  const firstActivityKey = hasActivities ? getActivityKey(project.activities[0], 0) : '';
  const [selectedActivityKey, setSelectedActivityKey] = useState(firstActivityKey);

  return (
    <div className="inline-detail-panel compact-project-detail">
      <div className="inline-detail-tools">
        <button className="ghost-btn compact-edit-btn" onClick={onEdit}>แก้ไขโครงการ</button>
      </div>

      {hasActivities ? (
        <section className="budget-tree activities-only compact-activity-tree" data-activity-count={project.activities.length}>
          <div className="tree-children">
            <div className="nested-activity-head">
              <div>
                <span className="nested-count">{project.activities.length}</span>
                <strong>กิจกรรมย่อยภายใต้โครงการ</strong>
                <span className="nested-badge">{project.activities.length} รายการ</span>
              </div>
            </div>
            {project.activities.map((activity, index) => {
              const activityKey = getActivityKey(activity, index);
              return (
                <ActivityTreeNode
                  activity={activity}
                  isLast={index === project.activities.length - 1}
                  index={index}
                  isSelected={selectedActivityKey === activityKey}
                  onSelect={() => setSelectedActivityKey(activityKey)}
                  key={activityKey}
                />
              );
            })}
          </div>
        </section>
      ) : (
        <div className="single-project-budget">
          <MetricLine
            items={[
              { label: 'งบจัดสรร', value: project.budget, tone: 'primary' },
              { label: 'ใช้จริง', value: project.spent, tone: 'blue' },
              { label: 'คงเหลือ', value: remaining, tone: remaining < 0 ? 'danger' : 'success' }
            ]}
          />
        </div>
      )}

      <div className="detail-grid detail-text-grid compact-detail-grid">
        <Detail label="ปีงบประมาณ" value={raw.FiscalYear || '2569'} />
        <Detail label="แผนงาน" value={cleanDepartment(project.owner)} />
        <Detail label="รูปแบบงบ" value={project.useActivities ? 'แยกตามกิจกรรม' : 'โครงการก้อนเดียว'} />
        <Detail label="สถานะ" value={project.status} />
        <Detail label="แหล่งงบประมาณ" value={raw.BudgetSource || '-'} />
      </div>
    </div>
  );
}

function ActivityTreeNode({ activity, isLast, index, isSelected, onSelect }) {
  const remaining = activity.budget - activity.spent;
  const progress = activity.budget > 0 ? Math.min((activity.spent / activity.budget) * 100, 100) : 0;

  return (
    <div className={`tree-child-row ${isLast ? 'is-last' : ''} ${isSelected ? 'is-selected-activity' : ''}`}>
      <button
        type="button"
        className="activity-index"
        onClick={onSelect}
        aria-label={`เลือกกิจกรรมที่ ${index + 1}: ${activity.name}`}
        aria-pressed={isSelected}
      >
        {index + 1}
      </button>

      <button
        type="button"
        className="tree-child-content activity-select-card"
        onClick={onSelect}
        aria-pressed={isSelected}
      >
        <div className="tree-title-row">
          <strong>{activity.name}</strong>
          <ProjectStatus value={activity.status} />
        </div>
        <MetricLine
          items={[
            { label: 'งบกิจกรรม', value: activity.budget, tone: 'primary' },
            { label: 'ใช้จริง', value: activity.spent, tone: 'blue' },
            { label: 'คงเหลือ', value: remaining, tone: remaining < 0 ? 'danger' : 'success' }
          ]}
        />
        <div className="activity-progress" aria-label={`ใช้ไป ${Math.round(progress)} เปอร์เซ็นต์`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="tree-meta-line">
          <span>ผู้รับผิดชอบ: <strong>{activity.lead || '-'}</strong></span>
          <span>แหล่งงบประมาณ: <strong>{activity.budgetSource || '-'}</strong></span>
          <span>ระยะเวลา: {formatPeriod(activity.startDate, activity.endDate)}</span>
        </div>
      </button>
    </div>
  );
}

function MetricLine({ items }) {
  return (
    <div className="metric-line">
      {items.map((item) => (
        <span className={`metric-item ${item.tone}`} key={item.label}>
          {item.label} <strong>{money(item.value)} บาท</strong>
        </span>
      ))}
    </div>
  );
}


function ProjectTypeIcon({ department }) {
  const config = getDepartmentIconConfig(department);
  const Icon = config.icon;

  return (
    <span
      className={`project-type-icon ${config.className}`}
      title={config.label}
      aria-label={config.label}
    >
      <Icon size={17} />
    </span>
  );
}

function getDepartmentIconConfig(value) {
  const department = cleanDepartment(value).toLowerCase();

  if (department.includes('วิชาการ')) {
    return {
      icon: BookOpenCheck,
      className: 'department-academic',
      label: 'ฝ่ายวิชาการ'
    };
  }

  if (department.includes('งบประมาณ') || department.includes('การเงิน')) {
    return {
      icon: Landmark,
      className: 'department-budget',
      label: 'ฝ่ายงบประมาณ'
    };
  }

  if (
    department.includes('บริหารทั่วไป') ||
    department.includes('ทั่วไป') ||
    department.includes('อาคาร') ||
    department.includes('สถานที่')
  ) {
    return {
      icon: Settings2,
      className: 'department-general',
      label: 'ฝ่ายบริหารทั่วไป'
    };
  }

  if (
    department.includes('บุคคล') ||
    department.includes('บุคลากร') ||
    department.includes('งานบุคคล')
  ) {
    return {
      icon: UsersRound,
      className: 'department-personnel',
      label: 'ฝ่ายบุคคล'
    };
  }

  return {
    icon: BriefcaseBusiness,
    className: 'department-other',
    label: department && department !== '-' ? `แผนงาน ${cleanDepartment(value)}` : 'โครงการ'
  };
}

function ProjectFileLink({ project }) {
  const attachments = getProjectAttachments(project);

  if (!attachments.length) {
    return <span className="project-file-empty" title="ยังไม่มีไฟล์แนบ">-</span>;
  }

  const visible = attachments.slice(0, 3);
  const remaining = attachments.length - visible.length;

  return (
    <div className="project-file-stack" aria-label={`${attachments.length} ไฟล์แนบ`}>
      {visible.map((attachment, index) => (
        <AttachmentLink attachment={attachment} index={index} key={attachment.id || attachment.url || `${attachment.name}-${index}`} />
      ))}
      {remaining > 0 && <span className="project-file-more">+{remaining}</span>}
    </div>
  );
}

function AttachmentLink({ attachment, index }) {
  const mimeType = attachment.mimeType || inferAttachmentMime(attachment.name);
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const Icon = isImage ? FileImage : isPdf ? FileText : FileType2;
  const className = isImage ? 'image' : isPdf ? 'pdf' : 'word';

  return (
    <a
      className={`project-file-icon ${className}`}
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      title={attachment.name || `ไฟล์ที่ ${index + 1}`}
      onClick={(event) => event.stopPropagation()}
    >
      {isImage && attachment.thumbnailUrl ? (
        <img src={attachment.thumbnailUrl} alt="" />
      ) : (
        <Icon size={16} />
      )}
    </a>
  );
}

function getProjectAttachments(project) {
  if (Array.isArray(project?.attachments)) return project.attachments;
  const raw = project?.raw || {};
  const value = raw.AttachmentsJSON || raw.Attachments;
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function inferAttachmentMime(name = '') {
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  if (/\.docx?$/i.test(name)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.webp$/i.test(name)) return 'image/webp';
  return 'image/jpeg';
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

function getActivityKey(activity, index) {
  return String(activity.id || activity.name || `activity-${index}`);
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
