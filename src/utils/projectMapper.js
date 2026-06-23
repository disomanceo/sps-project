export function mapSheetProject(row) {
  return {
    id: row.ID || '',
    name: row.ProjectName || 'ยังไม่ระบุชื่อโครงการ',
    owner: row.Department || '-',
    lead: row.OwnerName || '-',
    status: normalizeStatus(row.Status),
    budget: Number(row.ApprovedBudget || 0),
    spent: Number(row.SpentBudget || 0),
    progress: getProgress(row.Status),
    due: row.EndDate || '-',
    raw: row
  };
}

function normalizeStatus(status) {
  const value = String(status || '').trim();
  if (!value) return 'ยังไม่เริ่ม';
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
  if (statusMap[value]) return statusMap[value];
  return value;
}

function getProgress(status) {
  const value = normalizeStatus(status);
  if (value === 'เสร็จสิ้น') return 100;
  if (value === 'ดำเนินการ') return 45;
  if (value === 'รออนุมัติ') return 10;
  return 0;
}
