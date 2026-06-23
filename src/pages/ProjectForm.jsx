import { Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { PROJECT_STATUSES, normalizeStatus } from '../utils/projectMapper.js';
import { money } from '../utils/format.js';

const emptyForm = {
  ID: '',
  ProjectName: '',
  FiscalYear: '2569',
  Department: '',
  OwnerName: '',
  Status: 'ยังไม่เริ่ม',
  BudgetSource: 'แผนปฏิบัติการ ปีงบประมาณ 2569',
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
  Problems: ''
};

const emptyActivity = {
  ID: '',
  ActivityName: '',
  OwnerName: '',
  Status: 'ยังไม่เริ่ม',
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

export function ProjectForm({ editingProject, projects, saveProject, onFormDone, onNavigate }) {
  const [form, setForm] = useState(emptyForm);
  const [activities, setActivities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const departments = useMemo(() => {
    return Array.from(new Set(projects.map((item) => item.owner).filter(Boolean)));
  }, [projects]);

  const activityBudgetTotal = useMemo(() => {
    return activities.reduce((sum, item) => sum + Number(item.ApprovedBudget || 0), 0);
  }, [activities]);

  const activitySpentTotal = useMemo(() => {
    return activities.reduce((sum, item) => sum + Number(item.SpentBudget || 0), 0);
  }, [activities]);

  useEffect(() => {
    if (!editingProject) {
      setForm(emptyForm);
      setActivities([]);
      setMessage('');
      return;
    }

    const raw = editingProject.raw || {};
    setForm({
      ...emptyForm,
      ...raw,
      ID: raw.ID || editingProject.id,
      ProjectName: raw.ProjectName || editingProject.name,
      Department: raw.Department || editingProject.owner,
      OwnerName: raw.OwnerName || editingProject.lead,
      Status: normalizeStatus(raw.Status || editingProject.status),
      ApprovedBudget: raw.ApprovedBudget ?? editingProject.budget,
      SpentBudget: raw.SpentBudget ?? editingProject.spent,
      StartDate: toDateInput(raw.StartDate),
      EndDate: toDateInput(raw.EndDate),
      UseActivities: raw.UseActivities === 'TRUE' || editingProject.useActivities
    });
    setActivities((editingProject.activities || []).map((activity) => ({
      ...emptyActivity,
      ...(activity.raw || {}),
      ID: activity.id,
      ActivityName: activity.name,
      OwnerName: activity.raw?.OwnerName || activity.lead,
      Status: activity.status,
      ApprovedBudget: activity.raw?.ApprovedBudget ?? activity.budget,
      SpentBudget: activity.raw?.SpentBudget ?? activity.spent,
      StartDate: toDateInput(activity.raw?.StartDate || activity.startDate),
      EndDate: toDateInput(activity.raw?.EndDate || activity.endDate)
    })));
    setMessage('');
  }, [editingProject]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateActivity = (index, field, value) => {
    setActivities((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const addActivity = () => {
    setActivities((current) => [...current, { ...emptyActivity, OwnerName: form.OwnerName, StartDate: form.StartDate, EndDate: form.EndDate }]);
  };

  const removeActivity = (index) => {
    setActivities((current) => current.filter((_, itemIndex) => itemIndex !== index));
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

    if (useActivities && activityBudgetTotal > approvedBudget) {
      showError('งบรวมของกิจกรรมต้องไม่เกินงบจัดสรรของโครงการ');
      setSaving(false);
      return;
    }

    try {
      await saveProject({
        ...form,
        UseActivities: useActivities,
        ApprovedBudget: approvedBudget,
        SpentBudget: String(useActivities ? activitySpentTotal : Number(form.SpentBudget || 0)),
        Status: normalizeStatus(form.Status),
        activities: cleanedActivities
      });
      setMessageType('success');
      setMessage('บันทึกข้อมูลโครงการเรียบร้อยแล้ว');
      setTimeout(onFormDone, 500);
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
            <span>แหล่งงบประมาณ</span>
            <input value={form.BudgetSource} onChange={(event) => update('BudgetSource', event.target.value)} />
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

        {form.UseActivities && (
          <section className="activity-form-section">
            <div className="section-head">
              <div>
                <h3>กิจกรรมภายใต้โครงการ</h3>
                <p>งบกิจกรรมรวม {money(activityBudgetTotal)} บาท คงเหลือจัดสรร {money(remainingActivityBudget)} บาท</p>
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
                    <label>
                      <span>ผู้รับผิดชอบกิจกรรม</span>
                      <input value={activity.OwnerName} onChange={(event) => updateActivity(index, 'OwnerName', event.target.value)} />
                    </label>
                    <label>
                      <span>สถานะ</span>
                      <select value={activity.Status} onChange={(event) => updateActivity(index, 'Status', event.target.value)}>
                        {PROJECT_STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>งบกิจกรรม</span>
                      <input type="number" min="0" step="0.01" value={activity.ApprovedBudget} onChange={(event) => updateActivity(index, 'ApprovedBudget', event.target.value)} />
                    </label>
                    <label>
                      <span>ใช้จริง</span>
                      <input type="number" min="0" step="0.01" value={activity.SpentBudget} onChange={(event) => updateActivity(index, 'SpentBudget', event.target.value)} />
                    </label>
                    <label>
                      <span>วันที่เริ่ม</span>
                      <input type="date" value={activity.StartDate} onChange={(event) => updateActivity(index, 'StartDate', event.target.value)} />
                    </label>
                    <label>
                      <span>วันที่สิ้นสุด</span>
                      <input type="date" value={activity.EndDate} onChange={(event) => updateActivity(index, 'EndDate', event.target.value)} />
                    </label>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="empty-state">ยังไม่มีกิจกรรม กด “เพิ่มกิจกรรม” เพื่อเริ่มแยกงบ</div>
              )}
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

function toDateInput(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return text.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
