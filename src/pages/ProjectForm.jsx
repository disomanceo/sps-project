import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';

const emptyForm = {
  ID: '',
  ProjectName: '',
  FiscalYear: '2569',
  Department: '',
  OwnerName: '',
  Status: 'ยังไม่เริ่ม',
  BudgetSource: 'แผนปฏิบัติการ ปีการศึกษา 2569',
  ApprovedBudget: '',
  SpentBudget: '0',
  StartDate: '',
  EndDate: '',
  Objectives: '',
  QuantityTarget: '',
  QualityTarget: '',
  Activities: '',
  ResultSummary: '',
  Problems: ''
};

const statusOptions = [
  'ยังไม่เริ่ม',
  'ดำเนินการ',
  'เสร็จสิ้น',
  'ยกเลิก'
];

export function ProjectForm({ editingProject, projects, saveProject, onFormDone, onNavigate }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const departments = useMemo(() => {
    return Array.from(new Set(projects.map((item) => item.owner).filter(Boolean)));
  }, [projects]);

  useEffect(() => {
    if (!editingProject) {
      setForm(emptyForm);
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
      Status: editingProject.status || normalizeStatus(raw.Status),
      ApprovedBudget: raw.ApprovedBudget ?? editingProject.budget,
      SpentBudget: raw.SpentBudget ?? editingProject.spent,
      StartDate: toDateInput(raw.StartDate),
      EndDate: toDateInput(raw.EndDate)
    });
    setMessage('');
  }, [editingProject]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await saveProject({
        ...form,
        ApprovedBudget: Number(form.ApprovedBudget || 0),
        SpentBudget: String(Number(form.SpentBudget || 0))
      });
      setMessage('บันทึกข้อมูลโครงการเรียบร้อยแล้ว');
      setTimeout(onFormDone, 500);
    } catch (err) {
      setMessage(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = Boolean(form.ID);

  return (
    <>
      <PageHeader
        title={isEdit ? 'แก้ไขโครงการ' : 'เพิ่มโครงการ'}
        description={isEdit ? `ปรับปรุงข้อมูล ${form.ID}` : 'เพิ่มข้อมูลโครงการใหม่ลงฐานข้อมูล'}
        action={<button className="ghost-btn" onClick={() => onNavigate('projects')}>กลับรายการโครงการ</button>}
      />

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="form-section-title">ข้อมูลโครงการ</div>
        {message && <div className="form-message">{message}</div>}

        <div className="form-grid">
          <label>
            <span>รหัสโครงการ</span>
            <input value={form.ID} placeholder="ระบบจะสร้างให้อัตโนมัติเมื่อเพิ่มใหม่" onChange={(event) => update('ID', event.target.value)} />
          </label>
          <label>
            <span>ปีการศึกษา</span>
            <input value={form.FiscalYear} onChange={(event) => update('FiscalYear', event.target.value)} />
          </label>
          <label className="wide">
            <span>ชื่อโครงการ</span>
            <input required value={form.ProjectName} placeholder="ระบุชื่อโครงการ" onChange={(event) => update('ProjectName', event.target.value)} />
          </label>
          <label>
            <span>แผนงาน/ฝ่ายงาน</span>
            <input list="departments" value={form.Department} placeholder="เลือกหรือพิมพ์แผนงาน" onChange={(event) => update('Department', event.target.value)} />
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
              {statusOptions.map((status) => <option value={status} key={status}>{status}</option>)}
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
            <input type="number" min="0" step="0.01" value={form.SpentBudget} onChange={(event) => update('SpentBudget', event.target.value)} />
          </label>
          <label>
            <span>วันที่เริ่ม</span>
            <input type="date" value={form.StartDate} onChange={(event) => update('StartDate', event.target.value)} />
          </label>
          <label>
            <span>วันที่สิ้นสุด</span>
            <input type="date" value={form.EndDate} onChange={(event) => update('EndDate', event.target.value)} />
          </label>
          <label className="wide">
            <span>วัตถุประสงค์</span>
            <textarea value={form.Objectives} onChange={(event) => update('Objectives', event.target.value)} />
          </label>
          <label>
            <span>เป้าหมายเชิงปริมาณ</span>
            <textarea value={form.QuantityTarget} onChange={(event) => update('QuantityTarget', event.target.value)} />
          </label>
          <label>
            <span>เป้าหมายเชิงคุณภาพ</span>
            <textarea value={form.QualityTarget} onChange={(event) => update('QualityTarget', event.target.value)} />
          </label>
          <label className="wide">
            <span>กิจกรรมที่ดำเนินการ</span>
            <textarea value={form.Activities} onChange={(event) => update('Activities', event.target.value)} />
          </label>
          <label className="wide">
            <span>สรุปผลการดำเนินงาน</span>
            <textarea value={form.ResultSummary} onChange={(event) => update('ResultSummary', event.target.value)} />
          </label>
          <label className="wide">
            <span>ปัญหา/ข้อเสนอแนะ</span>
            <textarea value={form.Problems} onChange={(event) => update('Problems', event.target.value)} />
          </label>
        </div>

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

function normalizeStatus(status) {
  const statusMap = {
    draft: 'แบบร่าง',
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    active: 'ดำเนินการ',
    'กำลังดำเนินการ': 'ดำเนินการ',
    done: 'เสร็จสิ้น',
    not_started: 'ยังไม่เริ่ม',
    cancelled: 'ยกเลิก'
  };
  return statusMap[status] || status || 'ยังไม่เริ่ม';
}

function toDateInput(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) return text.slice(0, 10);
  return '';
}
