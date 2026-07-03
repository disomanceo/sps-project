export const PROJECT_STATUSES = ['ยังไม่เริ่ม', 'ดำเนินการ', 'เสร็จสิ้น', 'ยกเลิก'];

export function mapSheetProject(row) {
  const activities = Array.isArray(row.ActivitiesList) ? row.ActivitiesList.map(mapSheetActivity) : [];
  const activitySpent = activities.reduce((sum, item) => sum + item.spent, 0);
  const useActivities = row.UseActivities === true || row.UseActivities === 'TRUE' || activities.length > 0;
  const attachments = parseAttachments(row.AttachmentsJSON || row.Attachments);

  return {
    id: row.ID || '',
    name: row.ProjectName || 'ยังไม่ระบุชื่อโครงการ',
    owner: row.Department || '-',
    lead: row.OwnerName || '-',
    status: normalizeStatus(row.Status),
    budget: Number(row.ApprovedBudget || 0),
    spent: useActivities ? activitySpent : Number(row.SpentBudget || 0),
    useActivities,
    activities,
    attachments,
    progress: getProgress(row.Status),
    due: row.EndDate || '-',
    raw: { ...row, AttachmentsJSON: JSON.stringify(attachments) }
  };
}

export function mapSheetActivity(row) {
  return {
    id: row.ID || '',
    projectId: row.ProjectID || '',
    name: row.ActivityName || 'ยังไม่ระบุชื่อกิจกรรม',
    lead: row.OwnerName || '-',
    status: normalizeStatus(row.Status),
    budgetSource: row.BudgetSource || '',
    budget: Number(row.ApprovedBudget || 0),
    spent: Number(row.SpentBudget || 0),
    startDate: row.StartDate || '',
    endDate: row.EndDate || '',
    raw: row
  };
}

export function normalizeStatus(status) {
  const value = String(status || '').trim();
  if (!value) return 'ยังไม่เริ่ม';
  const statusMap = {
    draft: 'ยังไม่เริ่ม',
    pending: 'ยังไม่เริ่ม',
    approved: 'ดำเนินการ',
    active: 'ดำเนินการ',
    done: 'เสร็จสิ้น',
    not_started: 'ยังไม่เริ่ม',
    cancelled: 'ยกเลิก'
  };
  return statusMap[value] || value;
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

function getProgress(status) {
  const value = normalizeStatus(status);
  if (value === 'เสร็จสิ้น') return 100;
  if (value === 'ดำเนินการ') return 45;
  return 0;
}
