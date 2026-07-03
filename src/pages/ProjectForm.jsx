import {
  FileImage,
  FileText,
  FileType2,
  Plus,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { PROJECT_STATUSES, normalizeStatus } from '../utils/projectMapper.js';
import { money } from '../utils/format.js';

const DEFAULT_BUDGET_SOURCES = ['เงินอุดหนุน', 'เงินรายได้สถานศึกษา', 'อื่นๆ'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const emptyForm = {
  ID: '',
  ProjectName: '',
  FiscalYear: '2569',
  Department: '',
  OwnerName: '',
  Status: 'ยังไม่เริ่ม',
  BudgetSource: DEFAULT_BUDGET_SOURCES[0],
  ApprovedBudget: '',
  SpentBudget: '0',
  StartDate: '',
  EndDate: '',
  Objectives: '',
  QuantityTarget: '',
  QualityTarget: '',
  Activities: '',
  UseActivities: false,
  ResultSummary: '',
  Problems: '',
  AttachmentsJSON: '[]'
};

const emptyActivity = {
  ID: '',
  ActivityName: '',
  OwnerName: '',
  Status: 'ยังไม่เริ่ม',
  BudgetSource: '',
  ApprovedBudget: '',
  SpentBudget: '0',
  StartDate: '',
  EndDate: '',
  Objectives: '',
  QuantityTarget: '',
  QualityTarget: '',
  ResultSummary: '',
  Problems: ''
};

export function ProjectForm({
  editingProject,
  projects,
  saveProject,
  uploadProjectFile,
  deleteProjectFile,
  onFormDone,
  onNavigate
}) {
  const [form, setForm] = useState(emptyForm);
  const [activities, setActivities] = useState([]);
  const [sourceDraft, setSourceDraft] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [removedAttachments, setRemovedAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const fileInputRef = useRef(null);

  const departments = useMemo(() => {
    return Array.from(new Set(projects.map((item) => item.owner).filter(Boolean)));
  }, [projects]);

  const budgetSources = useMemo(() => {
    const values = [...DEFAULT_BUDGET_SOURCES];
    projects.forEach((project) => {
      splitSources(project.raw?.BudgetSource).forEach((item) => values.push(item));
      (project.activities || []).forEach((activity) => {
        splitSources(activity.raw?.BudgetSource || activity.budgetSource).forEach((item) => values.push(item));
      });
    });
    splitSources(form.BudgetSource).forEach((item) => values.push(item));
    activities.forEach((activity) => splitSources(activity.BudgetSource).forEach((item) => values.push(item)));
    return Array.from(new Set(values.filter(Boolean)));
  }, [activities, form.BudgetSource, projects]);

  const selectedSources = useMemo(() => splitSources(form.BudgetSource), [form.BudgetSource]);
  const activityBudgetTotal = useMemo(
    () => activities.reduce((sum, item) => sum + Number(item.ApprovedBudget || 0), 0),
    [activities]
  );
  const activitySpentTotal = useMemo(
    () => activities.reduce((sum, item) => sum + Number(item.SpentBudget || 0), 0),
    [activities]
  );

  useEffect(() => {
    if (!editingProject) {
      setForm(emptyForm);
      setActivities([]);
      setAttachments([]);
      setPendingFiles([]);
      setRemovedAttachments([]);
      setSourceDraft('');
      setMessage('');
      return;
    }

    const raw = editingProject.raw || {};
    const existingAttachments = parseAttachments(
      raw.AttachmentsJSON || raw.Attachments || editingProject.attachments
    );

    setForm({
      ...emptyForm,
      ...raw,
      ID: raw.ID || editingProject.id,
      ProjectName: raw.ProjectName || editingProject.name,
      Department: raw.Department || editingProject.owner,
      OwnerName: raw.OwnerName || editingProject.lead,
      Status: normalizeStatus(raw.Status || editingProject.status),
      BudgetSource: raw.BudgetSource || emptyForm.BudgetSource,
      ApprovedBudget: raw.ApprovedBudget ?? editingProject.budget,
      SpentBudget: raw.SpentBudget ?? editingProject.spent,
      StartDate: toDateInput(raw.StartDate),
      EndDate: toDateInput(raw.EndDate),
      UseActivities: raw.UseActivities === 'TRUE' || editingProject.useActivities,
      AttachmentsJSON: JSON.stringify(existingAttachments)
    });

    setActivities((editingProject.activities || []).map((activity) => ({
      ...emptyActivity,
      ...(activity.raw || {}),
      ID: activity.id,
      ActivityName: activity.name,
      OwnerName: activity.raw?.OwnerName || activity.lead,
      Status: activity.status,
      BudgetSource: activity.raw?.BudgetSource || activity.budgetSource || '',
      ApprovedBudget: activity.raw?.ApprovedBudget ?? activity.budget,
      SpentBudget: activity.raw?.SpentBudget ?? activity.spent,
      StartDate: toDateInput(activity.raw?.StartDate || activity.startDate),
      EndDate: toDateInput(activity.raw?.EndDate || activity.endDate)
    })));

    setAttachments(existingAttachments);
    setPendingFiles([]);
    setRemovedAttachments([]);
    setSourceDraft('');
    setMessage('');
  }, [editingProject]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const updateActivity = (index, field, value) => {
    setActivities((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const toggleBudgetSource = (source) => {
    const next = selectedSources.includes(source)
      ? selectedSources.filter((item) => item !== source)
      : [...selectedSources, source];
    update('BudgetSource', next.join(', '));
  };

  const addBudgetSource = () => {
    const nextSource = sourceDraft.trim();
    if (!nextSource) return;
    const next = selectedSources.includes(nextSource) ? selectedSources : [...selectedSources, nextSource];
    update('BudgetSource', next.join(', '));
    setSourceDraft('');
  };

  const addActivity = () => {
    setActivities((current) => [
      ...current,
      {
        ...emptyActivity,
        OwnerName: form.OwnerName,
        BudgetSource: selectedSources[0] || '',
        StartDate: form.StartDate,
        EndDate: form.EndDate
      }
    ]);
  };

  const removeActivity = (index) => {
    setActivities((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleFilesSelected = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';

    const accepted = [];
    const errors = [];

    selected.forEach((file) => {
      if (!isAcceptedFile(file)) {
        errors.push(`${file.name}: รองรับเฉพาะรูปภาพ, PDF และ Word`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ไฟล์ต้องไม่เกิน 10 MB`);
        return;
      }
      const duplicate = [...attachments, ...pendingFiles].some(
        (item) => item.name === file.name && Number(item.size || 0) === file.size
      );
      if (!duplicate) accepted.push(file);
    });

    if (accepted.length) {
      setPendingFiles((current) => [...current, ...accepted]);
    }
    if (errors.length) showError(errors.join(' | '));
  };

  const removePendingFile = (index) => {
    setPendingFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const removeExistingAttachment = (attachment) => {
    setAttachments((current) => current.filter((item) => item.id !== attachment.id));
    if (attachment.id) {
      setRemovedAttachments((current) => [...current, attachment]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const approvedBudget = Number(form.ApprovedBudget || 0);
    const useActivities = Boolean(form.UseActivities);
    const cleanedActivities = useActivities
      ? activities
        .map((activity) => ({
          ...activity,
          ApprovedBudget: Number(activity.ApprovedBudget || 0),
          SpentBudget: String(Number(activity.SpentBudget || 0)),
          Status: normalizeStatus(activity.Status)
        }))
        .filter((activity) => activity.ActivityName.trim())
      : [];

    if (useActivities && cleanedActivities.length === 0) {
      showError('กรุณาเพิ่มกิจกรรมอย่างน้อย 1 รายการ หรือปิดตัวเลือกแยกงบตามกิจกรรม');
      setSaving(false);
      return;
    }

    try {
      // Save first so a newly created project receives an ID.
      const firstSaved = await saveProject({
        ...form,
        BudgetSource: selectedSources.join(', '),
        UseActivities: useActivities,
        ApprovedBudget: approvedBudget,
        SpentBudget: String(useActivities ? activitySpentTotal : Number(form.SpentBudget || 0)),
        Status: normalizeStatus(form.Status),
        AttachmentsJSON: JSON.stringify(attachments),
        activities: cleanedActivities
      });

      const projectId = firstSaved?.ID || firstSaved?.id || form.ID;
      if (!projectId) {
        throw new Error('บันทึกโครงการแล้ว แต่ระบบไม่ส่งรหัสโครงการกลับมา จึงยังอัปโหลดไฟล์ไม่ได้');
      }

      const uploaded = [];
      for (const file of pendingFiles) {
        setMessageType('success');
        setMessage(`กำลังอัปโหลด ${file.name}...`);
        const base64 = await readFileAsBase64(file);
        const result = await uploadProjectFile({
          projectId,
          projectName: form.ProjectName,
          file: {
            name: file.name,
            mimeType: file.type || inferMimeType(file.name),
            size: file.size,
            base64
          }
        });
        uploaded.push(result);
      }

      for (const attachment of removedAttachments) {
        try {
          await deleteProjectFile({ fileId: attachment.id, projectId });
        } catch (error) {
          console.warn('Unable to remove Drive file:', error);
        }
      }

      const finalAttachments = [...attachments, ...uploaded];
      if (pendingFiles.length || removedAttachments.length || form.ID !== projectId) {
        await saveProject({
          ...form,
          ID: projectId,
          BudgetSource: selectedSources.join(', '),
          UseActivities: useActivities,
          ApprovedBudget: approvedBudget,
          SpentBudget: String(useActivities ? activitySpentTotal : Number(form.SpentBudget || 0)),
          Status: normalizeStatus(form.Status),
          AttachmentsJSON: JSON.stringify(finalAttachments),
          activities: cleanedActivities
        });
      }

      setAttachments(finalAttachments);
      setPendingFiles([]);
      setRemovedAttachments([]);
      setMessageType('success');
      setMessage('บันทึกโครงการและไฟล์แนบเรียบร้อยแล้ว');
      setTimeout(onFormDone, 700);
    } catch (err) {
      showError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const showError = (text) => {
    setMessageType('error');
    setMessage(text);
  };

  const isEdit = Boolean(form.ID);
  const remainingActivityBudget = Number(form.ApprovedBudget || 0) - activityBudgetTotal;
  const activitySourceOptions = selectedSources.length > 0 ? selectedSources : budgetSources;

  return (
    <>
      <PageHeader
        title={isEdit ? 'แก้ไขโครงการ' : 'เพิ่มโครงการ'}
        description={isEdit ? `ปรับปรุงข้อมูล ${form.ID}` : 'เพิ่มข้อมูลโครงการใหม่ลงฐานข้อมูล'}
        action={<button className="ghost-btn" onClick={() => onNavigate('projects')}>กลับรายการโครงการ</button>}
      />

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="form-section-title">ข้อมูลโครงการ</div>
        {message && <div className={`form-message ${messageType}`}>{message}</div>}

        <div className="form-grid">
          <label>
            <span>รหัสโครงการ</span>
            <input value={form.ID} placeholder="ระบบจะสร้างให้อัตโนมัติเมื่อเพิ่มใหม่" onChange={(event) => update('ID', event.target.value)} />
          </label>
          <label>
            <span>ปีงบประมาณ</span>
            <input value={form.FiscalYear} onChange={(event) => update('FiscalYear', event.target.value)} />
          </label>
          <label className="wide">
            <span>ชื่อโครงการ</span>
            <input required value={form.ProjectName} placeholder="ระบุชื่อโครงการ" onChange={(event) => update('ProjectName', event.target.value)} />
          </label>
          <label>
            <span>แผนงาน</span>
            <input list="departments" value={form.Department} placeholder="วิชาการ / งบประมาณ / บุคคล / บริหารทั่วไป" onChange={(event) => update('Department', event.target.value)} />
            <datalist id="departments">
              {departments.map((item) => <option value={item} key={item} />)}
            </datalist>
          </label>
          <label>
            <span>ผู้รับผิดชอบ</span>
            <input value={form.OwnerName} placeholder="ชื่อผู้รับผิดชอบ" onChange={(event) => update('OwnerName', event.target.value)} />
          </label>
          <label>
            <span>สถานะ</span>
            <select value={form.Status} onChange={(event) => update('Status', event.target.value)}>
              {PROJECT_STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}
            </select>
          </label>
          <label>
            <span>งบจัดสรร</span>
            <input type="number" min="0" step="0.01" value={form.ApprovedBudget} onChange={(event) => update('ApprovedBudget', event.target.value)} />
          </label>
          <label>
            <span>ใช้จริง</span>
            <input type="number" min="0" step="0.01" value={form.UseActivities ? activitySpentTotal : form.SpentBudget} disabled={form.UseActivities} onChange={(event) => update('SpentBudget', event.target.value)} />
          </label>
          <label>
            <span>วันที่เริ่ม</span>
            <input type="date" value={form.StartDate} onChange={(event) => update('StartDate', event.target.value)} />
          </label>
          <label>
            <span>วันที่สิ้นสุด</span>
            <input type="date" value={form.EndDate} onChange={(event) => update('EndDate', event.target.value)} />
          </label>
          <label className="wide checkbox-label">
            <input type="checkbox" checked={Boolean(form.UseActivities)} onChange={(event) => update('UseActivities', event.target.checked)} />
            <span>แยกงบตามกิจกรรมภายใต้โครงการ</span>
          </label>
        </div>

        <section className="project-attachment-section">
          <div className="section-head">
            <div>
              <h3>ไฟล์แนบโครงการ</h3>
              <p>รองรับ JPG, PNG, WEBP, PDF, DOC และ DOCX ขนาดไม่เกิน 10 MB ต่อไฟล์</p>
            </div>
            <button type="button" className="ghost-btn attachment-upload-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> เลือกไฟล์
            </button>
            <input
              ref={fileInputRef}
              className="attachment-file-input"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              onChange={handleFilesSelected}
            />
          </div>

          <div className="attachment-grid">
            {attachments.map((attachment) => (
              <AttachmentItem
                key={attachment.id || attachment.url || attachment.name}
                item={attachment}
                existing
                onRemove={() => removeExistingAttachment(attachment)}
              />
            ))}
            {pendingFiles.map((file, index) => (
              <AttachmentItem
                key={`${file.name}-${file.size}-${index}`}
                item={file}
                pending
                onRemove={() => removePendingFile(index)}
              />
            ))}
            {!attachments.length && !pendingFiles.length && (
              <button type="button" className="attachment-empty" onClick={() => fileInputRef.current?.click()}>
                <Upload size={22} />
                <strong>ยังไม่มีไฟล์แนบ</strong>
                <span>คลิกเพื่อเลือกรูปภาพ PDF หรือ Word</span>
              </button>
            )}
          </div>
        </section>

        <section className="budget-source-section">
          <div className="section-head">
            <div>
              <h3>แหล่งงบประมาณของโครงการ</h3>
              <p>เลือกได้มากกว่า 1 แหล่ง และกิจกรรมย่อยสามารถเลือกใช้แหล่งที่ต่างกันได้</p>
            </div>
          </div>
          <div className="source-choice-list">
            {budgetSources.map((source) => (
              <label className="source-choice" key={source}>
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source)}
                  onChange={() => toggleBudgetSource(source)}
                />
                <span>{source}</span>
              </label>
            ))}
          </div>
          <div className="source-add-row">
            <input value={sourceDraft} placeholder="เพิ่มแหล่งงบประมาณ เช่น เงินบริจาค" onChange={(event) => setSourceDraft(event.target.value)} />
            <button type="button" className="ghost-btn" onClick={addBudgetSource}><Plus size={16} /> เพิ่ม</button>
          </div>
        </section>

        {form.UseActivities && (
          <section className="activity-form-section">
            <div className="section-head">
              <div>
                <h3>กิจกรรมภายใต้โครงการ</h3>
                <p>
                  งบกิจกรรมรวม {money(activityBudgetTotal)} บาท คงเหลือจัดสรร{' '}
                  <strong className={remainingActivityBudget < 0 ? 'danger-text' : 'success-text'}>
                    {money(remainingActivityBudget)} บาท
                  </strong>
                </p>
              </div>
              <button type="button" className="primary-btn" onClick={addActivity}><Plus size={16} /> เพิ่มกิจกรรม</button>
            </div>
            <div className="activity-form-list">
              {activities.map((activity, index) => (
                <div className="activity-form-card" key={activity.ID || index}>
                  <div className="activity-card-head">
                    <strong>กิจกรรมที่ {index + 1}</strong>
                    <button type="button" className="action-btn delete" onClick={() => removeActivity(index)} title="ลบกิจกรรม"><Trash2 size={16} /></button>
                  </div>
                  <div className="form-grid compact">
                    <label className="wide">
                      <span>ชื่อกิจกรรม</span>
                      <input value={activity.ActivityName} onChange={(event) => updateActivity(index, 'ActivityName', event.target.value)} placeholder="ระบุชื่อกิจกรรม" />
                    </label>
                    <label><span>ผู้รับผิดชอบกิจกรรม</span><input value={activity.OwnerName} onChange={(event) => updateActivity(index, 'OwnerName', event.target.value)} /></label>
                    <label>
                      <span>แหล่งงบประมาณ</span>
                      <select value={activity.BudgetSource} onChange={(event) => updateActivity(index, 'BudgetSource', event.target.value)}>
                        <option value="">เลือกแหล่งงบ</option>
                        {activitySourceOptions.map((source) => <option value={source} key={source}>{source}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>สถานะ</span>
                      <select value={activity.Status} onChange={(event) => updateActivity(index, 'Status', event.target.value)}>
                        {PROJECT_STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label><span>งบกิจกรรม</span><input type="number" min="0" step="0.01" value={activity.ApprovedBudget} onChange={(event) => updateActivity(index, 'ApprovedBudget', event.target.value)} /></label>
                    <label><span>ใช้จริง</span><input type="number" min="0" step="0.01" value={activity.SpentBudget} onChange={(event) => updateActivity(index, 'SpentBudget', event.target.value)} /></label>
                    <label><span>วันที่เริ่ม</span><input type="date" value={activity.StartDate} onChange={(event) => updateActivity(index, 'StartDate', event.target.value)} /></label>
                    <label><span>วันที่สิ้นสุด</span><input type="date" value={activity.EndDate} onChange={(event) => updateActivity(index, 'EndDate', event.target.value)} /></label>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <div className="empty-state">ยังไม่มีกิจกรรม กด “เพิ่มกิจกรรม” เพื่อเริ่มแยกงบ</div>}
            </div>
          </section>
        )}

        <div className="form-actions">
          <button type="button" className="ghost-btn" onClick={() => onNavigate('projects')}>ยกเลิก</button>
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'บันทึกโครงการ'}
          </button>
        </div>
      </form>
    </>
  );
}

function AttachmentItem({ item, existing = false, pending = false, onRemove }) {
  const mimeType = item.mimeType || item.type || inferMimeType(item.name);
  const isImage = mimeType.startsWith('image/');
  const Icon = getFileIcon(mimeType);

  return (
    <div className={`attachment-item ${pending ? 'is-pending' : ''}`}>
      <div className="attachment-preview">
        {isImage && existing && (item.thumbnailUrl || item.url) ? (
          <img src={item.thumbnailUrl || item.url} alt="" />
        ) : (
          <Icon size={24} />
        )}
      </div>
      <div className="attachment-copy">
        {existing && item.url ? (
          <a href={item.url} target="_blank" rel="noreferrer">{item.name}</a>
        ) : (
          <strong>{item.name}</strong>
        )}
        <span>{formatFileSize(item.size)}{pending ? ' • รออัปโหลด' : ''}</span>
      </div>
      <button type="button" className="attachment-remove" onClick={onRemove} title="นำไฟล์ออก">
        <X size={15} />
      </button>
    </div>
  );
}

function getFileIcon(mimeType) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf') return FileText;
  return FileType2;
}

function isAcceptedFile(file) {
  return ACCEPTED_FILE_TYPES.includes(file.type) || /\.(jpe?g|png|webp|pdf|docx?)$/i.test(file.name);
}

function inferMimeType(name = '') {
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  if (/\.docx$/i.test(name)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (/\.doc$/i.test(name)) return 'application/msword';
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.webp$/i.test(name)) return 'image/webp';
  return 'image/jpeg';
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`อ่านไฟล์ ${file.name} ไม่สำเร็จ`));
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.readAsDataURL(file);
  });
}

function parseAttachments(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function splitSources(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function toDateInput(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return text.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
